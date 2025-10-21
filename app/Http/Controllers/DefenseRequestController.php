<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Jobs\GenerateDefenseDocumentsJob;
use App\Mail\DefenseRequestSubmitted;
use App\Mail\DefenseRequestApproved;
use App\Mail\DefenseRequestRejected;

class DefenseRequestController extends Controller
{
    /**
     * Index
     * - Coordinators (Coordinator / Administrative Assistant / Dean) see the coordinator Inertia page
     * - Everyone else (students) see their own defense requirement submissions page
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) abort(401);

        $coordinatorRoles = ['Coordinator','Administrative Assistant','Dean'];

        if (in_array($user->role, $coordinatorRoles)) {
            // Coordinator view: show queue of adviser-approved onward
            $query = DefenseRequest::query();

            // --- FIXED: AA filter - show all coordinator-approved or completed ---
            if ($user->role === 'Administrative Assistant') {
                $query->whereIn('coordinator_status', ['Approved'])
                      ->whereIn('workflow_state', [
                          'coordinator-approved',
                          'panels-assigned',
                          'scheduled',
                          'completed'
                      ]);
            }

            Log::info('Coordinator dashboard filter applied', [
                'coordinator_id' => $user->id,
                'coordinator_email' => $user->email,
                'search' => $request->input('search'),
            ]);

            if ($s = $request->input('search')) {
                $query->where(function($q) use ($s){
                    $q->where('thesis_title','like',"%$s%")
                      ->orWhere('first_name','like',"%$s%")
                      ->orWhere('last_name','like',"%$s%")
                      ->orWhere('school_id','like',"%$s%");
                });
            }

            $rows = $query
                ->with('aaVerification') // Load AA verification relationship
                ->orderByRaw("FIELD(workflow_state,'adviser-approved','coordinator-review','coordinator-approved','panels-assigned','scheduled','completed','coordinator-rejected')")
                ->orderBy('adviser_reviewed_at','desc')
                ->limit(300)
                ->get([
                    'id','first_name','middle_name','last_name','school_id','program',
                    'thesis_title','defense_type','status','priority','workflow_state',
                    'scheduled_date','scheduled_time','scheduled_end_time',
                    'defense_mode','defense_venue','panels_assigned_at',
                    'defense_adviser','adviser_reviewed_at',
                    'defense_chairperson','defense_panelist1','defense_panelist2','defense_panelist3','defense_panelist4',
                    'coordinator_status',
                    'amount',
                    'reference_no',
                ])->map(function($r){
                    // Helper to resolve panelist info
                    $panelistFields = [
                        $r->defense_chairperson,
                        $r->defense_panelist1,
                        $r->defense_panelist2,
                        $r->defense_panelist3,
                        $r->defense_panelist4,
                    ];
                    $panelists = collect($panelistFields)
                        ->filter()
                        ->map(function($panelistIdOrName) {
                            if (is_numeric($panelistIdOrName)) {
                                $p = \App\Models\Panelist::find($panelistIdOrName);
                                if ($p) return ['id' => $p->id, 'name' => $p->name];
                            }
                            return ['id' => null, 'name' => $panelistIdOrName];
                        })->values()->all();

                    // Get program level and expected rate
                    $programLevel = \App\Helpers\ProgramLevel::getLevel($r->program);
                    $expectedTotal = \App\Models\PaymentRate::where('program_level', $programLevel)
                        ->where('defense_type', $r->defense_type)
                        ->sum('amount');

                    return [
                        'id' => $r->id,
                        'first_name' => $r->first_name,
                        'middle_name' => $r->middle_name,
                        'last_name' => $r->last_name,
                        'school_id' => $r->school_id,
                        'program' => $r->program,
                        'thesis_title' => $r->thesis_title,
                        'defense_type' => $r->defense_type,
                        'priority' => $r->priority,
                        'workflow_state' => $r->workflow_state,
                        'status' => $r->status ?? 'Pending',
                        'scheduled_date' => $r->scheduled_date?->format('Y-m-d'),
                        'scheduled_time' => $r->scheduled_time,
                        'scheduled_end_time' => $r->scheduled_end_time,
                        'defense_mode' => $r->defense_mode,
                        'defense_venue' => $r->defense_venue,
                        'panels_assigned_at' => $r->panels_assigned_at,
                        'normalized_status' => $this->normalizeStatusForCoordinator($r),
                        'adviser' => $r->defense_adviser ?: '—',
                        'submitted_at' => $r->adviser_reviewed_at
                            ? (is_object($r->adviser_reviewed_at)
                                ? $r->adviser_reviewed_at->format('Y-m-d H:i:s')
                                : date('Y-m-d H:i:s', strtotime($r->adviser_reviewed_at)))
                            : '—',
                        'panelists' => $panelists,
                        'coordinator_status' => $r->coordinator_status,
                        'expected_rate' => $expectedTotal,
                        'amount' => $r->amount,
                        'reference_no' => $r->reference_no,
                        // AA verification status
                        'aa_verification_status' => $r->aaVerification ? $r->aaVerification->status : 'pending',
                        'aa_verification_id' => $r->aaVerification ? $r->aaVerification->id : null,
                    ];
                });

            // New: JSON response for dashboard fetch
            if ($request->expectsJson()) {
                $pendingCount = collect($rows)->where('normalized_status','Pending')->count();
                return response()->json([
                    'defenseRequests' => $rows,
                    'pendingCount' => $pendingCount,
                ]);
            }

            return inertia('coordinator/submissions/defense-request/Index', [
                'defenseRequests' => $rows,
                'filters' => [
                    'search' => $request->input('search','')
                ]
            ]);
        }

        // Student view
        $requirements = DefenseRequest::where('submitted_by', $user->id)
            ->where('workflow_state', '!=', 'cancelled')
            ->where(function($q) {
                $q->whereNull('status')->orWhere('status', '!=', 'Cancelled');
            })
            ->orderByDesc('created_at')
            ->get();

        $terminal = ['cancelled','adviser-rejected','coordinator-rejected','completed'];
        $active = $requirements->first(fn($r) => !in_array($r->workflow_state, $terminal));
        $defenseRequest = $active ?: $requirements->first();

        if ($request->expectsJson()) {
            $list = $requirements->map(function($r){
                return [
                    'id'            => $r->id,
                    'thesis_title'  => $r->thesis_title,
                    'status'        => $r->status ?? 'Pending',
                    'workflow_state' => $r->workflow_state,
                    'priority'      => $r->priority,
                    'submitted_by'  => $r->submitted_by,
                    'created_at'    => $r->created_at?->toIso8601String(),
                    'scheduled_date' => $r->scheduled_date?->format('Y-m-d'),
                    'normalized_status' => $this->normalizeStatusForCoordinator($r),
                ];
            });

            return response()->json([
                'defenseRequests' => $list,
                'activeId'        => $defenseRequest?->id,
                'count'           => $list->count(),
            ]);
        }

        // Fallback (not the dashboard, separate page)
        return Inertia::render('student/submissions/defense-requirements/Index', [
            'defenseRequest' => $defenseRequest,
            'defenseRequests' => $requirements->map(fn($r)=>[
                'id'=>$r->id,
                'thesis_title'=>$r->thesis_title,
                'status'=>$r->status ?? 'Pending',
                'workflow_state'=>$r->workflow_state,
                'created_at'=>$r->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'firstName' => 'required|string',
            'middleName' => 'nullable|string',
            'lastName' => 'required|string',
            'schoolId' => 'required|string',
            'program' => 'required|string',
            'thesisTitle' => 'required|string',
            'defenseType' => 'required|string|in:Proposal,Prefinal,Final',
            'defenseAdviser' => 'required|string',
            'advisersEndorsement' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:204800',
            'recEndorsement' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:204800',
            'proofOfPayment' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:204800',
            'referenceNo' => 'required|string|max:100',
            'avisee_adviser_attachment' => "nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:204800",
        ]);

        foreach (['advisersEndorsement','recEndorsement','proofOfPayment'] as $f) {
            if ($request->hasFile($f)) {
                $data[$f] = $request->file($f)->store('defense-attachments');
            }
        }

        try {
            DB::beginTransaction();
            $defenseRequest = DefenseRequest::create([
                'first_name' => $data['firstName'],
                'middle_name' => $data['middleName'],
                'last_name' => $data['lastName'],
                'school_id' => $data['schoolId'],
                'program' => $data['program'],
                'thesis_title' => $data['thesisTitle'],
                'defense_type' => $data['defenseType'],
                'defense_adviser' => $data['defenseAdviser'],
                'advisers_endorsement' => $data['advisersEndorsement'] ?? null,
                'rec_endorsement' => $data['recEndorsement'] ?? null,
                'proof_of_payment' => $data['proofOfPayment'] ?? null,
                'reference_no' => $data['referenceNo'] ?? null,
                'submitted_by' => Auth::id(),
                'status' => 'Pending',
                'priority' => 'Medium',
                'workflow_state' => 'submitted',
                'submitted_at' => now(),
                'workflow_history' => [[
                    'action'=>'submitted',
                    'timestamp'=>now()->toISOString(),
                    'user_id'=>Auth::id(),
                    'user_name'=>null,
                    'from_state'=>null,
                    'to_state'=>'submitted'
                ]]
            ]);

            // Find adviser using flexible name matching
            Log::info('Defense Request: Looking for adviser', [
                'defense_request_id' => $defenseRequest->id,
                'adviser_name' => $defenseRequest->defense_adviser,
                'student' => $defenseRequest->first_name . ' ' . $defenseRequest->last_name
            ]);
            
            $adviserUser = User::findByFullName($defenseRequest->defense_adviser, 'Faculty')->first();
            
            if ($adviserUser) {
                Log::info('Defense Request: Adviser found', [
                    'adviser_id' => $adviserUser->id,
                    'adviser_name' => $adviserUser->full_name,
                    'adviser_email' => $adviserUser->email
                ]);
                
                $defenseRequest->adviser_user_id = $adviserUser->id;
                $defenseRequest->assigned_to_user_id = $adviserUser->id;
                $defenseRequest->save();
                Notification::create([
                    'user_id'=>$adviserUser->id,
                    'type'=>'defense-request',
                    'title'=>'New Defense Request',
                    'message'=>"Review needed for {$defenseRequest->defense_type} request ({$defenseRequest->thesis_title}).",
                    'link'=>url("/defense-request/{$defenseRequest->id}")
                ]);
                
                // Send email notification to adviser
                if ($adviserUser->email) {
                    try {
                        Log::info('Defense Request: About to send email', [
                            'defense_request_id' => $defenseRequest->id,
                            'adviser_email' => $adviserUser->email,
                            'adviser_name' => $adviserUser->full_name
                        ]);
                        
                        // Send email IMMEDIATELY (not queued) to ensure it's sent
                        Mail::to($adviserUser->email)
                            ->send(new DefenseRequestSubmitted($defenseRequest, $adviserUser));
                        
                        Log::info('Defense Request: Email sent successfully', [
                            'defense_request_id' => $defenseRequest->id,
                            'adviser_email' => $adviserUser->email,
                            'email_type' => 'DefenseRequestSubmitted'
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Defense Request: Failed to send email', [
                            'defense_request_id' => $defenseRequest->id,
                            'adviser_email' => $adviserUser->email,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
                } else {
                    Log::warning('Defense Request: Adviser has no email address', [
                        'defense_request_id' => $defenseRequest->id,
                        'adviser_id' => $adviserUser->id,
                        'adviser_name' => $adviserUser->full_name
                    ]);
                }
            } else {
                Log::error('Defense Request: Adviser not found', [
                    'defense_request_id' => $defenseRequest->id,
                    'adviser_name_searched' => $defenseRequest->defense_adviser,
                    'available_faculty' => User::where('role', 'Faculty')
                        ->get(['id', 'first_name', 'middle_name', 'last_name', 'email'])
                        ->map(fn($u) => $u->full_name)
                        ->toArray()
                ]);
            }

            DB::commit();
            if ($request->expectsJson()) {
                return response()->json([
                    'success'=>true,
                    'id'=>$defenseRequest->id,
                    'workflow_state'=>$defenseRequest->workflow_state
                ],201);
            }
            return Redirect::back()->with('success','Defense request submitted.');
        } catch (\Throwable $e) {
            DB::rollBack();
            if ($request->expectsJson()) {
                return response()->json(['success'=>false,'error'=>$e->getMessage()],500);
            }
            return Redirect::back()->with('error','Submission failed: '.$e->getMessage());
        }
    }

    /** Adviser approve / reject (no status mutation on reject) */
    public function adviserDecision(Request $request, DefenseRequest $defenseRequest)
    {
        $user = Auth::user();
        if (!$user) abort(401);
        if (!in_array($user->role, ['Faculty', 'Adviser'])) {
            abort(403);
        }

        $data = $request->validate([
            'comment'  => 'nullable|string|max:2000',
            'decision' => 'required|in:approve,reject',
        ]);

        $decision = $data['decision'];
        $comment = $data['comment'] ?? null;

        $current = $defenseRequest->workflow_state ?: 'submitted';
        if (!in_array($current, ['submitted', 'adviser-review', 'adviser-rejected'])) {
            return back()->withErrors(['message' => 'This request cannot be decided at its current state.']);
        }

        if ($decision === 'approve') {
            // Mark adviser-approved and set statuses
            $defenseRequest->workflow_state = 'adviser-approved';
            $defenseRequest->adviser_status = 'Approved';
            $defenseRequest->status = 'Pending';

            // Coordinator selection priority:
            // 1) If the student was assigned to this adviser by a coordinator, use requested_by on the adviser_student pivot.
            // 2) Fallback to any coordinator(s) linked to the adviser (first).
            // 3) Fallback to a coordinator for the student's program.
            $coordinator = null;

            try {
                if (!empty($defenseRequest->submitted_by)) {
                    $studentId = $defenseRequest->submitted_by;
                    // Attempt to find pivot row via the adviser's advisedStudents relation
                    $pivotStudent = $user->advisedStudents()->where('users.id', $studentId)->first();
                    if ($pivotStudent && !empty($pivotStudent->pivot->requested_by)) {
                        $coordinator = User::find($pivotStudent->pivot->requested_by);
                    }
                }
            } catch (\Throwable $e) {
                // ignore and fallback
                Log::warning('adviserDecision: pivot lookup failed: '.$e->getMessage());
            }

            // 2) fallback: any coordinator linked to this adviser user
            if (!$coordinator) {
                try {
                    $coordinator = $user->coordinators()->first();
                } catch (\Throwable $e) {
                    // ignore
                }
            }

            // 3) fallback: coordinator for student's program
            if (!$coordinator && !empty($defenseRequest->program)) {
                $coordinator = User::where('role', 'Coordinator')
                    ->where('program', $defenseRequest->program)
                    ->first();
            }

            if ($coordinator) {
                $defenseRequest->coordinator_user_id = $coordinator->id;
            } else {
                // Leave coordinator_user_id as-is (or null) and log for diagnostics
                Log::info("adviserDecision: no coordinator determined for defense_request {$defenseRequest->id}");
            }

            // record workflow entry
            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = $user->id;
            $defenseRequest->addWorkflowEntry(
                'adviser-approved',
                $comment,
                $user->id,
                $current,
                $defenseRequest->workflow_state
            );
            
            // Save first before sending emails
            $defenseRequest->save();
            
            // Send email notifications after approval
            // 1. Notify student of approval
            try {
                $student = $defenseRequest->user;
                if ($student && $student->email) {
                    Mail::to($student->email)
                        ->send(new DefenseRequestApproved($defenseRequest, $student, 'adviser', $comment));
                    Log::info('Adviser Approval: Email sent to student', [
                        'defense_request_id' => $defenseRequest->id,
                        'student_email' => $student->email,
                        'adviser_id' => $user->id
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Adviser Approval: Failed to send email to student', [
                    'defense_request_id' => $defenseRequest->id,
                    'error' => $e->getMessage()
                ]);
            }
            
            // 2. Notify coordinator of new request needing review
            if ($coordinator && $coordinator->email) {
                try {
                    Mail::to($coordinator->email)
                        ->send(new DefenseRequestAssignedToCoordinator($defenseRequest));
                    Log::info('Adviser Approval: Email sent to coordinator', [
                        'defense_request_id' => $defenseRequest->id,
                        'coordinator_email' => $coordinator->email,
                        'adviser_id' => $user->id
                    ]);
                } catch (\Exception $e) {
                    Log::error('Adviser Approval: Failed to send email to coordinator', [
                        'defense_request_id' => $defenseRequest->id,
                        'coordinator_id' => $coordinator->id ?? null,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        } else {
            // reject: do not advance to coordinator; record adviser rejection
            $defenseRequest->adviser_status = 'Rejected';
            $defenseRequest->workflow_state = 'adviser-rejected';
            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = $user->id;
            $defenseRequest->addWorkflowEntry(
                'adviser-rejected',
                $comment,
                $user->id,
                $current,
                $defenseRequest->workflow_state
            );
            
            // Save first before sending emails
            $defenseRequest->save();
            
            // Send rejection email to student
            try {
                $student = $defenseRequest->user;
                if ($student && $student->email) {
                    Mail::to($student->email)
                        ->send(new DefenseRequestRejected($defenseRequest, $student, 'adviser', $comment));
                    Log::info('Adviser Rejection: Email sent to student', [
                        'defense_request_id' => $defenseRequest->id,
                        'student_email' => $student->email,
                        'adviser_id' => $user->id
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Adviser Rejection: Failed to send email to student', [
                    'defense_request_id' => $defenseRequest->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return back()->with('success', 'Decision recorded and notifications sent.');
    }

    /** Coordinator approve / reject */
  
public function coordinatorDecision(Request $request, DefenseRequest $defenseRequest)
{
    $user = Auth::user();
    if (!$user) abort(401);
    if (!in_array($user->role,['Coordinator','Administrative Assistant','Dean'])) {
        return response()->json(['error'=>'Unauthorized'],403);
    }

    // AUTHORIZATION: Verify this coordinator is assigned to this request
    if ($defenseRequest->coordinator_user_id !== $user->id) {
        Log::warning('Unauthorized coordinator action attempt', [
            'defense_request_id' => $defenseRequest->id,
            'assigned_coordinator_id' => $defenseRequest->coordinator_user_id,
            'attempted_by_user_id' => $user->id,
            'attempted_by_email' => $user->email,
        ]);

        return response()->json([
            'error' => 'You are not authorized to act on this defense request. This request is assigned to another coordinator.'
        ], 403);
    }

    $data = $request->validate([
        'decision' => 'required|in:approve,reject,retrieve',
        'comment'  => 'nullable|string|max:3000'
    ]);
    $comment = $data['comment'] ?? null;

    // FIXED: Allow approval from 'scheduled' state as well
    $allowedCurrent = ['adviser-approved','coordinator-review','scheduled'];
    $current = $defenseRequest->workflow_state;
    if (!in_array($current, $allowedCurrent)) {
        return response()->json([
            'error'=>"Cannot act in state '{$current}'. Request must be in adviser-approved, coordinator-review, or scheduled state."
        ],422);
    }

    try {
        $defenseRequest->ensureSubmittedHistory();

        if ($data['decision'] === 'approve') {
            $defenseRequest->workflow_state = 'coordinator-approved';
            $defenseRequest->status = 'Approved';
            $defenseRequest->coordinator_status = 'Approved';
            $defenseRequest->coordinator_comments = $comment;
            $defenseRequest->coordinator_reviewed_at = now();
            $defenseRequest->coordinator_reviewed_by = $user->id;
            $defenseRequest->addWorkflowEntry(
                'coordinator-approved',
                $comment,
                $user->id,
                $current,
                'coordinator-approved'
            );
        } elseif ($data['decision'] === 'reject') {
            $defenseRequest->workflow_state = 'coordinator-rejected';
            $defenseRequest->status = 'Rejected';
            $defenseRequest->coordinator_status = 'Rejected';
            $defenseRequest->coordinator_comments = $comment;
            $defenseRequest->coordinator_reviewed_at = now();
            $defenseRequest->coordinator_reviewed_by = $user->id;
            $defenseRequest->addWorkflowEntry(
                'coordinator-rejected',
                $comment,
                $user->id,
                $current,
                'coordinator-rejected'
            );
        } else { // retrieve
            $defenseRequest->workflow_state = 'coordinator-review';
            $defenseRequest->status = 'Pending';
            $defenseRequest->coordinator_status = 'Pending';
            $defenseRequest->coordinator_comments = $comment;
            $defenseRequest->addWorkflowEntry(
                'coordinator-retrieved',
                $comment,
                $user->id,
                $current,
                'coordinator-review'
            );
        }

        $defenseRequest->last_status_updated_at = now();
        $defenseRequest->last_status_updated_by = $user->id;

        $hist = is_array($defenseRequest->workflow_history) ? $defenseRequest->workflow_history : [];
        foreach ($hist as &$h) {
            $h['comment']   = $h['comment']   ?? null;
            $h['user_name'] = $h['user_name'] ?? '';
        }
        $defenseRequest->workflow_history = $hist;

        $defenseRequest->save();
        
        // Send email notification to student
        $student = User::find($defenseRequest->submitted_by);
        if ($student && $student->email) {
            if ($data['decision'] === 'approve') {
                Mail::to($student->email)
                    ->queue(new DefenseRequestApproved(
                        $defenseRequest,
                        $student,
                        'coordinator',
                        $comment
                    ));
            } else if ($data['decision'] === 'reject') {
                Mail::to($student->email)
                    ->queue(new DefenseRequestRejected(
                        $defenseRequest,
                        $student,
                        'coordinator',
                        $comment
                    ));
            }
        }

        // --- Auto-create payment verification record if approved ---
        if ($defenseRequest->coordinator_status === 'Approved') {
            $existing = \App\Models\AaPaymentVerification::where('defense_request_id', $defenseRequest->id)->first();
            if (!$existing) {
                \App\Models\AaPaymentVerification::create([
                    'defense_request_id' => $defenseRequest->id,
                    'assigned_to' => null,
                    'status' => 'pending',
                    'remarks' => null,
                ]);
            }
        }

        return response()->json([
            'ok'=>true,
            'workflow_state'=>$defenseRequest->workflow_state,
            'status'=>$defenseRequest->status,
            'coordinator_status'=>$defenseRequest->coordinator_status,
            'coordinator_comments'=>$defenseRequest->coordinator_comments,
            'adviser_comments'=>$defenseRequest->adviser_comments,
            'workflow_history'=>$defenseRequest->workflow_history
        ]);
    } catch (\Throwable $e) {
        Log::error('coordinatorDecision error',[
            'id'=>$defenseRequest->id,
            'error'=>$e->getMessage(),
            'trace'=>$e->getTraceAsString()
        ]);
        return response()->json(['error'=>app()->environment('local')?$e->getMessage():'Internal error'],500);
    }
}

/** Lightweight API for polling */
public function apiShow(DefenseRequest $defenseRequest)
{
    $user = Auth::user();
    if (!$user) abort(401);

    // Get program level
    $programLevel = \App\Helpers\ProgramLevel::getLevel($defenseRequest->program);

    return response()->json([
        'id' => $defenseRequest->id,
        'first_name' => $defenseRequest->first_name,
        'middle_name' => $defenseRequest->middle_name,
        'last_name' => $defenseRequest->last_name,
        'school_id' => $defenseRequest->school_id,
        'program' => $defenseRequest->program,
        'thesis_title' => $defenseRequest->thesis_title,
        'defense_type' => $defenseRequest->defense_type,
        'status' => $defenseRequest->status,
        'priority' => $defenseRequest->priority,
        'workflow_state' => $defenseRequest->workflow_state,
        'workflow_state_display' => $defenseRequest->workflow_state_display ?? null,
        'defense_adviser' => $defenseRequest->defense_adviser,
        'defense_chairperson' => $defenseRequest->defense_chairperson,
        'defense_panelist1' => $defenseRequest->defense_panelist1,
        'defense_panelist2' => $defenseRequest->defense_panelist2,
        'defense_panelist3' => $defenseRequest->defense_panelist3,
        'defense_panelist4' => $defenseRequest->defense_panelist4,
        'scheduled_date' => $defenseRequest->scheduled_date?->format('Y-m-d'),
        'scheduled_time' => $defenseRequest->scheduled_time,
        'scheduled_end_time' => $defenseRequest->scheduled_end_time,
        'formatted_time_range' => $defenseRequest->formatted_time_range,
        'defense_venue' => $defenseRequest->defense_venue,
        'defense_mode' => $defenseRequest->defense_mode,
        'scheduling_notes' => $defenseRequest->scheduling_notes,
        'panels_assigned_at' => $defenseRequest->panels_assigned_at?->toIso8601String(),
        'last_status_updated_by' => $defenseRequest->last_status_updated_by,
        'last_status_updated_by_name' => $defenseRequest->last_status_updated_by_name,
        'last_status_updated_at' => $defenseRequest->last_status_updated_at,
        'submitted_at' => $defenseRequest->submitted_at 
            ? \Carbon\Carbon::parse($defenseRequest->submitted_at)->format('Y-m-d H:i:s') 
            : null,
        'workflow_history' => $defenseRequest->workflow_history ?? [],
        'manuscript_proposal' => $defenseRequest->manuscript_proposal,
        'similarity_index' => $defenseRequest->similarity_index,
        'rec_endorsement' => $defenseRequest->rec_endorsement,
        'proof_of_payment' => $defenseRequest->proof_of_payment,
        'avisee_adviser_attachment' => $defenseRequest->avisee_adviser_attachment,
        'program_level' => $programLevel,
    ]);
}

    /**
     * Update the status of a defense request (for coordinators/admins)
     */
    public function updateStatus(Request $request, $id)
    {
        $defenseRequest = DefenseRequest::findOrFail($id);
        
        $validated = $request->validate([
            'coordinator_status' => 'nullable|string|in:Pending,Approved,Rejected',
            'coordinator_comments' => 'nullable|string',
        ]);

        $oldStatus = $defenseRequest->coordinator_status;
        $newStatus = $validated['coordinator_status'] ?? $oldStatus;

        DB::beginTransaction();
        try {
            // Update coordinator status
            $defenseRequest->coordinator_status = $newStatus;
            $defenseRequest->coordinator_comments = $validated['coordinator_comments'] ?? null;
            $defenseRequest->coordinator_reviewed_at = now();
            $defenseRequest->coordinator_reviewed_by = Auth::id();

            // Update workflow state based on coordinator status
            if ($newStatus === 'Approved') {
                $defenseRequest->workflow_state = 'coordinator-approved';
            } elseif ($newStatus === 'Rejected') {
                $defenseRequest->workflow_state = 'rejected';
            }

            // Add workflow history
            $defenseRequest->addWorkflowEntry(
                'coordinator-status-updated',
                $validated['coordinator_comments'],
                Auth::id(),
                $oldStatus,
                $newStatus
            );

            $defenseRequest->save();

            DB::commit();

            return redirect()->back()->with('success', 'Defense request status updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating defense request status', [
                'error' => $e->getMessage(),
                'defense_request_id' => $id
            ]);
            return redirect()->back()->with('error', 'Failed to update defense request status.');
        }
    }

    /**
     * Mark defense as completed
     */
    public function markAsCompleted(Request $request, $id)
    {
        $defenseRequest = DefenseRequest::findOrFail($id);

        $validated = $request->validate([
            'coordinator_status' => 'required|string|in:Approved',
            'coordinator_comments' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Update status
            $defenseRequest->coordinator_status = 'Approved';
            $defenseRequest->coordinator_comments = $validated['coordinator_comments'] ?? null;
            $defenseRequest->coordinator_reviewed_at = now();
            $defenseRequest->coordinator_reviewed_by = Auth::id();
            $defenseRequest->workflow_state = 'completed';
            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = Auth::id();

            // Add workflow history
            $defenseRequest->addWorkflowEntry(
                'coordinator-status-updated',
                $validated['coordinator_comments'],
                Auth::id(),
                $defenseRequest->workflow_state,
                'completed'
            );

            $defenseRequest->save();

            // 🎉 AUTOMATICALLY CREATE HONORARIUM PAYMENTS
            Log::info('Defense marked as completed, creating honorarium payments', [
                'defense_id' => $defenseRequest->id,
                'user_id' => Auth::id()
            ]);
            
            $defenseRequest->createHonorariumPayments();

            DB::commit();

            return redirect()->back()->with('success', 'Defense marked as completed and honorarium payments created.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error marking defense as completed', [
                'error' => $e->getMessage(),
                'defense_request_id' => $id
            ]);
            return redirect()->back()->with('error', 'Failed to mark defense as completed.');
        }
    }

    /** Coordinator queue (JSON API) */
    public function coordinatorQueue(Request $request)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role,['Coordinator','Administrative Assistant','Dean'])) {
            abort(403);
        }

        $query = DefenseRequest::query()
            ->whereIn('workflow_state', [
                'adviser-approved',
                'coordinator-review',
                'coordinator-approved',
                'coordinator-rejected',
                'panels-assigned',
                'scheduled',
                'completed'
            ]);

        if ($s = $request->input('search')) {
            $query->where(function($q) use ($s){
                $q->where('thesis_title','like',"%$s%")
                  ->orWhere('first_name','like',"%$s%")
                  ->orWhere('last_name','like',"%$s%")
                  ->orWhere('school_id','like',"%$s%");
            });
        }

        $rows = $query
            ->orderByRaw("FIELD(workflow_state,'adviser-approved','coordinator-review','coordinator-approved','panels-assigned','scheduled','completed','coordinator-rejected')")
            ->orderBy('adviser_reviewed_at','desc')
            ->limit(300)
            ->get([
                'id','first_name','middle_name','last_name','school_id','program',
                'thesis_title','defense_type','status','priority','workflow_state',
                'scheduled_date','defense_mode','defense_venue','panels_assigned_at'
            ])->map(function($r){
                return [
                    'id'=>$r->id,
                    'first_name'=>$r->first_name,
                    'last_name'=>$r->last_name,
                    'program'=>$r->program,
                    'thesis_title'=>$r->thesis_title,
                    'defense_type'=>$r->defense_type,
                    'priority'=>$r->priority,
                    'workflow_state'=>$r->workflow_state,
                    'status'=>$r->status,
                    'scheduled_date'=>$r->scheduled_date?->format('Y-m-d'),
                    'defense_mode'=>$r->defense_mode,
                ];
            });

        return response()->json([
            'ok'=>true,
            'items'=>$rows
        ]);
    }

    /** Adviser queue (JSON): all requests assigned to / associated with this adviser needing or showing progress */
    public function adviserQueue(Request $request)
    {
        $user = $request->user();
        if (!$user) abort(401);
        if (!in_array($user->role, ['Faculty','Adviser'])) {
            return response()->json(['error'=>'Forbidden'],403);
        }

        $fullName = strtolower(trim(($user->first_name ?? '').' '.($user->last_name ?? '')));

        $query = DefenseRequest::query()
            ->where(function($q) use ($user,$fullName) {
                $q->where('adviser_user_id', $user->id)
                  ->orWhere('assigned_to_user_id', $user->id)
                  ->orWhereRaw('LOWER(defense_adviser) = ?', [$fullName]);
            })
            // Exclude cancelled workflow_state or status
            ->where('workflow_state', '!=', 'cancelled')
            ->where(function($q) {
                $q->whereNull('status')->orWhere('status', '!=', 'Cancelled');
            });

        if ($s = $request->input('search')) {
            $s = trim($s);
            $query->where(function($q) use ($s){
                $q->where('thesis_title','like',"%$s%")
                  ->orWhere('first_name','like',"%$s%")
                  ->orWhere('last_name','like',"%$s%")
                  ->orWhere('school_id','like',"%$s%");
            });
        }

        // Basic ordering: newest submissions first, but keep those awaiting adviser action on top
        $rows = $query
            ->orderByRaw("FIELD(workflow_state,'submitted','adviser-review','pending','adviser-pending') DESC")
            ->orderByDesc('created_at')
            ->limit(300)
            ->get([
                'id','first_name','last_name','school_id','program',
                'thesis_title','defense_type','priority','workflow_state',
                'status','created_at'
            ])->map(function($r){
                return [
                    'id'            => $r->id,
                    'first_name'    => $r->first_name,
                    'last_name'     => $r->last_name,
                    'school_id'     => $r->school_id,
                    'program'       => $r->program,
                    'thesis_title'  => $r->thesis_title,
                    'defense_type'  => $r->defense_type,
                    'priority'      => $r->priority,
                    'workflow_state'=> $r->workflow_state,
                    'status'        => $r->status ?? 'Pending',
                    'created_at'    => $r->created_at?->toIso8601String(),
                ];
            });

        return response()->json([
            'ok'=>true,
            'items'=>$rows,
            'count'=>$rows->count(),
            'pending_adviser_count'=>$rows->filter(function($r){
                $wf = strtolower($r['workflow_state'] ?? '');
                return in_array($wf, ['','submitted','pending','adviser-pending','adviser-review']);
            })->count(),
        ]);
    }

    public function calendar(Request $request)
    {
        $user = Auth::user();
        if (!$user) abort(401);

        // Only show entries that are effectively approved AND have a scheduled date
        // (Status = Approved OR workflow_state in these states) AND scheduled_date not null.
        $approvedStates = ['coordinator-approved','panels-assigned','scheduled','completed'];

        $q = DefenseRequest::query()
            ->whereNotNull('scheduled_date')
            ->where(function($qq) use ($approvedStates) {
                $qq->where('status','Approved')
                   ->orWhereIn('workflow_state',$approvedStates);
            });

        // Optional: limit to those visible to non-coordinators (e.g., a student only sees own)
        if (in_array($user->role, ['Student'])) {
            $q->where('submitted_by',$user->id);
        }

        if (in_array($user->role, ['Faculty','Adviser'])) {
            $full = strtolower(trim(($user->first_name ?? '').' '.($user->last_name ?? '')));
            $q->where(function($qq) use ($user,$full){
                $qq->where('adviser_user_id',$user->id)
                   ->orWhere('assigned_to_user_id',$user->id)
                   ->orWhereRaw('LOWER(defense_adviser)=?',[$full]);
            });
        }

        $rows = $q->orderBy('scheduled_date')
            ->orderBy('scheduled_time')
            ->limit(500)
            ->get([
                'id','thesis_title','defense_type','status','workflow_state',
                'program','school_id','first_name','last_name',
                'scheduled_date','scheduled_time','scheduled_end_time',
                'defense_mode','defense_venue'
            ])->map(function($r){
                return [
                    'id'              => $r->id,
                    'thesis_title'    => $r->thesis_title,
                    'defense_type'    => $r->defense_type,
                    'status'          => $r->status ?? 'Approved',
                    'workflow_state'  => $r->workflow_state,
                    'student_name'    => trim($r->first_name.' '.$r->last_name),
                    'program'         => $r->program,
                    'school_id'       => $r->school_id,
                    // Frontend expects date_of_defense
                    'date_of_defense' => $r->scheduled_date?->format('Y-m-d'),
                    'start_time'      => $r->scheduled_time,
                    'end_time'        => $r->scheduled_end_time,
                    'defense_mode'    => $r->defense_mode,
                    'defense_venue'   => $r->defense_venue,
                ];
            })->values();

        return response()->json($rows);
    }

    /**
     * API endpoint to get defense request counts
     */
    public function count(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get counts based on user role
            $counts = [
                'total' => DefenseRequest::count(),
                'pending' => DefenseRequest::whereIn('workflow_state', ['submitted', 'pending', 'adviser-pending'])->count(),
                'approved' => DefenseRequest::whereIn('workflow_state', ['adviser-approved', 'coordinator-approved', 'scheduled'])->count(),
                'completed' => DefenseRequest::where('workflow_state', 'completed')->count(),
                'rejected' => DefenseRequest::whereIn('workflow_state', ['adviser-rejected', 'coordinator-rejected'])->count(),
            ];

            // Add role-specific counts
            if (in_array($user->role, ['Coordinator', 'Administrative Assistant', 'Dean'])) {
                $counts['coordinator_review'] = DefenseRequest::where('workflow_state', 'coordinator-review')->count();
            }

            if (in_array($user->role, ['Faculty', 'Adviser'])) {
                $counts['adviser_review'] = DefenseRequest::where('workflow_state', 'adviser-review')->count();
            }

            return response()->json($counts);
        } catch (\Exception $e) {
            Log::error('Defense request count error: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to fetch counts'], 500);
        }
    }

    private function normalizeStatusForCoordinator(DefenseRequest $r): string
    {
        return match($r->workflow_state) {
            'adviser-rejected','coordinator-rejected' => 'Rejected',
            'coordinator-approved','scheduled','completed' => 'Approved',
            default => 'Pending',
        };
    }

    public function assignedPanelistsCount()
    {
        $fields = [
            'defense_chairperson',
            'defense_panelist1',
            'defense_panelist2',
            'defense_panelist3',
            'defense_panelist4',
        ];

        $count = 0;
        foreach (\App\Models\DefenseRequest::all() as $dr) {
            foreach ($fields as $field) {
                if (!empty($dr->$field)) {
                    $count++;
                }
            }
        }

        return response()->json(['assignedPanelists' => $count]);
    }

    public function bulkApprove(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Faculty', 'Adviser'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:defense_requests,id',
        ]);

        $coordinator = $user->coordinators()->first();
        if (!$coordinator) {
            return response()->json(['error' => 'No coordinator registered.'], 422);
        }

        $updated = [];
        foreach ($data['ids'] as $id) {
            $defenseRequest = DefenseRequest::find($id);
            if (!$defenseRequest) continue;

            // Only allow if in correct state
            if (!in_array($defenseRequest->workflow_state, ['submitted', 'adviser-review', 'adviser-rejected'])) continue;

            $fromState = $defenseRequest->workflow_state;
            $defenseRequest->workflow_state = 'adviser-approved';
            $defenseRequest->adviser_status = 'Approved'; // <-- NEW
            $defenseRequest->status = 'Pending';
            $defenseRequest->adviser_reviewed_at = now();
            $defenseRequest->adviser_reviewed_by = $user->id;
            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = $user->id;
            $defenseRequest->coordinator_user_id = $coordinator->id;

            // Add workflow entry
            $hist = $defenseRequest->workflow_history ?? [];
            $hist[] = [
                'action'=>'adviser-approved',
                'timestamp'=>now()->toISOString(),
                'user_id'=>$user->id,
                'user_name'=>$user->first_name.' '.$user->last_name,
                'from_state'=>$fromState,
                'to_state'=>'adviser-approved'
            ];
            $defenseRequest->workflow_history = $hist;

            $defenseRequest->save();
            $updated[] = $id;
        }

        return response()->json([
            'ok' => true,
            'updated_ids' => $updated,
        ]);
    }

    public function bulkReject(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Faculty', 'Adviser'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:defense_requests,id',
        ]);

        $updated = [];
        foreach ($data['ids'] as $id) {
            $defenseRequest = DefenseRequest::find($id);
            if (!$defenseRequest) continue;

            // Only allow if in correct state
            if (!in_array($defenseRequest->workflow_state, ['submitted', 'adviser-review', 'adviser-approved'])) continue;

            $defenseRequest->workflow_state = 'adviser-rejected';
            $defenseRequest->adviser_status = 'Rejected'; // <-- NEW
            $defenseRequest->status = 'Rejected';
            $defenseRequest->adviser_reviewed_at = now();
            $defenseRequest->adviser_reviewed_by = $user->id;
            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = $user->id;
            $defenseRequest->coordinator_user_id = null;

            $defenseRequest->save();
            $updated[] = $id;
        }

        return response()->json([
            'ok' => true,
            'updated_ids' => $updated,
        ]);
    }

    public function bulkRetrieve(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Faculty', 'Adviser'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:defense_requests,id',
        ]);

        $updated = [];
        foreach ($data['ids'] as $id) {
            $defenseRequest = DefenseRequest::find($id);
            if (!$defenseRequest) continue;

            // Only allow if in correct state
            if (!in_array($defenseRequest->workflow_state, ['adviser-approved', 'adviser-rejected'])) continue;

            $defenseRequest->workflow_state = 'adviser-review';
            $defenseRequest->status = 'Pending';
            $defenseRequest->coordinator_user_id = null;
            $defenseRequest->save();
            $updated[] = $id;
        }

        return response()->json([
            'ok' => true,
            'updated_ids' => $updated,
        ]);
    }

    public function uploadDocuments(Request $request, DefenseRequest $defenseRequest)
    {
        $data = [];
        if ($request->hasFile('ai_detection_certificate')) {
            $file = $request->file('ai_detection_certificate');
            $path = $file->store('defense_documents', 'public');
            $defenseRequest->ai_detection_certificate = '/storage/' . $path;
            $data['ai_detection_certificate'] = $defenseRequest->ai_detection_certificate;
        }
        if ($request->hasFile('endorsement_form')) {
            $file = $request->file('endorsement_form');
            $path = $file->store('defense_documents', 'public');
            $defenseRequest->endorsement_form = '/storage/' . $path;
            $data['endorsement_form'] = $defenseRequest->endorsement_form;
        }
        $defenseRequest->save();

        return response()->json($data);
    }

    public function updateAdviserStatus(Request $request, DefenseRequest $defenseRequest)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Faculty', 'Adviser'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'adviser_status' => 'required|in:Pending,Approved,Rejected',
            'coordinator_user_id' => 'nullable|integer|exists:users,id', // <-- add this
        ]);

        $fromState = $defenseRequest->workflow_state;
        $defenseRequest->adviser_status = $data['adviser_status'];

        // Update workflow_state based on status
        if ($data['adviser_status'] === 'Approved') {
            $defenseRequest->workflow_state = 'adviser-approved';
            $defenseRequest->status = 'Pending';
        } elseif ($data['adviser_status'] === 'Rejected') {
            $defenseRequest->workflow_state = 'adviser-rejected';
            $defenseRequest->status = 'Rejected';
        } else {
            $defenseRequest->workflow_state = 'adviser-review';
            $defenseRequest->status = 'Pending';
        }

        $defenseRequest->adviser_reviewed_at = now();
        $defenseRequest->adviser_reviewed_by = $user->id;
        $defenseRequest->last_status_updated_at = now();
        $defenseRequest->last_status_updated_by = $user->id;

        // Add workflow entry
        $hist = $defenseRequest->workflow_history ?? [];
        $hist[] = [
            'action' => 'adviser-status-updated',
            'adviser_status' => $data['adviser_status'],
            'timestamp' => now()->toISOString(),
            'user_id' => $user->id,
            'user_name' => $user->first_name . ' ' . $user->last_name,
            'from_state' => $fromState,
            'to_state' => $defenseRequest->workflow_state
        ];
        $defenseRequest->workflow_history = $hist;

        // --- FIX: Use coordinator_user_id from request if present ---
        if ($data['adviser_status'] === 'Approved') {
            if (!empty($data['coordinator_user_id'])) {
                $defenseRequest->coordinator_user_id = $data['coordinator_user_id'];
            } elseif (!$defenseRequest->coordinator_user_id) {
                // Fallback: Find the coordinator for this program/department
                $coordinator = User::where('role', 'Coordinator')
                    ->where('program', $defenseRequest->program)
                    ->first();

                if ($coordinator) {
                    $defenseRequest->coordinator_user_id = $coordinator->id;
                }
            }
        } else {
            $defenseRequest->coordinator_user_id = null;
        }

        $defenseRequest->save();

        return response()->json([
            'ok' => true,
            'request' => $defenseRequest,
            'workflow_history' => $defenseRequest->workflow_history,
        ]);
    }

    public function allForCoordinator(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Coordinator','Administrative Assistant','Dean'])) {
            abort(403);
        }

        $query = DefenseRequest::query();

        // FIXED: AA should see all approved/completed requests, not just assigned to them
        if ($user->role === 'Administrative Assistant') {
            $query->whereIn('coordinator_status', ['Approved'])
                  ->whereIn('workflow_state', [
                      'coordinator-approved',
                      'panels-assigned',
                      'scheduled',
                      'completed'
                  ]);
        } else {
            // Only show requests assigned to this coordinator
            $query->where('coordinator_user_id', $user->id);

            // Only show requests in states relevant to the coordinator
            $query->whereIn('workflow_state', [
                'adviser-approved',
                'coordinator-review',
                'coordinator-approved',
                'panels-assigned',
                'scheduled',
                'completed',
                'coordinator-rejected'
            ]);
        }

        if ($s = $request->input('search')) {
            $query->where(function($q) use ($s){
                $q->where('thesis_title','like',"%$s%")
                  ->orWhere('first_name','like',"%$s%")
                  ->orWhere('last_name','like',"%$s%")
                  ->orWhere('school_id','like',"%$s%");
            });
        }

        $rows = $query
            ->with('aaVerification') // Load AA verification
            ->orderByDesc('created_at')
            ->limit(500)
            ->get([
                'id','first_name','middle_name','last_name','school_id','program',
                'thesis_title','defense_type','status','priority','workflow_state',
                'scheduled_date','defense_mode','defense_venue','panels_assigned_at',
                'defense_adviser','submitted_at',
                'coordinator_status',
                'amount',
                'reference_no',
                'coordinator_user_id',
            ])
            ->map(function($r){
                $programLevel = \App\Helpers\ProgramLevel::getLevel($r->program);
                $expectedTotal = \App\Models\PaymentRate::where('program_level', $programLevel)
                    ->where('defense_type', $r->defense_type)
                    ->sum('amount');

                $coordinator = null;
                if ($r->coordinator_user_id) {
                    $coordUser = \App\Models\User::find($r->coordinator_user_id);
                    if ($coordUser) {
                        $coordinator = trim($coordUser->first_name . ' ' . ($coordUser->middle_name ? strtoupper($coordUser->middle_name[0]) . '. ' : '') . $coordUser->last_name);
                    }
                }

                return [
                    'id' => $r->id,
                    'first_name' => $r->first_name,
                    'middle_name' => $r->middle_name,
                    'last_name' => $r->last_name,
                    'program' => $r->program,
                    'thesis_title' => $r->thesis_title,
                    'defense_type' => $r->defense_type,
                    'priority' => $r->priority,
                    'workflow_state' => $r->workflow_state,
                    'status' => $r->status,
                    'scheduled_date' => $r->scheduled_date?->format('Y-m-d'),
                    'date_of_defense' => $r->scheduled_date
                        ? $r->scheduled_date->format('Y-m-d')
                        : ($r->created_at ? $r->created_at->format('Y-m-d') : null),
                    'defense_mode' => $r->defense_mode,
                    'mode_defense' => $r->defense_mode,
                    'adviser' => $r->defense_adviser ?? '—',
                    'submitted_at' => $r->submitted_at ? \Carbon\Carbon::parse($r->submitted_at)->format('Y-m-d H:i:s') : null,
                    'coordinator_status' => $r->coordinator_status,
                    'expected_rate' => $expectedTotal,
                    'amount' => $r->amount,
                    'reference_no' => $r->reference_no,
                    'coordinator' => $coordinator,
                    // AA verification status
                    'aa_verification_status' => $r->aaVerification ? $r->aaVerification->status : 'pending',
                    'aa_verification_id' => $r->aaVerification ? $r->aaVerification->id : null,
                ];
            });

        return response()->json($rows);
    }

    public function savePanels(Request $request, DefenseRequest $defenseRequest)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Coordinator','Administrative Assistant','Dean'])) {
            return response()->json(['error'=>'Unauthorized'],403);
        }

        $data = $request->validate([
            'defense_chairperson' => 'nullable|string|max:255',
            'defense_panelist1' => 'nullable|string|max:255',
            'defense_panelist2' => 'nullable|string|max:255',
            'defense_panelist3' => 'nullable|string|max:255',
            'defense_panelist4' => 'nullable|string|max:255',
        ]);

        $originalState = $defenseRequest->workflow_state;

        // Save panel assignments
        $defenseRequest->defense_chairperson = $data['defense_chairperson'] ?? null;
        $defenseRequest->defense_panelist1 = $data['defense_panelist1'] ?? null;
        $defenseRequest->defense_panelist2 = $data['defense_panelist2'] ?? null;
        $defenseRequest->defense_panelist3 = $data['defense_panelist3'] ?? null;
        $defenseRequest->defense_panelist4 = $data['defense_panelist4'] ?? null;
        $defenseRequest->panels_assigned_at = now();

        // Always update workflow_state/history if any panel field changes
        $defenseRequest->workflow_state = 'panels-assigned';

        // Add workflow history entry
        $hist = $defenseRequest->workflow_history ?? [];
        $hist[] = [
            'action' => 'Panels Assigned',
            'timestamp' => now()->toISOString(),
            'user_id' => $user->id,
            'user_name' => $user->first_name . ' ' . $user->last_name,
            'from_state' => $originalState,
            'to_state' => 'panels-assigned'
        ];
        $defenseRequest->workflow_history = $hist;

        $defenseRequest->last_status_updated_at = now();
        $defenseRequest->last_status_updated_by = $user->id;
        $defenseRequest->save();

        return response()->json([
            'ok' => true,
            'request' => $defenseRequest,
            'workflow_history' => $defenseRequest->workflow_history,
            'workflow_state' => $defenseRequest->workflow_state,
        ]);
    }

    public function showAADetails($id)
    {
        $user = \Auth::user();
        if (!$user || !in_array($user->role, ['Administrative Assistant', 'Dean'])) {
            abort(403);
        }

        $defenseRequest = \App\Models\DefenseRequest::findOrFail($id);

        // Use the helper to get the program level
        $programLevel = \App\Helpers\ProgramLevel::getLevel($defenseRequest->program);

        // Sum all rates for this program level and defense type
        $expectedTotal = \App\Models\PaymentRate::where('program_level', $programLevel)
            ->where('defense_type', $defenseRequest->defense_type)
            ->sum('amount');

        // Get coordinator name
        $coordinatorInfo = null;
        if ($defenseRequest->coordinator_user_id) {
            $coordUser = \App\Models\User::find($defenseRequest->coordinator_user_id);
            if ($coordUser) {
                $coordinatorInfo = [
                    'id' => $coordUser->id,
                    'name' => trim($coordUser->first_name . ' ' . ($coordUser->middle_name ? strtoupper($coordUser->middle_name[0]) . '. ' : '') . $coordUser->last_name),
                    'email' => $coordUser->email,
                ];
            }
        }

        // Get AA verification status
        $aaVerification = \App\Models\AaPaymentVerification::where('defense_request_id', $defenseRequest->id)->first();
        
        // Compose panelists list
        $panelistFields = [
            $defenseRequest->defense_chairperson,
            $defenseRequest->defense_panelist1,
            $defenseRequest->defense_panelist2,
            $defenseRequest->defense_panelist3,
            $defenseRequest->defense_panelist4,
        ];
        $panelists = collect($panelistFields)
            ->filter()
            ->map(function ($panelistIdOrName) {
                if (is_numeric($panelistIdOrName)) {
                    $p = \App\Models\Panelist::find($panelistIdOrName);
                    if ($p) return ['id' => $p->id, 'name' => $p->name];
                }
                return ['id' => null, 'name' => $panelistIdOrName];
            })->values()->all();

        return \Inertia\Inertia::render('assistant/all-defense-list/details', [
            'defenseRequest' => [
                'id' => $defenseRequest->id,
                'first_name' => $defenseRequest->first_name,
                'middle_name' => $defenseRequest->middle_name,
                'last_name' => $defenseRequest->last_name,
                'school_id' => $defenseRequest->school_id,
                'program' => $defenseRequest->program,
                'thesis_title' => $defenseRequest->thesis_title,
                'defense_type' => $defenseRequest->defense_type,
                'status' => $defenseRequest->status,
                'priority' => $defenseRequest->priority,
                'workflow_state' => $defenseRequest->workflow_state,
                'scheduled_date' => $defenseRequest->scheduled_date?->format('Y-m-d'),
                'scheduled_time' => $defenseRequest->scheduled_time,
                'scheduled_end_time' => $defenseRequest->scheduled_end_time,
                'defense_mode' => $defenseRequest->defense_mode,
                'defense_venue' => $defenseRequest->defense_venue,
                'scheduling_notes' => $defenseRequest->scheduling_notes,
                'adviser' => $defenseRequest->defense_adviser,
                'submitted_at' => $defenseRequest->submitted_at 
                    ? \Carbon\Carbon::parse($defenseRequest->submitted_at)->format('Y-m-d H:i:s') 
                    : null,
                'panelists' => $panelists,
                'defense_adviser' => $defenseRequest->defense_adviser,
                'defense_chairperson' => $defenseRequest->defense_chairperson,
                'defense_panelist1' => $defenseRequest->defense_panelist1,
                'defense_panelist2' => $defenseRequest->defense_panelist2,
                'defense_panelist3' => $defenseRequest->defense_panelist3,
                'defense_panelist4' => $defenseRequest->defense_panelist4,
                'amount' => $defenseRequest->amount,
                'reference_no' => $defenseRequest->reference_no,
                'expected_rate' => $expectedTotal,
                'coordinator' => $coordinatorInfo,
                'coordinator_status' => $defenseRequest->coordinator_status,
                'adviser_status' => $defenseRequest->adviser_status,
                'aa_verification_status' => $aaVerification ? $aaVerification->status : null,
                'aa_verification_id' => $aaVerification ? $aaVerification->id : null,
                'attachments' => [
                    'advisers_endorsement' => $defenseRequest->advisers_endorsement,
                    'rec_endorsement' => $defenseRequest->rec_endorsement,
                    'proof_of_payment' => $defenseRequest->proof_of_payment,
                    'manuscript_proposal' => $defenseRequest->manuscript_proposal,
                    'similarity_index' => $defenseRequest->similarity_index,
                    'avisee_adviser_attachment' => $defenseRequest->avisee_adviser_attachment,
                    'ai_detection_certificate' => $defenseRequest->ai_detection_certificate,
                    'endorsement_form' => $defenseRequest->endorsement_form,
                ],
                'last_status_updated_by' => $defenseRequest->last_status_updated_by,
                'last_status_updated_by_name' => $defenseRequest->last_status_updated_by_name,
                'last_status_updated_at' => $defenseRequest->last_status_updated_at,
                'workflow_history' => $defenseRequest->workflow_history ?? [],
                'program_level' => $programLevel,
            ],
        ]);
    }

    /**
     * Manually mark a defense as completed
     */
    public function completeDefense(Request $request, DefenseRequest $defenseRequest)
    {
        // Check authorization
        $user = Auth::user();
        if (!in_array($user->role, ['Administrative Assistant', 'Dean', 'Coordinator'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        DB::beginTransaction();
        try {
            // Update defense request to completed
            $defenseRequest->workflow_state = 'completed';
            $defenseRequest->coordinator_status = 'Approved';
            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = Auth::id();
            
            // Add workflow history
            $defenseRequest->addWorkflowEntry(
                'marked-completed',
                'Defense marked as completed by ' . $user->name,
                Auth::id(),
                $defenseRequest->workflow_state,
                'completed'
            );

            $defenseRequest->save();

            // 🎉 AUTOMATICALLY CREATE HONORARIUM PAYMENTS
            Log::info('Defense marked as completed, creating honorarium payments', [
                'defense_id' => $defenseRequest->id,
                'user_id' => Auth::id(),
                'user_name' => $user->name
            ]);
            
            $defenseRequest->createHonorariumPayments();

            DB::commit();

            Log::info('Defense completed successfully', [
                'defense_id' => $defenseRequest->id,
                'payments_created' => $defenseRequest->honorariumPayments()->count()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Defense marked as completed and honorarium payments created.',
                'defense' => [
                    'id' => $defenseRequest->id,
                    'workflow_state' => $defenseRequest->workflow_state,
                    'status' => 'Completed',
                    'payments_count' => $defenseRequest->honorariumPayments()->count()
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error marking defense as completed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'defense_request_id' => $defenseRequest->id
            ]);
            
            return response()->json([
                'error' => 'Failed to mark defense as completed: ' . $e->getMessage()
            ], 500);
        }
    }
}
