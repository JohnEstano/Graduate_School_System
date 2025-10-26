<?php

namespace App\Http\Controllers;

use App\Models\ExamApplication;
use App\Models\ExamRegistrarReview;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

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
        $rows = $q->paginate($perPage);

        $rows->getCollection()->transform(function ($r) {
            return [
                'application_id'   => $r->application_id,
                'first_name'       => $r->first_name ?? '',
                'middle_name'      => $r->middle_name ?? null,
                'last_name'        => $r->last_name ?? '',
                'email'            => $r->email ?? null,
                'school_id'        => (string)($r->school_id ?? $r->student_id ?? ''),
                'program'          => $r->program,
                'school_year'      => $r->school_year,
                'created_at'       => $r->created_at,
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

        // TODO: If approved, enqueue to Dean’s queue. For now, we just return success.

        if ($request->expectsJson()) {
            return response()->json(['ok' => true, 'review_id' => $review->id], 201);
        }
        return back()->with('success', 'Decision saved.');
        return back()->with('success', 'Decision saved.');
    }}