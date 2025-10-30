<?php

namespace App\Http\Controllers;

use App\Models\ExamApplication;
use App\Models\ExamRegistrarReview;
use App\Models\User;
use App\Mail\ComprehensiveExamApproved;
use App\Mail\ComprehensiveExamRejected;
use App\Mail\ComprehensiveExamPaymentApproved;
use App\Mail\ComprehensiveExamPaymentRejected;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class RegistrarExamApplicationController extends Controller
{
    // Page (Inertia)
    public function indexPage(Request $request)
    {
        return Inertia::render('registrar/compre-exam/Index');
    }

    // JSON list with filters (program, status, date range, search)
    public function list(Request $request)
    {
        $validated = $request->validate([
            'q'          => ['nullable','string','max:255'],
            'program'    => ['nullable','string','max:255'],
            'status'     => ['nullable','string','in:pending,approved,rejected'],
            'from'       => ['nullable','date'],
            'to'         => ['nullable','date'],
            'page'       => ['nullable','integer','min:1'],
            'per_page'   => ['nullable','integer','min:5','max:200'],
        ]);

        $q = ExamApplication::query()
            ->select([
                'exam_application.*',
                'users.first_name',
                'users.middle_name',
                'users.last_name',
                'users.email',
                'users.school_id',
            ])
            ->leftJoin('users', 'users.school_id', '=', 'exam_application.student_id')
            ->withCount('subjects')
            ->orderByDesc('exam_application.created_at');

        if (!empty($validated['program'])) {
            $q->where('exam_application.program', $validated['program']);
        }
        if (!empty($validated['status'])) {
            $q->where('exam_application.registrar_status', $validated['status']);
        }
        if (!empty($validated['from'])) {
            $q->whereDate('exam_application.created_at', '>=', $validated['from']);
        }
        if (!empty($validated['to'])) {
            $q->whereDate('exam_application.created_at', '<=', $validated['to']);
        }
        if (!empty($validated['q'])) {
            $term = '%'.$validated['q'].'%';
            $q->where(function ($s) use ($term) {
                $s->where('users.first_name', 'like', $term)
                  ->orWhere('users.last_name', 'like', $term)
                  ->orWhere('exam_application.program', 'like', $term)
                  ->orWhere('exam_application.school_year', 'like', $term)
                  ->orWhere('users.email', 'like', $term);
            });
        }

        $perPage = $validated['per_page'] ?? 20;

        // FIX: define $rows before transforming
        $all = $q->paginate($perPage);

        $rows = $all->map(function ($r) {
            // Format created_at to Asia/Manila timezone
            $createdAt = null;
            if ($r->created_at) {
                try {
                    $createdAt = \Carbon\Carbon::parse($r->created_at)
                        ->setTimezone('Asia/Manila')
                        ->toIso8601String();
                } catch (\Exception $e) {
                    $createdAt = $r->created_at;
                }
            }

            return [
                'application_id'   => $r->application_id,
                'first_name'       => $r->first_name ?? '',
                'middle_name'      => $r->middle_name ?? null,
                'last_name'        => $r->last_name ?? '',
                'email'            => $r->email ?? null,
                'school_id'        => (string)($r->school_id ?? $r->student_id ?? ''),
                'program'          => $r->program,
                'school_year'      => $r->school_year,
                'created_at'       => $createdAt,
                'registrar_status' => $r->registrar_status ?? 'pending',
                'registrar_reason' => $r->registrar_reason ?? null,
                'subjects_count'   => (int)($r->subjects_count ?? 0),
                'latest_review'    => null,
            ];
        });

        return response()->json($rows);
    }

    // Decision: approve or reject with checklist
    public function decide(Request $request, ExamApplication $application)
    {
        $data = $request->validate([
            'doc_photo_clear'         => ['required','boolean'],
            'doc_transcript'          => ['required','boolean'],
            'doc_psa_birth'           => ['required','boolean'],
            'doc_honorable_dismissal' => ['required','boolean'],
            'doc_prof_exam'           => ['nullable','boolean'],
            'doc_marriage_cert'       => ['nullable','boolean'],
            'grades_complete'         => ['required','boolean'], // from API at submit time
            'status'                  => ['required','in:approved,rejected'],
            'reason'                  => ['nullable','string','max:2000'],
            'send_email'              => ['nullable','boolean'], // Optional: whether to send email notification
        ]);

        $documentsComplete = ($data['doc_photo_clear'] ?? false)
            && ($data['doc_transcript'] ?? false)
            && ($data['doc_psa_birth'] ?? false)
            && ($data['doc_honorable_dismissal'] ?? false);

        $review = ExamRegistrarReview::create([
            'exam_application_id'     => $application->application_id,
            'doc_photo_clear'         => (bool)$data['doc_photo_clear'],
            'doc_transcript'          => (bool)$data['doc_transcript'],
            'doc_psa_birth'           => (bool)$data['doc_psa_birth'],
            'doc_honorable_dismissal' => (bool)$data['doc_honorable_dismissal'],
            'doc_prof_exam'           => (bool)($data['doc_prof_exam'] ?? false),
            'doc_marriage_cert'       => (bool)($data['doc_marriage_cert'] ?? false),
            'documents_complete'      => $documentsComplete,
            'grades_complete'         => (bool)$data['grades_complete'],
            'status'                  => $data['status'],
            'reason'                  => $data['reason'] ?? null,
            'reviewed_by'             => $request->user()->id,
        ]);

        // Update the application snapshot for student display
        $application->registrar_status     = $data['status'];
        $application->registrar_reason     = $data['status'] === 'rejected' ? ($data['reason'] ?? null) : null;
        $application->registrar_reviewer_id= $request->user()->id;
        $application->registrar_reviewed_at= now();
        $application->approved_by          = $data['status'] === 'approved' ? 'Registrar' : null;
        $application->save();

        // Send email notification to student (only if send_email is true)
        $sendEmail = $data['send_email'] ?? true; // Default to true for backward compatibility
        
        if ($sendEmail) {
            try {
                // Find student by school_id (try both school_id and student_number)
                $student = User::where('school_id', $application->student_id)
                    ->orWhere('student_number', $application->student_id)
                    ->first();

                if ($student && $student->email) {
                    $reviewerName = $request->user()->first_name . ' ' . $request->user()->last_name;

                    if ($data['status'] === 'approved') {
                        Mail::to($student->email)->queue(
                            new ComprehensiveExamPaymentApproved(
                                $application,
                                $student,
                                $reviewerName
                            )
                        );
                        Log::info('Comprehensive exam payment approved email sent', [
                            'application_id' => $application->application_id,
                            'student_email' => $student->email,
                            'verified_by' => 'registrar'
                        ]);
                    } else {
                        Mail::to($student->email)->queue(
                            new ComprehensiveExamPaymentRejected(
                                $application,
                                $student,
                                $data['reason'] ?? 'Please review your payment documents.',
                                $reviewerName
                            )
                        );
                        Log::info('Comprehensive exam payment rejected email sent', [
                            'application_id' => $application->application_id,
                            'student_email' => $student->email,
                            'rejected_by' => 'registrar'
                        ]);
                    }
                } else {
                    Log::warning('Student not found or has no email for comprehensive exam notification', [
                        'application_id' => $application->application_id,
                        'student_id' => $application->student_id
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send comprehensive exam email notification', [
                    'application_id' => $application->application_id,
                    'error' => $e->getMessage()
                ]);
                // Don't fail the request if email fails
            }
        } else {
            Log::info('Email notification skipped by registrar', [
                'application_id' => $application->application_id,
                'status' => $data['status']
            ]);
        }

        // TODO: If approved, enqueue to Dean's queue. For now, we just return success.

        if ($request->expectsJson()) {
            return response()->json(['ok' => true, 'review_id' => $review->id], 201);
        }
        return back()->with('success', 'Decision saved.');
    }

    // Retrieve decision back to pending (Registrar)
    public function retrieve(Request $request, ExamApplication $application)
    {
        // Create a lightweight audit entry marking retrieval to pending
        $review = ExamRegistrarReview::create([
            'exam_application_id'     => $application->application_id,
            'doc_photo_clear'         => false,
            'doc_transcript'          => false,
            'doc_psa_birth'           => false,
            'doc_honorable_dismissal' => false,
            'doc_prof_exam'           => false,
            'doc_marriage_cert'       => false,
            'documents_complete'      => false,
            'grades_complete'         => false,
            'status'                  => 'pending',
            'reason'                  => null,
            'reviewed_by'             => $request->user()->id,
        ]);

        // Update snapshot
        $application->registrar_status       = 'pending';
        $application->registrar_reason       = null;
        $application->registrar_reviewer_id  = $request->user()->id;
        $application->registrar_reviewed_at  = now();
        $application->approved_by            = null;
        $application->save();

        if ($request->expectsJson()) {
            return response()->json(['ok' => true, 'review_id' => $review->id], 201);
        }
        return back()->with('success', 'Application retrieved for re-review.');
    }

    // Reviews history for an application (Registrar)
    public function reviews(ExamApplication $application)
    {
        // Prefer created_at desc if timestamps available; otherwise fallback to id desc
        $rows = ExamRegistrarReview::query()
            ->where('exam_application_id', $application->application_id)
            ->orderByDesc(DB::raw('COALESCE(created_at, id)'))
            ->get([
                'id',
                'exam_application_id',
                'doc_photo_clear',
                'doc_transcript',
                'doc_psa_birth',
                'doc_honorable_dismissal',
                'doc_prof_exam',
                'doc_marriage_cert',
                'documents_complete',
                'grades_complete',
                'status',
                'reason',
                'reviewed_by',
                'created_at',
                'updated_at',
            ]);

        $out = $rows->map(function ($r) {
            return [
                'id' => $r->id,
                'application_id' => $r->exam_application_id,
                'status' => $r->status,
                'reason' => $r->reason,
                'grades_complete' => (bool)$r->grades_complete,
                'documents_complete' => (bool)$r->documents_complete,
                'doc_photo_clear' => (bool)$r->doc_photo_clear,
                'doc_transcript' => (bool)$r->doc_transcript,
                'doc_psa_birth' => (bool)$r->doc_psa_birth,
                'doc_honorable_dismissal' => (bool)$r->doc_honorable_dismissal,
                'doc_prof_exam' => (bool)$r->doc_prof_exam,
                'doc_marriage_cert' => (bool)$r->doc_marriage_cert,
                'reviewed_by' => $r->reviewed_by,
                'created_at' => $r->created_at,
            ];
        });

        return response()->json($out);
    }
}