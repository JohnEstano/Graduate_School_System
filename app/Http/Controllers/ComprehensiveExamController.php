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
        $application = ExamApplication::with('subjects')
            ->where('student_id', $studentId)
            ->latest('created_at')
            ->first();

        $response = null;
        if ($application) {
            $response = [
                'application_id'        => $application->application_id,
                'school_year'           => $application->school_year,
                'permit_status'         => $application->permit_status,
                'final_approval_status' => $application->final_approval_status,
                'contact_number'        => $application->contact_number,
                'telephone_number'      => $application->telephone_number,
                'office_address'        => $application->office_address,
                'program'               => $application->program,
                'created_at'            => $application->created_at,
                // subjects show up now
                'subjects'              => $application->subjects->map(fn ($s) => [
                    'subject'   => $s->subject_name,
                    'date'      => $s->exam_date,
                    'startTime' => $s->start_time,
                    'endTime'   => $s->end_time,
                ]),
                // personal info from users table
                'first_name' => $user->first_name ?? '',
                'middle_name'=> $user->middle_name ?? null,
                'last_name'  => $user->last_name ?? '',
                'email'      => $user->email ?? '',
                'student_id' => $studentId,
            ];
        }

        return Inertia::render('student/submissions/comprehensive-exam/Index', [
            // 👇 pass the built response instead of null
            'application' => $response,
            // Remove hardcoded eligibility - let frontend call API dynamically
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'schoolYear'                  => ['required','string','max:20'],
            'program'                     => ['required','string','max:255'],
            'officeAddress'               => ['nullable','string','max:255'],
            'mobileNo'                    => ['required','string','max:50'],
            'telephoneNo'                 => ['nullable','string','max:50'],
            'subjects'                    => ['required','array','min:1'],
            'subjects.*.subject'          => ['required','string','max:255'],
            'subjects.*.date'             => ['required','date'],
            'subjects.*.startTime'        => ['required','date_format:H:i'],
            'subjects.*.endTime'          => ['required','date_format:H:i','after:subjects.*.startTime'],
        ]);

        $user = $request->user();
        $studentId = $user->student_id ?? $user->school_id ?? $user->id;
        if (!$studentId) {
            return back()->withErrors(['student_id' => 'Your account has no student ID associated.']);
        }

        // Enforce one application per student per school year
        $application = ExamApplication::firstOrCreate(
            ['student_id' => $studentId, 'school_year' => $validated['schoolYear']],
            [
                'permit_status'         => 'pending',
                'final_approval_status' => 'pending',
                'contact_number'        => $validated['mobileNo'],
                'telephone_number'      => $validated['telephoneNo'] ?? null,
                'office_address'        => $validated['officeAddress'] ?? null,
                'program'               => $validated['program'],
            ]
        );

        // Only create subjects if this is a new application
        if (!$application->wasRecentlyCreated) {
            return to_route('comprehensive-exam.index')
                ->with('info', 'You already have an application for this school year.');
        }

        foreach ($validated['subjects'] as $s) {
            $application->subjects()->create([
                'subject_name' => $s['subject'],
                'exam_date'    => $s['date'],
                'start_time'   => $s['startTime'],
                'end_time'     => $s['endTime'],
            ]);
        }

        return to_route('comprehensive-exam.index')->with('success', 'Application submitted.');
    }
}
