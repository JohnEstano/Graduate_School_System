<?php

namespace App\Services;

use App\Models\User;
use App\Models\DefenseRequest;
use Illuminate\Support\Facades\Log;

class AdviserSuggestionService
{
    public function __construct(protected LegacyPortalClient $legacy) {}

    /**
     * Suggest adviser for a student by inspecting class schedule instructors or existing historical defense requests.
     * @param User $student
     * @param array|null $legacySession
     * @param string|null $program
     * @param string|null $periodId Optional explicit legacy period id to force switch before fetching schedule
     * @return array{suggestion:?string,source:?string}|null
     */
    public function suggestForStudent(User $student, ?array $legacySession, ?string $program = null, ?string $periodId = null): ?array
    {
        if (!$student->school_id) return null;
        // 1. If we have previous defense requests by this student with adviser set, reuse most recent.
        $recent = DefenseRequest::where('school_id', $student->school_id)
            ->whereNotNull('defense_adviser')
            ->orderByDesc('id')
            ->value('defense_adviser');
        if ($recent) {
            return ['suggestion' => $recent, 'source' => 'previous-defense'];
        }
        // Attempt legacy schedule inference if session available
        if ($legacySession) {
            try {
                if ($periodId) {
                    $this->legacy->setStudentClassSchedulePeriod($legacySession, $periodId);
                }
                $html = $this->legacy->fetchStudentClassScheduleHtml($legacySession);
                $parsed = $this->legacy->parseStudentClassSchedule($html);
                $instructors = $parsed['instructors'] ?? [];
                if (!empty($instructors)) {
                    $studentLast = $student->last_name ? strtoupper($student->last_name) : null;
                    $match = null;
                    foreach ($instructors as $inst) {
                        if ($studentLast && str_contains(strtoupper($inst), $studentLast)) { $match = $inst; break; }
                    }
                    $chosen = $match ?: $instructors[0];
                    return ['suggestion' => $chosen, 'source' => 'class-schedule'];
                }
            } catch (\Throwable $e) {
                Log::debug('AdviserSuggestionService schedule phase failed: '.$e->getMessage());
            }
        }

        // Program history fallback (most frequent adviser in same program)
        if ($program) {
            $freq = DefenseRequest::selectRaw('defense_adviser, COUNT(*) as c')
                ->where('program', $program)
                ->whereNotNull('defense_adviser')
                ->groupBy('defense_adviser')
                ->orderByDesc('c')
                ->limit(1)
                ->first();
            if ($freq && $freq->defense_adviser) {
                return ['suggestion' => $freq->defense_adviser, 'source' => 'program-history'];
            }
        }

        // Coordinator fallback: user with role Coordinator possibly matching program (best-effort)
        $coord = User::where('role','Coordinator')
            ->when($program, function($q) use ($program) { $q->where('program', $program); })
            ->orderByDesc('updated_at')
            ->first();
        if ($coord) {
            return ['suggestion' => $coord->name, 'source' => 'coordinator-fallback'];
        }
        return null;
    }

    /**
     * Collect multiple candidate adviser names for a student.
     * Returns array:
     *  [
     *    'instructors'=>[],
     *    'previous_adviser'=>?string,
     *    'program_top_advisers'=>[ ['name'=>..., 'count'=>N], ... ],
     *    'selected_period_id'=>?string
     *  ]
     */
    public function collectCandidates(User $student, ?array $legacySession, ?string $program = null, ?string $periodId = null): array
    {
        $previous = DefenseRequest::where('school_id', $student->school_id)
            ->whereNotNull('defense_adviser')
            ->orderByDesc('id')
            ->value('defense_adviser');

        $instructors = [];
        $selectedPeriod = null;
        $periods = [];
        if ($legacySession) {
            try {
                if ($periodId) {
                    $this->legacy->setStudentClassSchedulePeriod($legacySession, $periodId);
                }
                $html = $this->legacy->fetchStudentClassScheduleHtml($legacySession);
                $parsed = $this->legacy->parseStudentClassSchedule($html);
                $instructors = $parsed['instructors'] ?? [];
                $selectedPeriod = $parsed['selected_period_id'] ?? null;
                $periods = $parsed['periods'] ?? [];

                // If no instructors in current period, try earlier periods (historical) to find any instructor names.
                if (empty($instructors) && !empty($periods)) {
                    $original = $selectedPeriod;
                    $tries = 0;
                    foreach ($periods as $p) {
                        if ($tries >= 5) break; // safety limit
                        if ($p['id'] === $selectedPeriod) continue;
                        $ok = $this->legacy->setStudentClassSchedulePeriod($legacySession, $p['id']);
                        if (!$ok) continue;
                        $h2 = $this->legacy->fetchStudentClassScheduleHtml($legacySession);
                        $parsed2 = $this->legacy->parseStudentClassSchedule($h2);
                        $newInst = $parsed2['instructors'] ?? [];
                        if (!empty($newInst)) {
                            $instructors = array_values(array_unique(array_merge($instructors, $newInst)));
                            $selectedPeriod = $parsed2['selected_period_id'] ?? $p['id'];
                            break; // stop after first non-empty historical period
                        }
                        $tries++;
                    }
                    // Restore original period if it existed and we changed
                    if ($original && $original !== $selectedPeriod) {
                        $this->legacy->setStudentClassSchedulePeriod($legacySession, $original);
                        $selectedPeriod = $original; // report original to client
                    }
                }
            } catch (\Throwable $e) {
                Log::debug('collectCandidates schedule parse error: '.$e->getMessage());
            }
        }
        // Add previous adviser if not already in list
        if ($previous && !in_array($previous, $instructors, true)) {
            $instructors[] = $previous;
        }
        // Program top advisers (frequency)
        $programTop = [];
        if ($program) {
            $programTop = DefenseRequest::selectRaw('defense_adviser as name, COUNT(*) as c')
                ->where('program', $program)
                ->whereNotNull('defense_adviser')
                ->groupBy('defense_adviser')
                ->orderByDesc('c')
                ->limit(5)
                ->get()
                ->map(fn($r) => ['name' => $r->name, 'count' => (int)$r->c])
                ->all();
            foreach ($programTop as $row) {
                if ($row['name'] && !in_array($row['name'], $instructors, true)) {
                    $instructors[] = $row['name'];
                }
            }
        }
        // Coordinator fallback: include ALL coordinators matching program (or any if none) for visibility
        $coordinators = User::where('role','Coordinator')
            ->when($program, fn($q)=>$q->where('program',$program))
            ->orderBy('last_name')
            ->limit(10)
            ->get();
        foreach ($coordinators as $coord) {
            if ($coord->name && !in_array($coord->name, $instructors, true)) {
                $instructors[] = $coord->name;
            }
        }
        // If still empty, pull faculty list (program-scoped) as broad fallback so dropdown is never blank.
        if (empty($instructors)) {
            $faculty = User::where('role','Faculty')
                ->when($program, fn($q)=>$q->where('program',$program))
                ->orderBy('last_name')
                ->limit(25)
                ->get();
            foreach ($faculty as $f) {
                if ($f->name && !in_array($f->name, $instructors, true)) {
                    $instructors[] = $f->name;
                }
            }
        }
        $reason = null;
        if (empty($instructors)) {
            // Final broad fallback: any coordinators or faculty at all (ignoring program) so UI not blank.
            $anyStaff = User::whereIn('role',['Coordinator','Faculty'])
                ->orderBy('last_name')
                ->limit(25)
                ->get();
            foreach ($anyStaff as $st) {
                if ($st->name && !in_array($st->name, $instructors, true)) {
                    $instructors[] = $st->name;
                }
            }
            if (empty($instructors)) {
                $reason = 'no-data-any-source';
            } else {
                $reason = 'broad-staff-fallback';
            }
            Log::debug('collectCandidates still empty initial, applied broad fallback', [
                'student_id' => $student->id,
                'program' => $program,
                'had_legacy_session' => (bool)$legacySession,
                'periods_count' => count($periods),
                'final_count' => count($instructors),
            ]);
        }
        sort($instructors, SORT_NATURAL|SORT_FLAG_CASE);
        return [
            'instructors' => $instructors,
            'previous_adviser' => $previous,
            'program_top_advisers' => $programTop,
            'selected_period_id' => $selectedPeriod,
            'reason' => $reason,
        ];
    }
}
