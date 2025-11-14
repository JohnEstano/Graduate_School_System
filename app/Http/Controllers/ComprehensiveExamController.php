<?php
// app/Http/Controllers/ComprehensiveExamController.php
namespace App\Http\Controllers;

use App\Models\ExamApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ComprehensiveExamController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $studentId = $user->student_id ?? $user->school_id ?? $user->id;

        // COORDINATOR VIEW
        if (method_exists($user, 'isCoordinator') && $user->isCoordinator()) {
            $programs = method_exists($user, 'allowedProgramNames') ? $user->allowedProgramNames() : [];
            $applications = ExamApplication::withCount('subjects')
                ->whereIn('program', $programs)
                ->latest('application_id')
                ->paginate(20);

            return Inertia::render('coordinator/compre-exam/Index', [
                'applications' => $applications,
                'programs'     => $programs,
            ]);
        }

        // STUDENT VIEW
        $application = ExamApplication::with(['subjects', 'subjects.offering'])
            ->where('student_id', $studentId)
            ->latest('created_at')
            ->first();

        $response = null;
        if ($application) {
            // DEBUG: Log raw database values
            \Log::info('===== COMPREHENSIVE EXAM DEBUG =====');
            \Log::info('Application ID: ' . $application->application_id);
            \Log::info('Raw registrar_status from DB: ' . var_export($application->registrar_status, true));
            \Log::info('Raw final_approval_status from DB: ' . var_export($application->final_approval_status, true));
            \Log::info('Raw registrar_reason from DB: ' . var_export($application->registrar_reason, true));
            \Log::info('Raw final_approval_reason from DB: ' . var_export($application->final_approval_reason, true));
            \Log::info('====================================');
            
            // Format created_at to Asia/Manila timezone
            $createdAt = null;
            if ($application->created_at) {
                try {
                    $createdAt = \Carbon\Carbon::parse($application->created_at)
                        ->setTimezone('Asia/Manila')
                        ->toIso8601String();
                } catch (\Exception $e) {
                    $createdAt = $application->created_at;
                }
            }

            $response = [
                'application_id'        => $application->application_id,
                'school_year'           => $application->school_year,
                'permit_status'         => $application->permit_status,
                'final_approval_status' => $application->final_approval_status,
                'contact_number'        => $application->contact_number,
                'telephone_number'      => $application->telephone_number,
                'office_address'        => $application->office_address,
                'program'               => $application->program,
                'created_at'            => $createdAt,
                'status'                => $application->final_approval_status
                                            ?? ($application->registrar_status ?? 'pending'),
                // Separate statuses for tracking progress (normalized to lowercase)
                'registrar_status'      => strtolower($application->registrar_status ?? 'pending'),
                'dean_status'           => strtolower($application->final_approval_status ?? 'pending'),
                'registrar_reason'      => $application->registrar_reason ?? null,
                'dean_reason'           => $application->final_approval_reason ?? null,
                // Live values from offering if available; fallback to snapshot
                'subjects'              => $application->subjects->map(function ($s) {
                    $live = $s->offering;
                    return [
                        'subject'   => $live->subject_name ?? $s->subject_name,
                        'date'      => $live->exam_date ?? $s->exam_date,
                        'startTime' => $live->start_time ?? $s->start_time,
                        'endTime'   => $live->end_time ?? $s->end_time,
                        'score'     => $s->score,
                        'offeringId'=> $s->offering_id,
                    ];
                }),
                'average_score'        => $application->average_score,
                'result_status'        => $application->result_status,
                // personal info from users table
                'first_name'    => $user->first_name ?? '',
                'middle_initial'=> $user->middle_name ? substr($user->middle_name, 0, 1) : null,
                'last_name'     => $user->last_name ?? '',
                'email'         => $user->email ?? '',
                'student_id'    => $studentId,
                // Contact info from application
                'mobile_no'     => $application->contact_number,
                'telephone_no'  => $application->telephone_number,
            ];
        }

        return Inertia::render('student/submissions/comprehensive-exam/Index', [
            'application' => $response,
            'elig' => [
                'examOpen'               => true,
                'gradesComplete'         => true,
                'documentsComplete'      => true,
                'noOutstandingBalance'   => true,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        // Server-side guard (redundant with middleware, but keeps it robust even if middleware isn't attached)
        $latest = DB::table('exam_application')
            ->where(function ($q) use ($user) {
                $q->where('student_id', $user->id);
                if (!empty($user->school_id)) {
                    $q->orWhere('student_id', $user->school_id);
                }
            })
            ->orderByDesc('created_at')
            ->first();

        $status = strtolower($latest->final_approval_status ?? '') ?: null;

        if ($latest && in_array($status, ['pending', 'approved'], true)) {
            return back()->withErrors([
                'application' => 'You already have a ' . $status . ' comprehensive exam application.',
            ]);
        }

        $validated = $request->validate([
            'schoolYear'   => ['required','string','max:20'],
            'program'      => ['required','string','max:255'],
            'officeAddress'=> ['nullable','string','max:255'],
            'mobileNo'     => ['required','string','max:50'],
            'telephoneNo'  => ['nullable','string','max:50'],
            'subjects'     => ['required','array','min:1'],
            'subjects.*.offering_id' => ['required','integer','exists:exam_subject_offerings,id'],
        ]);

        // Prevent duplicate selections
        $offeringIds = array_map(fn($s) => (int) $s['offering_id'], $validated['subjects']);
        if (count(array_unique($offeringIds)) !== count($offeringIds)) {
            return back()->withErrors(['subjects' => 'Duplicate schedules selected. Please choose unique schedules.']);
        }

        // Load offerings and verify they match student program + SY and are scheduled/active
        $offerings = \DB::table('exam_subject_offerings')
            ->whereIn('id', $offeringIds)
            ->get(['id','program','school_year','subject_name','exam_date','start_time','end_time','is_active']);

        if ($offerings->count() !== count($offeringIds)) {
            return back()->withErrors(['subjects' => 'Some selected schedules no longer exist. Please reselect.']);
        }

        foreach ($offerings as $o) {
            if (!$o->is_active || !$o->exam_date || !$o->start_time || !$o->end_time
                || $o->program !== $validated['program']
                || $o->school_year !== $validated['schoolYear']) {
                return back()->withErrors(['subjects' => 'One or more schedules are invalid or outdated. Please reselect.']);
            }
        }

        // Keep order as selected and snapshot details
        $byId = $offerings->keyBy('id');
        $subjectsRows = array_map(function ($id) use ($byId) {
            $o = $byId[$id];
            return [
                'offering_id'  => $o->id,
                // snapshot (fallback if offering later removed)
                'subject_name' => $o->subject_name,
                'exam_date'    => $o->exam_date,
                'start_time'   => $o->start_time,
                'end_time'     => $o->end_time,
            ];
        }, $offeringIds);

        $studentId = $user->student_id ?? $user->school_id ?? $user->id;
        if (!$studentId) {
            return back()->withErrors(['student_id' => 'Your account has no student ID associated.']);
        }

        // Look for an existing application for the same school year
        $existing = ExamApplication::with('subjects')
            ->where('student_id', $studentId)
            ->where('school_year', $validated['schoolYear'])
            ->latest('application_id')
            ->first();

        if ($existing) {
            // If already approved, don’t allow another submission for the same school year
            if (strtolower($existing->final_approval_status) === 'approved') {
                return to_route('comprehensive-exam.index')
                    ->with('info', 'You already have an approved application for this school year.');
            }

            // Treat as resubmission/update: reset statuses and overwrite details + subjects
            $existing->fill([
                'contact_number'        => $validated['mobileNo'],
                'telephone_number'      => $validated['telephoneNo'] ?? null,
                'office_address'        => $validated['officeAddress'] ?? null,
                'program'               => $validated['program'],
                'permit_status'         => 'pending',
                'final_approval_status' => 'pending',
            ])->save();

            // Replace subjects with the snapshot of coordinator schedules
            $existing->subjects()->delete();
            foreach ($subjectsRows as $s) {
                 $existing->subjects()->create($s);
             }
            return to_route('comprehensive-exam.index')->with('success', 'Application resubmitted.');
        }

        // New application
        $application = ExamApplication::create([
            'student_id'            => $studentId,
            'school_year'           => $validated['schoolYear'],
            'permit_status'         => 'pending',
            'final_approval_status' => 'pending',
            'contact_number'        => $validated['mobileNo'],
            'telephone_number'      => $validated['telephoneNo'] ?? null,
            'office_address'        => $validated['officeAddress'] ?? null,
            'program'               => $validated['program'],
        ]);

        foreach ($subjectsRows as $s) {
             $application->subjects()->create($s);
         }
        
        return to_route('comprehensive-exam.index')->with('success', 'Application submitted.');
    }
}
