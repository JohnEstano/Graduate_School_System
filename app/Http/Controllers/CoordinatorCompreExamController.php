<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Database\Seeders\CoordinatorProgramSeeder;
use App\Models\CoordinatorProgram;
use App\Models\CoordinatorProgramAssignment;

class CoordinatorCompreExamController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (method_exists($user, 'isCoordinator') && ! $user->isCoordinator()) {
            abort(403, 'Only coordinators can access this page.');
        }

        // 1) Try CoordinatorProgram table (coordinator_programs)
        $programs = [];
        if (Schema::hasTable((new CoordinatorProgram())->getTable())) {
            $programs = CoordinatorProgram::where('coordinator_id', $user->id)
                ->pluck('program')
                ->toArray();
        }

        // 2) Fallback to CoordinatorProgramAssignment table (coordinator_program_assignments)
        if (empty($programs) && Schema::hasTable((new CoordinatorProgramAssignment())->getTable())) {
            $programs = CoordinatorProgramAssignment::where('coordinator_user_id', $user->id)
                ->where('is_active', true)
                ->pluck('program_name')
                ->toArray();
        }

        // 3) Fallback to seeder data (in-code) when DB tables are empty
        if (empty($programs)) {
            $programs = CoordinatorProgramSeeder::getProgramsByEmail($user->email);
        }

        if (empty($programs)) {
            return Inertia::render('coordinator/compre-exam/Index', [
                'programs'    => [],
                'eligible'    => [],
                'notEligible' => [],
                'counts'      => ['eligible' => 0, 'notEligible' => 0],
            ]);
        }

        // normalize programs for case-insensitive matching
        $normalizedPrograms = array_values(array_unique(array_map(fn($p) => mb_strtolower(trim(preg_replace('/\s+/', ' ', (string)$p))), $programs)));

        // Role filtering: role string if present, otherwise role_id from roles table
        $useRoleString = Schema::hasColumn('users', 'role');
        $studentRoleIds = [];

        if (Schema::hasTable('roles')) {
            $studentRoleIds = DB::table('roles')
                ->whereIn('name', ['Student', 'student', 'STUDENT'])
                ->pluck('id')
                ->all();
        }

        $studentsQuery = DB::table('users as u')
            ->select(
                'u.id',
                'u.first_name',
                'u.middle_name',
                'u.last_name',
                'u.email',
                'u.program',
                'u.school_id'
            );

        // Build program filter using LOWER(u.program) comparison
        $studentsQuery->where(function ($q) use ($normalizedPrograms) {
            foreach ($normalizedPrograms as $i => $np) {
                if ($i === 0) {
                    $q->whereRaw('LOWER(u.program) = ?', [$np]);
                } else {
                    $q->orWhereRaw('LOWER(u.program) = ?', [$np]);
                }
            }
        });

        $students = $studentsQuery
            ->when($useRoleString, function ($q) {
                // normalize role to lowercase and require 'student'
                $q->whereIn(DB::raw('LOWER(u.role)'), ['student']);
            }, function ($q) use ($studentRoleIds) {
                if (!empty($studentRoleIds)) {
                    $q->whereIn('u.role_id', $studentRoleIds);
                } else {
                    // final fallback to role string when roles table isn't available
                    $q->whereIn(DB::raw('LOWER(u.role)'), ['student']);
                }
            })
            // Never include the current coordinator account
            ->where('u.id', '<>', $user->id)
            ->orderBy('u.last_name')
            ->get();

        $hasExamApp = Schema::hasTable('exam_application');

        // Determine a safe "latest" ordering column
        $orderCol = null;
        if ($hasExamApp) {
            if (Schema::hasColumn('exam_application', 'application_id')) {
                $orderCol = 'application_id';
            } elseif (Schema::hasColumn('exam_application', 'student_id')) {
                $orderCol = 'id';
            } else {
                $orderCol = 'created_at';
            }
        }

        $rows = $students->map(function ($s) use ($hasExamApp, $orderCol) {
            // Prefer the canonical numeric primary key
            $userId       = (int) ($s->id);
            $schoolIdRaw  = $s->school_id ?? '';
            $schoolIdTrim = is_string($schoolIdRaw) ? trim($schoolIdRaw) : (string) $schoolIdRaw;

            // Fetch latest application (robust to legacy rows keyed by school_id)
            $latest = null;
            if ($hasExamApp) {
                // Check both user id and school_id when available
                $query = DB::table('exam_application')->orderByDesc($orderCol);
                $query->where(function ($q) use ($userId, $schoolIdTrim) {
                    $q->where('student_id', $userId);
                    if ($schoolIdTrim !== '') {
                        $q->orWhere('student_id', $schoolIdTrim);
                    }
                });
                $latest = $query->first();
            }

            // Eligibility keyed by the canonical users.id
            $elig = $this->computeEligibility($userId);

            return [
                'id'         => $userId,
                'first_name' => $s->first_name ?? '',
                'middle_name'=> $s->middle_name ?? null,
                'last_name'  => $s->last_name ?? '',
                'email'      => $s->email ?? null,
                'school_id'  => $schoolIdTrim !== '' ? $schoolIdTrim : null,
                'program'    => $s->program ?? null,

                'eligible'   => $elig['eligible'],
                'lacking'    => $elig['lacking'],

                'applied'            => (bool) $latest,
                'submitted_at'       => $latest->created_at ?? null,
                'application_status' => $latest
                    ? strtolower($latest->final_approval_status ?? 'pending')
                    : 'not_yet_applied',
                'permit_status'      => $latest ? strtolower($latest->permit_status ?? 'pending') : null,
            ];
        });

        $eligible    = $rows->where('eligible', true)->values();
        $notEligible = $rows->where('eligible', false)->values();

        return Inertia::render('coordinator/compre-exam/Index', [
            'programs'    => $programs,
            'eligible'    => $eligible,
            'notEligible' => $notEligible,
            'counts'      => [
                'eligible'    => $eligible->count(),
                'notEligible' => $notEligible->count(),
            ],
        ]);
    }

    /**
     * Simulation-friendly eligibility (set COMPRE_BYPASS_RULES=true in .env for local dev)
     */
    protected function computeEligibility($studentId): array
    {
        $devBypass = app()->environment('local') && (bool) env('COMPRE_BYPASS_RULES', true);
        if ($devBypass) {
            return ['eligible' => true, 'lacking' => []];
        }

        $lacking = [];

        // Grades present?
        if (Schema::hasTable('grades')) {
            $hasGrades = DB::table('grades')->where('student_id', $studentId)->exists();
            if (!$hasGrades) {
                $lacking[] = 'Grades';
            }
        } else {
            $lacking[] = 'Grades';
        }

        // Documents complete?
        if (Schema::hasTable('student_documents')) {
            $docsComplete = DB::table('student_documents')
                ->where('student_id', $studentId)
                ->where('is_complete', 1)
                ->exists();
            if (!$docsComplete) {
                $lacking[] = 'Documents';
            }
        } else {
            $lacking[] = 'Documents';
        }

        // Account balance settled?
        if (Schema::hasTable('student_accounts')) {
            $acct = DB::table('student_accounts')->where('student_id', $studentId)->first();
            $ok   = $acct && (float) ($acct->outstanding_balance ?? 0) <= 0;
            if (!$ok) {
                $lacking[] = 'Outstanding Balance';
            }
        } else {
            $lacking[] = 'Outstanding Balance';
        }

        return ['eligible' => count($lacking) === 0, 'lacking' => $lacking];
    }
}
