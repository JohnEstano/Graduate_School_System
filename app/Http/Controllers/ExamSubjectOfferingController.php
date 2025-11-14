<?php
// filepath: c:\GSURS\Graduate_School_System-1\app\Http\Controllers\ExamSubjectOfferingController.php
// ...existing code...
namespace App\Http\Controllers;

use App\Models\ExamSubjectOffering;
use App\Models\CoordinatorProgram;
use Database\Seeders\CoordinatorProgramSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ExamSubjectOfferingController extends Controller
{
    /** Return the coordinator's allowed programs (DB first, then seed fallback) */
    private function allowedPrograms(Request $request): array
    {
        $user = $request->user();
        if (!$user) return [];

        $db = CoordinatorProgram::query()
            ->where('coordinator_id', $user->id)
            ->orderBy('program')
            ->pluck('program')
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (!empty($db)) return $db;

        // Fallback to seed mapping by email (useful in dev)
        $seed = CoordinatorProgramSeeder::getProgramsByEmail((string) $user->email);
        return array_values(array_unique(array_filter($seed)));
    }

    // Inertia page
    public function page(Request $request)
    {
        $programs = $this->allowedPrograms($request);

        // optional: provide SY options
        $year = (int) now()->year;
        $from = now()->month >= 6 ? $year : $year - 1;
        $schoolYears = [];
        for ($i = 0; $i < 6; $i++) {
            $f = $from - $i;
            $schoolYears[] = "{$f}-" . ($f + 1);
        }

        return Inertia::render('coordinator/compre-exam-schedule/Index', [
            'programs' => $programs,
            'currentProgram' => $programs[0] ?? null,
            'schoolYears' => $schoolYears,
        ]);
    }

    // JSON API
    public function index(Request $request)
    {
        $allowed = $this->allowedPrograms($request);
        $program = (string) $request->query('program', '');
        $sy = (string) $request->query('school_year', '');

        if ($program !== '' && !in_array($program, $allowed, true)) {
            abort(403, 'Not allowed for this program.');
        }

        $rows = ExamSubjectOffering::query()
            ->when($program !== '', fn($q) => $q->where('program', $program))
            ->when($program === '' && !empty($allowed), fn($q) => $q->whereIn('program', $allowed))
            ->when($sy !== '', fn($q) => $q->where('school_year', $sy))
            ->orderBy('subject_name')
            ->get([
                'id','program','school_year','subject_code','subject_name',
                'exam_date','start_time','end_time','venue','proctor','is_active'
            ]);

        return response()->json($rows);
    }

    public function store(Request $request)
    {
        $allowed = $this->allowedPrograms($request);

        $data = $request->validate([
            'program'      => ['required','string','max:255'],
            'school_year'  => ['required','regex:/^\d{4}-\d{4}$/'],
            'subject_code' => ['nullable','string','max:50'],
            'subject_name' => ['required','string','max:255'],
            'exam_date'    => ['nullable','date'],
            'start_time'   => ['nullable','date_format:H:i'],
            'end_time'     => ['nullable','date_format:H:i'],
            'proctor'      => ['required','string','max:255'],
            'venue'        => ['nullable','string','max:255'],
            'is_active'    => ['boolean'],
        ]);

        if (!in_array($data['program'], $allowed, true)) {
            abort(403, 'Not allowed for this program.');
        }

        // Normalize times and ensure valid ordering if both provided
        $examDate   = $data['exam_date'] ?? null;
        $startTime  = $data['start_time'] ?? null;
        $endTime    = $data['end_time'] ?? null;
        $venueRaw   = $data['venue'] ?? null;
        $venueNorm  = $venueRaw !== null ? trim(mb_strtolower($venueRaw)) : null;

        if (($startTime && !$endTime) || ($endTime && !$startTime)) {
            return response()->json([
                'message' => 'Both start and end time are required when one is provided.',
                'errors' => [
                    'start_time' => $startTime ? [] : ['Start time is required when end time is present.'],
                    'end_time'   => $endTime ? [] : ['End time is required when start time is present.'],
                ],
            ], 422);
        }
        if ($startTime && $endTime && $startTime >= $endTime) {
            return response()->json([
                'message' => 'End time must be after start time.',
                'errors' => [
                    'end_time' => ['End time must be after start time.'],
                ],
            ], 422);
        }

        // Conflict checks only when date and both times exist
        if ($examDate && $startTime && $endTime) {
            // 1) Venue-timeslot conflict across all programs: same venue + same date + overlapping time
            if ($venueNorm) {
                $venueConflict = ExamSubjectOffering::query()
                    ->whereDate('exam_date', $examDate)
                    ->whereRaw('LOWER(TRIM(COALESCE(venue, ""))) = ?', [$venueNorm])
                    ->where('start_time', '<', $endTime)  // existing starts before new end
                    ->where('end_time',   '>', $startTime) // existing ends after new start
                    ->exists();

                if ($venueConflict) {
                    return response()->json([
                        'message' => 'This venue is already booked at the selected date/time.',
                        'errors' => [
                            'venue' => ['This venue is already booked at the selected date/time.'],
                        ],
                    ], 422);
                }
            }

            // 2) Program-timeslot conflict: same program + school_year + date + overlapping time (regardless of venue)
            $programConflict = ExamSubjectOffering::query()
                ->where('program', $data['program'])
                ->where('school_year', $data['school_year'])
                ->whereDate('exam_date', $examDate)
                ->where('start_time', '<', $endTime)
                ->where('end_time',   '>', $startTime)
                ->exists();

            if ($programConflict) {
                return response()->json([
                    'message' => 'This program already has another subject in the selected timeslot.',
                    'errors' => [
                        'start_time' => ['Overlaps with another subject for this program.'],
                        'end_time'   => ['Overlaps with another subject for this program.'],
                    ],
                ], 422);
            }
        }

        $offering = ExamSubjectOffering::create($data + ['is_active' => $request->boolean('is_active', true)]);
        if ($request->expectsJson()) {
            return response()->json(['id' => $offering->id], 201);
       }
        return back()->with('success', 'Offering created.');
    }

    public function update(Request $request, ExamSubjectOffering $offering)
    {
        $allowed = $this->allowedPrograms($request);

        // Ensure both the existing record and the target program are allowed
        if (!in_array($offering->program, $allowed, true)) {
            abort(403, 'Not allowed for this program.');
        }

        $data = $request->validate([
            'program'      => ['required','string','max:255'],
            'school_year'  => ['required','regex:/^\d{4}-\d{4}$/'],
            'subject_code' => ['nullable','string','max:50'],
            'subject_name' => ['required','string','max:255'],
            'exam_date'    => ['nullable','date'],
            'start_time'   => ['nullable','date_format:H:i'],
            'end_time'     => ['nullable','date_format:H:i'],
            'proctor'      => ['required','string','max:255'],
            'venue'        => ['nullable','string','max:255'],
            'is_active'    => ['boolean'],
        ]);

        if (!in_array($data['program'], $allowed, true)) {
            abort(403, 'Not allowed for this program.');
        }

        // Normalize times and ensure valid ordering if both provided
        $examDate   = $data['exam_date'] ?? null;
        $startTime  = $data['start_time'] ?? null;
        $endTime    = $data['end_time'] ?? null;
        $venueRaw   = $data['venue'] ?? null;
        $venueNorm  = $venueRaw !== null ? trim(mb_strtolower($venueRaw)) : null;

        if (($startTime && !$endTime) || ($endTime && !$startTime)) {
            return response()->json([
                'message' => 'Both start and end time are required when one is provided.',
                'errors' => [
                    'start_time' => $startTime ? [] : ['Start time is required when end time is present.'],
                    'end_time'   => $endTime ? [] : ['End time is required when start time is present.'],
                ],
            ], 422);
        }
        if ($startTime && $endTime && $startTime >= $endTime) {
            return response()->json([
                'message' => 'End time must be after start time.',
                'errors' => [
                    'end_time' => ['End time must be after start time.'],
                ],
            ], 422);
        }

        // Conflict checks only when date and both times exist
        if ($examDate && $startTime && $endTime) {
            // 1) Venue-timeslot conflict across all programs (exclude self)
            if ($venueNorm) {
                $venueConflict = ExamSubjectOffering::query()
                    ->where('id', '!=', $offering->id)
                    ->whereDate('exam_date', $examDate)
                    ->whereRaw('LOWER(TRIM(COALESCE(venue, ""))) = ?', [$venueNorm])
                    ->where('start_time', '<', $endTime)
                    ->where('end_time',   '>', $startTime)
                    ->exists();

                if ($venueConflict) {
                    return response()->json([
                        'message' => 'This venue is already booked at the selected date/time.',
                        'errors' => [
                            'venue' => ['This venue is already booked at the selected date/time.'],
                        ],
                    ], 422);
                }
            }

            // 2) Program-timeslot conflict for same program + school_year + date (exclude self)
            $programConflict = ExamSubjectOffering::query()
                ->where('id', '!=', $offering->id)
                ->where('program', $data['program'])
                ->where('school_year', $data['school_year'])
                ->whereDate('exam_date', $examDate)
                ->where('start_time', '<', $endTime)
                ->where('end_time',   '>', $startTime)
                ->exists();

            if ($programConflict) {
                return response()->json([
                    'message' => 'This program already has another subject in the selected timeslot.',
                    'errors' => [
                        'start_time' => ['Overlaps with another subject for this program.'],
                        'end_time'   => ['Overlaps with another subject for this program.'],
                    ],
                ], 422);
            }
        }

        $offering->update($data + ['is_active' => $request->boolean('is_active', true)]);
            
        if ($request->expectsJson()) {
            return response()->noContent(); // 204
        }

        return back()->with('success', 'Offering updated.');
    }

    public function destroy(Request $request, ExamSubjectOffering $offering)
    {
        $allowed = $this->allowedPrograms($request);
        if (!in_array($offering->program, $allowed, true)) {
            abort(403, 'Not allowed for this program.');
        }

        $offering->delete();

        if ($request->expectsJson()) {
            return response()->noContent();
        }

        return back()->with('success', 'Offering deleted.');
    }
}