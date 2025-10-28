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
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Jobs\GenerateDefenseDocumentsJob;
use App\Mail\DefenseRequestSubmitted;
use App\Mail\DefenseRequestApproved;
use App\Mail\DefenseRequestRejected;
use App\Mail\DefenseScheduled;
use App\Mail\DefenseRequestAssignedToCoordinator;
use App\Helpers\ProgramLevel;
use App\Models\PaymentRate;

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

            // --- AA filter ---
            if ($user->role === 'Administrative Assistant') {
                $query->where('coordinator_status', 'Approved');
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
                    'coordinator_status' // <-- ADDED
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
                            // Try to resolve by ID first
                            if (is_numeric($panelistIdOrName)) {
                                $p = \App\Models\Panelist::find($panelistIdOrName);
                                if ($p) return ['id' => $p->id, 'name' => $p->name];
                            }
                            // Fallback: treat as name string
                            return ['id' => null, 'name' => $panelistIdOrName];
                        })->values()->all();

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
                        // ADD THESE TWO FIELDS:
                        'adviser' => $r->defense_adviser ?: '—',
                        'submitted_at' => $r->adviser_reviewed_at
                            ? (is_object($r->adviser_reviewed_at)
                                ? $r->adviser_reviewed_at->format('Y-m-d H:i:s')
                                : date('Y-m-d H:i:s', strtotime($r->adviser_reviewed_at)))
                            : '—',
                        // ADD THIS LINE:
                        'panelists' => $panelists,
                        // <-- ADDED
                        'coordinator_status' => $r->coordinator_status, // <-- ADDED
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

            // Calculate and set the expected amount based on payment rates
            $defenseRequest->calculateAndSetAmount();
            $defenseRequest->save();

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
            'decision' => 'required|in:approve,reject',
            'comment'  => 'nullable|string|max:3000'
        ]);
        $comment = $data['comment'] ?? null;

        $allowedCurrent = ['adviser-approved','coordinator-review'];
        $current = $defenseRequest->workflow_state;
        if (!in_array($current, $allowedCurrent)) {
            return response()->json([
                'error'=>"Cannot act in state '{$current}'"
            ],422);
        }

        try {
            $defenseRequest->ensureSubmittedHistory();

            if ($data['decision'] === 'approve') {
                $defenseRequest->workflow_state = 'coordinator-approved';
                $defenseRequest->status = 'Approved';
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
            } else {
                $defenseRequest->workflow_state = 'coordinator-rejected';
                $defenseRequest->status = 'Rejected';
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
                } else {
                    Mail::to($student->email)
                        ->queue(new DefenseRequestRejected(
                            $defenseRequest,
                            $student,
                            'coordinator',
                            $comment
                        ));
                }
            }

            // --- NEW: Auto-create payment verification record if approved ---
            if ($defenseRequest->coordinator_status === 'Approved') {
                $existing = \App\Models\AaPaymentVerification::where('defense_request_id', $defenseRequest->id)->first();
                if (!$existing) {
                    \App\Models\AaPaymentVerification::create([
                        'defense_request_id' => $defenseRequest->id,
                        'assigned_to' => null, // or set to an AA user id if you want
                        'status' => 'pending',
                        'remarks' => null,
                    ]);
                }
            }

            return response()->json([
                'ok'=>true,
                'workflow_state'=>$defenseRequest->workflow_state,
                'status'=>$defenseRequest->status,
                'coordinator_comments'=>$defenseRequest->coordinator_comments,
                'adviser_comments'=>$defenseRequest->adviser_comments,
                'workflow_history'=>$defenseRequest->workflow_history
            ]);
        } catch (\Throwable $e) {
            Log::error('coordinatorDecision error',[
                'id'=>$defenseRequest->id,
                'error'=>$e->getMessage()
            ]);
            return response()->json(['error'=>app()->environment('local')?$e->getMessage():'Internal error'],500);
        }
    }

    /** Lightweight API for polling */
    public function apiShow(DefenseRequest $defenseRequest)
    {
        $user = Auth::user();
        if (!$user) abort(401);

        return response()->json([
            'id' => $defenseRequest->id,
            'thesis_title' => $defenseRequest->thesis_title,
            'school_id' => $defenseRequest->school_id,
            'status' => $defenseRequest->status,
            'workflow_state' => $defenseRequest->workflow_state,
            'workflow_state_display' => $defenseRequest->workflow_state_display ?? null,
            'adviser_comments' => $defenseRequest->adviser_comments,
            'coordinator_comments' => $defenseRequest->coordinator_comments,
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
            'panels_assigned_at' => $defenseRequest->panels_assigned_at,
            'request' => $defenseRequest,
            'coordinator_status_display' => $defenseRequest->coordinator_status_display,
            // ADD THESE:
            'amount' => $defenseRequest->amount,
            'reference_no' => $defenseRequest->reference_no,
            // If you want to send attachments as well:
            'attachments' => $defenseRequest->attachments,
        ]);
    }

    public function updateStatus(Request $request, DefenseRequest $defenseRequest)
    {
        try {
            Log::info('updateStatus called', [
                'defense_id' => $defenseRequest->id,
                'request_data' => $request->all()
            ]);

            $user = Auth::user();
            if (!$user) {
                Log::warning('updateStatus: Unauthorized - no user');
                return response()->json(['error'=>'Unauthorized'],401);
            }

            $coordinatorRoles = ['Coordinator','Administrative Assistant','Dean'];
            if (!in_array($user->role,$coordinatorRoles)) {
                Log::warning('updateStatus: Forbidden', ['user_role' => $user->role]);
                return response()->json(['error'=>'Forbidden'],403);
            }

            // Map decision to status for backward compatibility
            $decision = $request->input('decision');
            if ($decision) {
                $statusMap = [
                    'approve' => 'Approved',
                    'reject' => 'Rejected',
                    'retrieve' => 'Pending',
                ];
                $request->merge(['status' => $statusMap[$decision] ?? 'Pending']);
            }

            $data = $request->validate([
                'status' => 'required|in:Pending,Approved,Rejected,Completed',
                // Optional payloads when approving: panels and schedule
                'panels' => 'sometimes|array',
                'panels.defense_chairperson' => 'sometimes|string|max:255',
                'panels.defense_panelist1' => 'sometimes|string|max:255',
                'panels.defense_panelist2' => 'sometimes|string|max:255',
                'panels.defense_panelist3' => 'sometimes|string|max:255',
                'panels.defense_panelist4' => 'sometimes|string|max:255',
                'schedule' => 'sometimes|array',
                'schedule.scheduled_date' => 'sometimes|date',
                'schedule.scheduled_time' => 'sometimes|date_format:H:i',
                'schedule.scheduled_end_time' => 'sometimes|date_format:H:i',
                'schedule.defense_mode' => 'sometimes|in:face-to-face,online',
                'schedule.defense_venue' => 'sometimes|string|max:255',
                'send_email' => 'sometimes|boolean',
                'force' => 'sometimes|boolean'
            ]);

            Log::info('updateStatus validation passed', [
                'target_status' => $data['status'],
                'has_panels' => isset($data['panels']),
                'has_schedule' => isset($data['schedule']),
                'send_email' => $data['send_email'] ?? false,
                'force' => $data['force'] ?? false
            ]);

            $target = $data['status'];
        $sendEmail = $data['send_email'] ?? false;
        $force = $data['force'] ?? false;
        $originalState = $defenseRequest->workflow_state;

        // Initialize snapshot variables (needed for all status changes)
        $previousSchedule = null;
        $previousPanels = null;

        // If approving, optionally save panels/schedule first (atomic)
        if ($target === 'Approved') {
            // Capture snapshots BEFORE any changes (only if re-approving)
            if ($defenseRequest->coordinator_status === 'Approved') {
                $previousSchedule = [
                    'scheduled_date' => $defenseRequest->scheduled_date,
                    'scheduled_time' => $defenseRequest->scheduled_time,
                    'scheduled_end_time' => $defenseRequest->scheduled_end_time,
                    'defense_venue' => $defenseRequest->defense_venue,
                ];
                
                $previousPanels = [
                    'defense_chairperson' => $defenseRequest->defense_chairperson,
                    'defense_panelist1' => $defenseRequest->defense_panelist1,
                    'defense_panelist2' => $defenseRequest->defense_panelist2,
                    'defense_panelist3' => $defenseRequest->defense_panelist3,
                    'defense_panelist4' => $defenseRequest->defense_panelist4,
                ];
            }

            // If panels payload provided, validate basic assignment rules via service
            $conflictService = new \App\Services\DefenseConflictService();
            if (isset($data['panels'])) {
                // Merge panels with existing values - only update non-empty fields
                // Also filter out placeholder values like "Panel 1", "Panel 2", etc.
                $panelsToValidate = [];
                foreach ($data['panels'] as $k => $v) {
                    $trimmed = trim($v ?? '');
                    // Skip if empty or looks like a placeholder (e.g., "Panel 1", "Panel 2")
                    if (empty($trimmed) || preg_match('/^Panel\s+\d+$/i', $trimmed)) {
                        // Use existing value from database if available
                        if (!empty($defenseRequest->{$k}) && !preg_match('/^Panel\s+\d+$/i', $defenseRequest->{$k})) {
                            $panelsToValidate[$k] = $defenseRequest->{$k};
                        }
                    } else {
                        // Use the new value from payload
                        $panelsToValidate[$k] = $trimmed;
                    }
                }
                
                Log::info('Panels after filtering placeholders', [
                    'payload' => $data['panels'],
                    'validated' => $panelsToValidate,
                    'existing_in_db' => [
                        'defense_chairperson' => $defenseRequest->defense_chairperson,
                        'defense_panelist1' => $defenseRequest->defense_panelist1,
                        'defense_panelist2' => $defenseRequest->defense_panelist2,
                        'defense_panelist3' => $defenseRequest->defense_panelist3,
                        'defense_panelist4' => $defenseRequest->defense_panelist4,
                    ]
                ]);
                
                if (!empty($panelsToValidate)) {
                    $panelErrors = $conflictService->validateAssignmentBasic($defenseRequest, $panelsToValidate);
                    if (!empty($panelErrors) && !$force) {
                        Log::warning('Panel validation failed', ['errors' => $panelErrors]);
                        return response()->json(['error' => 'Panel validation failed', 'errors' => $panelErrors], 422);
                    }
                    // Apply panels to model (only non-empty, non-placeholder values)
                    foreach ($data['panels'] as $k => $v) {
                        $trimmed = trim($v ?? '');
                        if (!empty($trimmed) && !preg_match('/^Panel\s+\d+$/i', $trimmed)) {
                            $defenseRequest->{$k} = $trimmed;
                        }
                    }
                    $defenseRequest->panels_assigned_at = now();
                }
            }

            // If schedule provided, check conflicts before saving
            if (isset($data['schedule'])) {
                $sched = $data['schedule'];
                
                // Merge schedule with existing values - use database values for empty fields
                $scheduleToValidate = [];
                foreach (['scheduled_date','scheduled_time','scheduled_end_time','defense_mode','defense_venue'] as $f) {
                    if (!empty($sched[$f])) {
                        $scheduleToValidate[$f] = $sched[$f];
                    } elseif (!empty($defenseRequest->{$f})) {
                        // Use existing value from database
                        $scheduleToValidate[$f] = $defenseRequest->{$f};
                    }
                }
                
                // Check completeness - all required fields must have values (either new or existing)
                $missing = [];
                foreach (['scheduled_date','scheduled_time','scheduled_end_time','defense_mode','defense_venue'] as $f) {
                    if (empty($scheduleToValidate[$f])) {
                        $missing[] = $f;
                    }
                }
                
                if (!empty($missing) && !$force) {
                    Log::warning('Missing schedule fields after merge', [
                        'missing' => $missing,
                        'payload' => $sched,
                        'existing' => [
                            'scheduled_date' => $defenseRequest->scheduled_date,
                            'scheduled_time' => $defenseRequest->scheduled_time,
                            'scheduled_end_time' => $defenseRequest->scheduled_end_time,
                            'defense_mode' => $defenseRequest->defense_mode,
                            'defense_venue' => $defenseRequest->defense_venue,
                        ]
                    ]);
                    return response()->json(['error'=>'Missing schedule fields','missing'=>$missing],422);
                }

                // conflict checks - use merged values
                $panelsForCheck = [
                    'defense_chairperson' => $data['panels']['defense_chairperson'] ?? $defenseRequest->defense_chairperson,
                    'defense_panelist1' => $data['panels']['defense_panelist1'] ?? $defenseRequest->defense_panelist1,
                    'defense_panelist2' => $data['panels']['defense_panelist2'] ?? $defenseRequest->defense_panelist2,
                    'defense_panelist3' => $data['panels']['defense_panelist3'] ?? $defenseRequest->defense_panelist3,
                    'defense_panelist4' => $data['panels']['defense_panelist4'] ?? $defenseRequest->defense_panelist4,
                ];

                $conflicts = $conflictService->findPanelSchedulingConflicts(
                    $defenseRequest,
                    $panelsForCheck,
                    $scheduleToValidate['scheduled_date'] ?? null,
                    $scheduleToValidate['scheduled_time'] ?? null,
                    $scheduleToValidate['scheduled_end_time'] ?? null
                );
                if (!empty($conflicts) && !$force) {
                    return response()->json(['error'=>'Scheduling conflicts detected','conflicts'=>$conflicts],422);
                }

                // Persist schedule (only non-empty values from payload)
                foreach ($sched as $k => $v) {
                    if (!empty($v) || $v === '0') { // Allow '0' as valid value
                        $defenseRequest->{$k} = $v;
                    }
                }
                $defenseRequest->workflow_state = 'scheduled';
            }

        }

            // --- Update coordinator_status and workflow_state ---
            if ($target === 'Approved') {
                $defenseRequest->coordinator_status = 'Approved';
                $defenseRequest->workflow_state = 'coordinator-approved';
                $defenseRequest->status = 'Approved';
            } elseif ($target === 'Rejected') {
                $defenseRequest->coordinator_status = 'Rejected';
                $defenseRequest->workflow_state = 'coordinator-rejected';
                $defenseRequest->status = 'Rejected';
            } elseif ($target === 'Pending') {
                $defenseRequest->coordinator_status = 'Pending';
                $defenseRequest->workflow_state = 'coordinator-review';
                $defenseRequest->status = 'Pending';
            } elseif ($target === 'Completed') {
                $defenseRequest->coordinator_status = 'Approved'; // or 'Completed' if you want a new value
                $defenseRequest->workflow_state = 'completed';
                $defenseRequest->status = 'Completed';
            }

            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = $user->id;

            // Store snapshots for change detection
            // On first approval: Store current values as snapshot for future comparisons
            // On re-approval: Store old values (captured before changes) for change detection
            if ($target === 'Approved') {
                if ($previousSchedule || $previousPanels) {
                    // Re-approval: store the OLD values we captured
                    $defenseRequest->previous_schedule_snapshot = $previousSchedule;
                    $defenseRequest->previous_panels_snapshot = $previousPanels;
                } else {
                    // First approval: store CURRENT values for future comparison
                    $defenseRequest->previous_schedule_snapshot = [
                        'scheduled_date' => $defenseRequest->scheduled_date,
                        'scheduled_time' => $defenseRequest->scheduled_time,
                        'scheduled_end_time' => $defenseRequest->scheduled_end_time,
                        'defense_venue' => $defenseRequest->defense_venue,
                    ];
                    $defenseRequest->previous_panels_snapshot = [
                        'defense_chairperson' => $defenseRequest->defense_chairperson,
                        'defense_panelist1' => $defenseRequest->defense_panelist1,
                        'defense_panelist2' => $defenseRequest->defense_panelist2,
                        'defense_panelist3' => $defenseRequest->defense_panelist3,
                        'defense_panelist4' => $defenseRequest->defense_panelist4,
                    ];
                }
            } elseif ($target === 'Pending') {
                // Clear snapshots when retrieving (back to pending)
                $defenseRequest->previous_schedule_snapshot = null;
                $defenseRequest->previous_panels_snapshot = null;
            }

            // --- Add workflow history entry ---
            $hist = $defenseRequest->workflow_history ?? [];
            $hist[] = [
                'action' => 'coordinator-status-updated',
                'coordinator_status' => $defenseRequest->coordinator_status,
                'timestamp' => now()->toISOString(),
                'user_id' => $user->id,
                'user_name' => $user->first_name . ' ' . $user->last_name,
                'from_state' => $originalState,
                'to_state' => $defenseRequest->workflow_state
            ];
            $defenseRequest->workflow_history = $hist;

            $defenseRequest->save();

            // --- Send email notifications if requested (only for approve/reject) ---
            if ($sendEmail && ($target === 'Approved' || $target === 'Rejected')) {
                $this->sendApprovalNotifications($defenseRequest, $target);
            }

            return response()->json([
                'ok' => true,
                'request' => $defenseRequest,
                'workflow_history' => $defenseRequest->workflow_history,
                'workflow_state' => $defenseRequest->workflow_state,
                'status' => $defenseRequest->status,
                'coordinator_status' => $defenseRequest->coordinator_status,
            ]);
        } catch (\Throwable $e) {
            Log::error('updateStatus error',[
                'id'=>$defenseRequest->id,
                'error'=>$e->getMessage()
            ]);
            return response()->json(['error'=>'Update failed'],500);
        }
    }

    /**
     * Send email notifications when defense is approved or rejected
     */
    private function sendApprovalNotifications(DefenseRequest $defenseRequest, string $status)
    {
        try {
            Log::info('sendApprovalNotifications called', [
                'defense_id' => $defenseRequest->id,
                'status' => $status
            ]);

            $student = $defenseRequest->student;
            $adviser = $defenseRequest->adviser;
            
            Log::info('Email recipients loaded', [
                'student_id' => $student?->id,
                'student_email' => $student?->email,
                'adviser_id' => $adviser?->id,
                'adviser_email' => $adviser?->email,
            ]);

            // If status is Rejected, send rejection email and return
            if ($status === 'Rejected') {
                Log::info('Sending rejection email to student');
                if ($student && $student->email) {
                    Mail::to($student->email)->send(new DefenseRequestRejected(
                        $defenseRequest,
                        $student,
                        'coordinator',
                        $defenseRequest->coordinator_comment ?? 'Please review and resubmit your defense request.'
                    ));
                    Log::info('Rejection email sent to student');
                } else {
                    Log::warning('Student email skipped for rejection', [
                        'has_student' => !!$student,
                        'has_email' => $student?->email
                    ]);
                }
                return;
            }

            // Detect changes for re-approval (ONLY if snapshots exist = was previously approved)
            $isReapproval = !empty($defenseRequest->previous_schedule_snapshot) && !empty($defenseRequest->previous_panels_snapshot);
            
            $scheduleChanged = false;
            $panelsChanged = false;
            
            if ($isReapproval) {
                $scheduleChanged = (
                    $defenseRequest->previous_schedule_snapshot['scheduled_date'] !== $defenseRequest->scheduled_date ||
                    $defenseRequest->previous_schedule_snapshot['scheduled_time'] !== $defenseRequest->scheduled_time ||
                    $defenseRequest->previous_schedule_snapshot['scheduled_end_time'] !== $defenseRequest->scheduled_end_time ||
                    $defenseRequest->previous_schedule_snapshot['defense_venue'] !== $defenseRequest->defense_venue
                );
                
                $panelsChanged = (
                    $defenseRequest->previous_panels_snapshot['defense_chairperson'] !== $defenseRequest->defense_chairperson ||
                    $defenseRequest->previous_panels_snapshot['defense_panelist1'] !== $defenseRequest->defense_panelist1 ||
                    $defenseRequest->previous_panels_snapshot['defense_panelist2'] !== $defenseRequest->defense_panelist2 ||
                    $defenseRequest->previous_panels_snapshot['defense_panelist3'] !== $defenseRequest->defense_panelist3 ||
                    $defenseRequest->previous_panels_snapshot['defense_panelist4'] !== $defenseRequest->defense_panelist4
                );
            }
            
            Log::info('Change detection', [
                'is_reapproval' => $isReapproval,
                'schedule_changed' => $scheduleChanged,
                'panels_changed' => $panelsChanged,
                'has_snapshots' => [
                    'schedule' => !empty($defenseRequest->previous_schedule_snapshot),
                    'panels' => !empty($defenseRequest->previous_panels_snapshot)
                ]
            ]);
            
            // Get all panel members by name (they're stored as names, not IDs)
            $panelMemberNames = array_filter([
                $defenseRequest->defense_chairperson,
                $defenseRequest->defense_panelist1,
                $defenseRequest->defense_panelist2,
                $defenseRequest->defense_panelist3,
                $defenseRequest->defense_panelist4,
            ]);
            
            Log::info('Panel names to lookup', ['names' => $panelMemberNames]);
            
            $panelMembers = [];
            foreach ($panelMemberNames as $panelMemberName) {
                Log::info('Looking up panel member', ['name' => $panelMemberName]);
                
                // First try to find in panelists table (for external panelists)
                $panelist = DB::table('panelists')
                    ->where('name', $panelMemberName)
                    ->first();
                
                if ($panelist && $panelist->email) {
                    Log::info('Panel member found in panelists table', [
                        'name' => $panelMemberName,
                        'panelist_id' => $panelist->id,
                        'email' => $panelist->email
                    ]);
                    // Create a simple object with email property for consistency
                    $panelMembers[] = (object)[
                        'id' => $panelist->id,
                        'email' => $panelist->email,
                        'first_name' => $panelMemberName, // Use full name as first_name for email template
                        'last_name' => '',
                        'role' => 'Panel'
                    ];
                    continue;
                }
                
                // If not found in panelists, try users table (for internal faculty)
                $panelUser = User::where(function ($q) use ($panelMemberName) {
                    $parts = preg_split('/\s+/', trim($panelMemberName));
                    if (count($parts) >= 2) {
                        $firstName = $parts[0];
                        $lastName = end($parts);
                        Log::info('Searching users by name parts', [
                            'first_name_search' => $firstName,
                            'last_name_search' => $lastName
                        ]);
                        $q->where('first_name', 'LIKE', '%' . $firstName . '%')
                          ->where('last_name', 'LIKE', '%' . $lastName . '%');
                    } else {
                        Log::info('Searching users by single name', ['name' => $panelMemberName]);
                        $q->where('first_name', 'LIKE', '%' . $panelMemberName . '%')
                          ->orWhere('last_name', 'LIKE', '%' . $panelMemberName . '%');
                    }
                })->first();
                
                if ($panelUser) {
                    Log::info('Panel member found in users table', [
                        'name' => $panelMemberName,
                        'user_id' => $panelUser->id,
                        'user_first_name' => $panelUser->first_name,
                        'user_last_name' => $panelUser->last_name,
                        'email' => $panelUser->email
                    ]);
                    $panelMembers[] = $panelUser;
                } else {
                    Log::warning('Panel member NOT found in either panelists or users table', ['name' => $panelMemberName]);
                }
            }

            // Send email to student
            if ($student && $student->email) {
                Log::info('Sending email to student', ['email' => $student->email]);
                
                // Pass changes only if this is a reapproval with actual changes
                $changes = null;
                if ($isReapproval && ($scheduleChanged || $panelsChanged)) {
                    $changes = ['schedule' => $scheduleChanged, 'panels' => $panelsChanged];
                }
                
                Mail::to($student->email)->send(new DefenseScheduled(
                    $defenseRequest,
                    $student,
                    $changes
                ));
                Log::info('Student email sent', ['changes' => $changes]);
                usleep(500000);
            } else {
                Log::warning('Student email skipped', [
                    'has_student' => !!$student,
                    'has_email' => $student?->email
                ]);
            }

            // Send email to adviser
            if ($adviser && $adviser->email) {
                Log::info('Sending email to adviser', ['email' => $adviser->email]);
                
                // Pass changes only if this is a reapproval with actual changes
                $changes = null;
                if ($isReapproval && ($scheduleChanged || $panelsChanged)) {
                    $changes = ['schedule' => $scheduleChanged, 'panels' => $panelsChanged];
                }
                
                Mail::to($adviser->email)->send(new DefenseScheduled(
                    $defenseRequest,
                    $adviser,
                    $changes
                ));
                Log::info('Adviser email sent', ['changes' => $changes]);
                usleep(500000);
            } else {
                Log::warning('Adviser email skipped', [
                    'has_adviser' => !!$adviser,
                    'has_email' => $adviser?->email
                ]);
            }

            // Send email to each panel member
            foreach ($panelMembers as $index => $member) {
                if ($member && $member->email) {
                    if ($index > 0) {
                        usleep(500000);
                    }
                    
                    // Pass changes only if this is a reapproval with actual changes
                    $changes = null;
                    if ($isReapproval && ($scheduleChanged || $panelsChanged)) {
                        $changes = ['schedule' => $scheduleChanged, 'panels' => $panelsChanged];
                    }
                    
                    Log::info('Sending email to panel member', [
                        'user_id' => $member->id,
                        'email' => $member->email,
                        'changes' => $changes
                    ]);
                    Mail::to($member->email)->send(new DefenseScheduled(
                        $defenseRequest,
                        $member,
                        $changes
                    ));
                    Log::info('Panel member email sent');
                } else {
                    Log::warning('Panel member email skipped', [
                        'has_member' => !!$member,
                        'has_email' => $member?->email
                    ]);
                }
            }

            Log::info('Approval notifications sent', [
                'defense_id' => $defenseRequest->id,
                'status' => $status,
                'recipients' => count($panelMembers) + 2, // student + adviser + panels
                'panel_count' => count($panelMembers)
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send approval notifications', [
                'defense_id' => $defenseRequest->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            // Don't throw - email failures shouldn't block the approval
        }
    }

    public function updatePriority(Request $request, DefenseRequest $defenseRequest)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['error'=>'Unauthorized'],401);
        $coordinatorRoles = ['Coordinator','Administrative Assistant','Dean'];
        if (!in_array($user->role,$coordinatorRoles)) {
            return response()->json(['error'=>'Forbidden'],403);
        }

        $data = $request->validate([
            'priority'=>'required|in:Low,Medium,High'
        ]);

        $defenseRequest->priority = $data['priority'];
        $defenseRequest->last_status_updated_at = now();
        $defenseRequest->last_status_updated_by = $user->id;
        $defenseRequest->save();

        return response()->json([
            'ok'=>true,
            'id'=>$defenseRequest->id,
            'priority'=>$defenseRequest->priority
        ]);
    }

    public function bulkUpdateStatus(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['error'=>'Unauthorized'],401);
        $coordinatorRoles = ['Coordinator','Administrative Assistant','Dean'];
        if (!in_array($user->role,$coordinatorRoles)) {
            return response()->json(['error'=>'Forbidden'],403);
        }

        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:defense_requests,id',
            'status' => 'required|in:Pending,Approved,Rejected,Completed' // <-- add Completed
        ]);

        $updated = [];
        DB::beginTransaction();
        try {
            foreach ($data['ids'] as $id) {
                $dr = DefenseRequest::lockForUpdate()->find($id);
                if (!$dr) continue;
                $fakeReq = new Request(['status'=>$data['status']]);
                $this->updateStatus($fakeReq, $dr);
                $updated[] = $id;
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('bulkUpdateStatus error',['error'=>$e->getMessage()]);
            return response()->json(['error'=>'Bulk status update failed'],500);
        }

        return response()->json([
            'ok'=>true,
            'updated_ids'=>$updated,
            'status'=>$data['status']
        ]);
    }

    public function bulkUpdatePriority(Request $request)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['error'=>'Unauthorized'],401);
        $coordinatorRoles = ['Coordinator','Administrative Assistant','Dean'];
        if (!in_array($user->role,$coordinatorRoles)) {
            return response()->json(['error'=>'Forbidden'],403);
        }

        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:defense_requests,id',
            'priority' => 'required|in:Low,Medium,High'
        ]);

        DB::beginTransaction();
        try {
            DefenseRequest::whereIn('id',$data['ids'])->update([
                'priority'=>$data['priority'],
                'last_status_updated_at'=>now(),
                'last_status_updated_by'=>$user->id
            ]);
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('bulkUpdatePriority error',['error'=>$e->getMessage()]);
            return response()->json(['error'=>'Bulk priority update failed'],500);
        }

        return response()->json([
            'ok'=>true,
            'priority'=>$data['priority'],
            'updated_ids'=>$data['ids']
        ]);
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
        try {
            \Log::info('updateAdviserStatus: START', [
                'defense_request_id' => $defenseRequest->id,
                'request_data' => $request->all()
            ]);
            
            $user = Auth::user();
            if (!$user || !in_array($user->role, ['Faculty', 'Adviser'])) {
                \Log::error('updateAdviserStatus: Unauthorized', [
                    'user_id' => $user->id ?? null,
                    'role' => $user->role ?? null
                ]);
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            \Log::info('updateAdviserStatus: Validating request');
            $data = $request->validate([
                'adviser_status' => 'required|in:Pending,Approved,Rejected',
                'coordinator_user_id' => 'nullable|integer|exists:users,id',
                'adviser_comments' => 'nullable|string|max:500',
            ]);
            
            \Log::info('updateAdviserStatus: Validation passed', ['data' => $data]);

        $fromState = $defenseRequest->workflow_state;
        $defenseRequest->adviser_status = $data['adviser_status'];
        
        // Store rejection reason if provided
        if (isset($data['adviser_comments'])) {
            $defenseRequest->adviser_comments = $data['adviser_comments'];
        }

        // Update workflow_state based on status
        if ($data['adviser_status'] === 'Approved') {
            $defenseRequest->workflow_state = 'adviser-approved';
            $defenseRequest->status = 'Pending';
            \Log::info('updateAdviserStatus: Setting status to Approved');
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
        $historyEntry = [
            'action' => 'adviser-status-updated',
            'adviser_status' => $data['adviser_status'],
            'timestamp' => now()->toISOString(),
            'user_id' => $user->id,
            'user_name' => $user->first_name . ' ' . $user->last_name,
            'from_state' => $fromState,
            'to_state' => $defenseRequest->workflow_state
        ];
        
        // Add rejection reason to workflow history if rejecting
        if ($data['adviser_status'] === 'Rejected' && isset($data['adviser_comments'])) {
            $historyEntry['comment'] = $data['adviser_comments'];
        }
        
        $hist[] = $historyEntry;
        $defenseRequest->workflow_history = $hist;

        // --- FIX: Use coordinator_user_id from request if present ---
        if ($data['adviser_status'] === 'Approved') {
            \Log::info('updateAdviserStatus: Processing approval');
            if (!empty($data['coordinator_user_id'])) {
                $defenseRequest->coordinator_user_id = $data['coordinator_user_id'];
                \Log::info('updateAdviserStatus: Using coordinator from request', [
                    'coordinator_id' => $data['coordinator_user_id']
                ]);
            } elseif (!$defenseRequest->coordinator_user_id) {
                \Log::info('updateAdviserStatus: Finding coordinator by program', [
                    'program' => $defenseRequest->program
                ]);
                // Fallback: Find the coordinator for this program/department
                $coordinator = User::where('role', 'Coordinator')
                    ->where('program', $defenseRequest->program)
                    ->first();

                if ($coordinator) {
                    $defenseRequest->coordinator_user_id = $coordinator->id;
                    \Log::info('updateAdviserStatus: Found coordinator', [
                        'coordinator_id' => $coordinator->id
                    ]);
                } else {
                    \Log::warning('updateAdviserStatus: No coordinator found for program', [
                        'program' => $defenseRequest->program
                    ]);
                }
            }
            
            \Log::info('updateAdviserStatus: Creating notifications', [
                'coordinator_id' => $defenseRequest->coordinator_user_id,
                'student_id' => $defenseRequest->user_id
            ]);
            
            // Create notification for coordinator when adviser endorses
            if ($defenseRequest->coordinator_user_id) {
                \Log::info('updateAdviserStatus: Creating coordinator notification');
                $coordinator = User::find($defenseRequest->coordinator_user_id);
                
                Notification::create([
                    'user_id' => $defenseRequest->coordinator_user_id,
                    'type' => 'defense_endorsed',
                    'title' => 'Defense Request Endorsed by Adviser',
                    'message' => "{$user->first_name} {$user->last_name} has endorsed the defense request for {$defenseRequest->first_name} {$defenseRequest->last_name} - \"{$defenseRequest->thesis_title}\".",
                    'action_url' => route('coordinator.defense-requests.details', $defenseRequest->id),
                ]);
                \Log::info('updateAdviserStatus: Coordinator notification created');
                
                // Send email to coordinator
                if ($coordinator && $coordinator->email) {
                    \Log::info('updateAdviserStatus: Sending email to coordinator', ['email' => $coordinator->email]);
                    Mail::to($coordinator->email)->send(new DefenseRequestAssignedToCoordinator($defenseRequest));
                    \Log::info('updateAdviserStatus: Coordinator email sent');
                }
            }
            
            // Also notify the student that their defense was endorsed
            if ($defenseRequest->user_id) {
                \Log::info('updateAdviserStatus: Creating student notification');
                Notification::create([
                    'user_id' => $defenseRequest->user_id,
                    'type' => 'defense_endorsed_by_adviser',
                    'title' => 'Defense Request Endorsed',
                    'message' => "Your adviser {$user->first_name} {$user->last_name} has endorsed your defense request. It will now be reviewed by the coordinator.",
                    'action_url' => route('dashboard'),
                ]);
                \Log::info('updateAdviserStatus: Student notification created');
            }
        } else {
            $defenseRequest->coordinator_user_id = null;
        }

        \Log::info('updateAdviserStatus: Saving defense request', [
            'id' => $defenseRequest->id,
            'adviser_status' => $defenseRequest->adviser_status,
            'workflow_state' => $defenseRequest->workflow_state,
            'coordinator_user_id' => $defenseRequest->coordinator_user_id
        ]);
        
        $defenseRequest->save();
        
        \Log::info('updateAdviserStatus: Defense request saved successfully');

        return response()->json([
            'ok' => true,
            'request' => $defenseRequest,
            'workflow_history' => $defenseRequest->workflow_history,
        ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('updateAdviserStatus validation failed', [
                'errors' => $e->errors()
            ]);
            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('updateAdviserStatus failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to update adviser status: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateCoordinatorStatus(Request $request, DefenseRequest $defenseRequest)
    {
        $user = Auth::user();
        if (!$user) abort(401);
        
        // Authorization: Only coordinators can update coordinator status
        if (!in_array($user->role, ['Coordinator', 'Administrative Assistant', 'Dean'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'coordinator_status' => 'required|in:Approved,Rejected,Pending',
            'coordinator_user_id' => 'nullable|integer|exists:users,id',
            'send_email' => 'nullable|boolean',
            'coordinator_comments' => 'nullable|string|max:500'
        ]);

        $previousStatus = $defenseRequest->coordinator_status;
        $sendEmail = $data['send_email'] ?? false;
        
        DB::beginTransaction();
        try {
            // Update coordinator status
            $defenseRequest->coordinator_status = $data['coordinator_status'];
            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = $user->id;
            
            // Store rejection reason if provided
            if (isset($data['coordinator_comments'])) {
                $defenseRequest->coordinator_comments = $data['coordinator_comments'];
            }
            
            // Update coordinator if provided
            if (isset($data['coordinator_user_id'])) {
                $defenseRequest->coordinator_user_id = $data['coordinator_user_id'];
            }

            // Update workflow state based on coordinator status
            if ($data['coordinator_status'] === 'Approved') {
                $defenseRequest->workflow_state = 'coordinator-approved';
            } elseif ($data['coordinator_status'] === 'Rejected') {
                $defenseRequest->workflow_state = 'coordinator-rejected';
            } else {
                $defenseRequest->workflow_state = 'coordinator-review';
            }

            $defenseRequest->save();

            // Log workflow history
            $history = $defenseRequest->workflow_history ?? [];
            $historyEntry = [
                'event_type' => 'coordinator-status-update',
                'from_state' => $previousStatus,
                'to_state' => $data['coordinator_status'],
                'created_at' => now()->toDateTimeString(),
                'user_name' => $user->first_name . ' ' . $user->last_name,
                'user_id' => $user->id,
                'description' => "Coordinator updated status to {$data['coordinator_status']}"
            ];
            
            // Add rejection reason to workflow history if rejecting
            if ($data['coordinator_status'] === 'Rejected' && isset($data['coordinator_comments'])) {
                $historyEntry['comment'] = $data['coordinator_comments'];
            }
            
            $history[] = $historyEntry;
            $defenseRequest->workflow_history = $history;
            $defenseRequest->save();

            DB::commit();

            // Send email notifications if requested (only for approve/reject)
            if ($sendEmail && ($data['coordinator_status'] === 'Approved' || $data['coordinator_status'] === 'Rejected')) {
                $this->sendApprovalNotifications($defenseRequest, $data['coordinator_status']);
            }

            return response()->json([
                'ok' => true,
                'message' => 'Coordinator status updated successfully',
                'request' => $defenseRequest->fresh()
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Failed to update coordinator status', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to update coordinator status'], 500);
        }
    }

    public function allForCoordinator(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Coordinator','Administrative Assistant','Dean'])) {
            abort(403);
        }

        $query = DefenseRequest::query();

        // Only show requests assigned to this coordinator (for all coordinator roles)
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

        if ($user->role === 'Administrative Assistant') {
            $query->where('coordinator_status', 'Approved');
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
            ->orderByDesc('created_at')
            ->limit(500)
            ->with('aaVerification') // Load AA verification relationship
            ->get([
                'id','first_name','middle_name','last_name','school_id','program',
                'thesis_title','defense_type','status','priority','workflow_state',
                'scheduled_date','defense_mode','defense_venue','panels_assigned_at',
                'defense_adviser','submitted_at',
                'coordinator_status',
                'amount',           // <-- must be present
                'reference_no',     // <-- must be present
                'coordinator_user_id', // <-- must be present
            ])
            ->map(function($r){
                // Get program level
                $programLevel = \App\Helpers\ProgramLevel::getLevel($r->program);

                // Sum all rates for this program level and defense type
                $expectedTotal = \App\Models\PaymentRate::where('program_level', $programLevel)
                    ->where('defense_type', $r->defense_type)
                    ->sum('amount');

                // Get coordinator name
                $coordinator = null;
                if ($r->coordinator_user_id) {
                    $coordUser = \App\Models\User::find($r->coordinator_user_id);
                    if ($coordUser) {
                        $coordinator = trim($coordUser->first_name . ' ' . ($coordUser->middle_name ? strtoupper($coordUser->middle_name[0]) . '. ' : '') . $coordUser->last_name);
                    }
                }

                // Get AA verification status
                $aaStatus = optional($r->aaVerification)->status ?? null;

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
                    'aa_status' => $aaStatus,
                    // --- ADD THESE FIELDS ---
                    'expected_rate' => $expectedTotal,
                    'amount' => $r->amount,
                    'reference_no' => $r->reference_no,
                    'coordinator' => $coordinator,
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

    public function saveSchedule(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Coordinator','Administrative Assistant','Dean'])) {
            return response()->json(['error'=>'Unauthorized'],403);
        }

        $defenseRequest = DefenseRequest::findOrFail($id);

        $data = $request->validate([
            'scheduled_date' => 'nullable|date',
            'scheduled_time' => 'nullable|string|max:50',
            'scheduled_end_time' => 'nullable|string|max:50',
            'defense_mode' => 'nullable|string|max:100',
            'defense_venue' => 'nullable|string|max:255',
            'scheduling_notes' => 'nullable|string|max:3000',
        ]);

        $originalState = $defenseRequest->workflow_state;

        // Save schedule information
        $defenseRequest->scheduled_date = $data['scheduled_date'] ?? null;
        $defenseRequest->scheduled_time = $data['scheduled_time'] ?? null;
        $defenseRequest->scheduled_end_time = $data['scheduled_end_time'] ?? null;
        $defenseRequest->defense_mode = $data['defense_mode'] ?? null;
        $defenseRequest->defense_venue = $data['defense_venue'] ?? null;
        $defenseRequest->scheduling_notes = $data['scheduling_notes'] ?? null;

        // Update workflow state to scheduled
        $defenseRequest->workflow_state = 'scheduled';

        // Add workflow history entry
        $hist = $defenseRequest->workflow_history ?? [];
        $hist[] = [
            'action' => 'Defense Scheduled',
            'timestamp' => now()->toISOString(),
            'user_id' => $user->id,
            'user_name' => $user->first_name . ' ' . $user->last_name,
            'from_state' => $originalState,
            'to_state' => 'scheduled',
            'details' => 'Defense scheduled for ' . ($data['scheduled_date'] ?? 'TBD')
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

        $defenseRequest = \App\Models\DefenseRequest::with(['coordinator', 'aaVerification'])->findOrFail($id);

        // Use the helper to get the program level
        $programLevel = \App\Helpers\ProgramLevel::getLevel($defenseRequest->program);

        // Fetch the expected rate for this program level and defense type
        $expectedRate = \App\Models\PaymentRate::where('program_level', $programLevel)
            ->where('defense_type', $defenseRequest->defense_type)
            ->where('type', 'School Share') // or your desired type
            ->first();

        // Compose the full data structure, similar to your current route
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
                    if ($p)
                        return ['id' => $p->id, 'name' => $p->name];
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
                'program_level' => $programLevel, // ✅ ADD THIS
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
                'submitted_at' => $defenseRequest->adviser_reviewed_at
                    ? (is_object($defenseRequest->adviser_reviewed_at)
                        ? $defenseRequest->adviser_reviewed_at->format('Y-m-d H:i:s')
                        : date('Y-m-d H:i:s', strtotime($defenseRequest->adviser_reviewed_at)))
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
                'expected_rate' => $expectedRate ? $expectedRate->amount : null,
                // ✅ ADD COORDINATOR DATA
                'coordinator' => $defenseRequest->coordinator ? [
                    'id' => $defenseRequest->coordinator->id,
                    'name' => $defenseRequest->coordinator->name,
                    'email' => $defenseRequest->coordinator->email,
                ] : null,
                // ✅ ADD AA VERIFICATION STATUS
                'aa_verification_status' => optional($defenseRequest->aaVerification)->status ?? 'pending',
                'aa_verification_id' => optional($defenseRequest->aaVerification)->id,
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
                'last_status_updated_at' => $defenseRequest->last_status_updated_at,
                'workflow_history' => $defenseRequest->workflow_history ?? [],
                'adviser_status' => $defenseRequest->adviser_status ?? null,
                'coordinator_status' => $defenseRequest->coordinator_status ?? null,
            ],
        ]);
    }

    /**
     * Add coordinator signature to existing endorsement form
     */
    public function addCoordinatorSignature(Request $request, DefenseRequest $defenseRequest)
    {
        \Log::info('DefenseRequestController@addCoordinatorSignature called', [
            'request_id' => $defenseRequest->id,
            'coordinator_user_id' => $request->user()->id
        ]);

        // Verify coordinator role
        if (!in_array($request->user()->role, ['Coordinator', 'Administrative Assistant', 'Dean'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Verify endorsement form exists
        if (!$defenseRequest->endorsement_form) {
            return response()->json([
                'error' => 'No endorsement form found. The adviser must submit the endorsement first.'
            ], 400);
        }

        try {
            $overlayService = new \App\Services\PdfSignatureOverlay();
            
            // Try to get signature position from template if available
            $templateId = null;
            $generatedDoc = $defenseRequest->generatedDocuments()->latest()->first();
            if ($generatedDoc) {
                $templateId = $generatedDoc->document_template_id;
            }
            
            $signaturePosition = null;
            if ($templateId) {
                $signaturePosition = $overlayService->getCoordinatorSignaturePosition($templateId);
            }

            // Clean the endorsement_form path (remove /storage/ prefix if present)
            $endorsementPath = $defenseRequest->endorsement_form;
            if (strpos($endorsementPath, '/storage/') === 0) {
                $endorsementPath = substr($endorsementPath, 9); // Remove '/storage/'
            }
            
            // Add coordinator signature to existing PDF
            $newPdfPath = $overlayService->addCoordinatorSignature(
                $endorsementPath,
                $request->user()->id,
                $signaturePosition
            );

            // Delete old endorsement form
            Storage::disk('public')->delete($endorsementPath);

            // Update endorsement_form path (store WITHOUT /storage/ prefix for consistency)
            $defenseRequest->endorsement_form = $newPdfPath;
            $defenseRequest->save();

            \Log::info('Coordinator signature added successfully', [
                'new_path' => $newPdfPath,
                'stored_path' => $defenseRequest->endorsement_form
            ]);

            return response()->json([
                'ok' => true,
                'message' => 'Coordinator signature added successfully',
                'endorsement_form' => $defenseRequest->endorsement_form
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to add coordinator signature', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to add coordinator signature: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Mark defense as completed
     * Updates defense status to 'Completed' and AA verification status to 'completed'
     */
    public function completeDefense(DefenseRequest $defenseRequest)
    {
        try {
            // Update defense request status
            $defenseRequest->status = 'Completed';
            $defenseRequest->workflow_state = 'completed';
            $defenseRequest->save();
            
            // Get or create AA verification record
            $verification = \App\Models\AaPaymentVerification::firstOrCreate(
                ['defense_request_id' => $defenseRequest->id],
                [
                    'assigned_to' => Auth::id(),
                    'status' => 'pending',
                ]
            );
            
            // Update AA verification to completed
            $verification->status = 'completed';
            $verification->assigned_to = Auth::id();
            $verification->save();
            
            \Log::info('✅ Defense marked as completed', [
                'defense_request_id' => $defenseRequest->id,
                'aa_verification_id' => $verification->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Defense marked as completed',
                'aa_verification_id' => $verification->id,
                'aa_verification_status' => 'completed'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('❌ Failed to mark defense as completed', [
                'defense_request_id' => $defenseRequest->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to mark as completed: ' . $e->getMessage()
            ], 500);
        }
    }
}
