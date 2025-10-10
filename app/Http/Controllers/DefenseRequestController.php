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
use App\Mail\DefenseScheduled;
use App\Mail\DefenseRequestAssignedToCoordinator;

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
            // Coordinator view: show only requests assigned to this coordinator
            $query = DefenseRequest::query()
                ->where('coordinator_user_id', $user->id)  // Filter by assigned coordinator
                ->whereIn('workflow_state', [
                    'adviser-approved',
                    'coordinator-review',
                    'coordinator-approved',
                    'coordinator-rejected',
                    'panels-assigned',
                    'scheduled',
                    'completed'
                ]);

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
                    'defense_adviser','adviser_reviewed_at' // <-- ADD THESE
                ])->map(function($r){
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
                        'panelists' => collect([
                            $r->defense_chairperson ?? null,
                            $r->defense_panelist1 ?? null,
                            $r->defense_panelist2 ?? null,
                            $r->defense_panelist3 ?? null,
                            $r->defense_panelist4 ?? null,
                        ])->filter()->values()->all(),
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
            ->orderByDesc('created_at')
            ->get();

        foreach ($requirements as $r) {
            try { $r->attemptAutoComplete(); } catch (\Throwable $e) {}
        }

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
        ]);

        Log::info('=== DEFENSE REQUEST SUBMISSION STARTED ===', [
            'student' => $data['firstName'] . ' ' . $data['lastName'],
            'adviser_name' => $data['defenseAdviser'],
            'thesis_title' => $data['thesisTitle'],
            'timestamp' => now()
        ]);

        foreach (['advisersEndorsement','recEndorsement','proofOfPayment'] as $f) {
            if ($request->hasFile($f)) {
                $data[$f] = $request->file($f)->store('defense-attachments');
            }
        }

        try {
            DB::beginTransaction();
            
            // Find adviser FIRST using flexible name matching
            Log::info('Defense Request: Looking for adviser', [
                'adviser_name' => $data['defenseAdviser'],
                'student' => $data['firstName'] . ' ' . $data['lastName']
            ]);
            
            $adviserUser = User::findByFullName($data['defenseAdviser'], 'Faculty')->first();
            
            if (!$adviserUser) {
                Log::error('Defense Request: Adviser not found', [
                    'adviser_name_searched' => $data['defenseAdviser'],
                    'available_faculty' => User::where('role', 'Faculty')
                        ->get(['id', 'first_name', 'middle_name', 'last_name', 'email'])
                        ->map(fn($u) => $u->full_name)
                        ->toArray()
                ]);
            }
            
            // Create defense request WITH adviser already set
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
                'adviser_user_id' => $adviserUser?->id,  // Set adviser immediately
                'assigned_to_user_id' => $adviserUser?->id,  // Set assignment immediately
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

            Log::info('Defense Request: Created with adviser', [
                'defense_request_id' => $defenseRequest->id,
                'adviser_id' => $defenseRequest->adviser_user_id,
                'adviser_name' => $adviserUser?->full_name ?? 'Not found'
            ]);
            
            if ($adviserUser) {
                Log::info('Defense Request: Adviser found and assigned', [
                    'adviser_id' => $adviserUser->id,
                    'adviser_name' => $adviserUser->full_name,
                    'adviser_email' => $adviserUser->email
                ]);
                
                // Create notification for adviser
                Notification::create([
                    'user_id'=>$adviserUser->id,
                    'type'=>'defense-request',
                    'title'=>'New Defense Request',
                    'message'=>"Review needed for {$defenseRequest->defense_type} request ({$defenseRequest->thesis_title}).",
                    'link'=>url("/defense-request/{$defenseRequest->id}")
                ]);
                
                Log::info('=== ABOUT TO SEND EMAIL ===', [
                    'adviser_email' => $adviserUser->email,
                    'has_email' => !empty($adviserUser->email),
                    'defense_request_id' => $defenseRequest->id
                ]);
                
                // Send email notification to adviser
                if ($adviserUser->email) {
                    try {
                        Mail::to($adviserUser->email)
                            ->queue(new DefenseRequestSubmitted($defenseRequest, $adviserUser));
                        
                        Log::info('Defense Request: Email queued successfully', [
                            'defense_request_id' => $defenseRequest->id,
                            'adviser_email' => $adviserUser->email,
                            'email_type' => 'DefenseRequestSubmitted'
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Defense Request: Failed to queue email', [
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
            }

            DB::commit();
            
            // Reload with relationships to ensure fresh data
            $defenseRequest->refresh();
            $defenseRequest->load('adviserUser');
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'id' => $defenseRequest->id,
                    'workflow_state' => $defenseRequest->workflow_state,
                    'adviser_user_id' => $defenseRequest->adviser_user_id,
                    'adviser' => $defenseRequest->adviserUser ? [
                        'id' => $defenseRequest->adviserUser->id,
                        'name' => trim($defenseRequest->adviserUser->first_name . ' ' . $defenseRequest->adviserUser->last_name),
                        'email' => $defenseRequest->adviserUser->email,
                    ] : null,
                    'message' => 'Defense request submitted successfully'
                ], 201);
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
        if (!in_array($user->role,['Faculty','Adviser'])) {
            return response()->json(['error'=>'Unauthorized'],403);
        }

        $data = $request->validate([
            'decision' => 'required|in:approve,reject',
            'comment'  => 'nullable|string|max:2000'
        ]);
        $comment = $data['comment'] ?? null;

        $current = $defenseRequest->workflow_state ?: 'submitted';
        if (!in_array($current,['submitted','adviser-review','adviser-rejected'])) {
            return response()->json([
                'error'=>"Cannot act in state '{$defenseRequest->workflow_state}'"
            ],422);
        }

        try {
            $defenseRequest->ensureSubmittedHistory();
            $fromState = $current;

            if ($data['decision']==='approve') {
                $defenseRequest->workflow_state = 'adviser-approved';
                $defenseRequest->status = 'Pending';
                $defenseRequest->adviser_comments = null;
            } else {
                $defenseRequest->workflow_state = 'adviser-rejected';
                $defenseRequest->adviser_comments = $comment;
            }

            $defenseRequest->adviser_reviewed_at = now();
            $defenseRequest->adviser_reviewed_by = $user->id;
            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = $user->id;

            $defenseRequest->addWorkflowEntry(
                $defenseRequest->workflow_state,
                $comment,
                $user->id,
                $fromState,
                $defenseRequest->workflow_state
            );

            $hist = is_array($defenseRequest->workflow_history) ? $defenseRequest->workflow_history : [];
            foreach ($hist as &$h) {
                $h['comment']   = $h['comment']   ?? null;
                $h['user_name'] = $h['user_name'] ?? '';
            }
            $defenseRequest->workflow_history = $hist;

            $defenseRequest->save();

            // AUTO-ASSIGN COORDINATOR when adviser approves
            if ($data['decision'] === 'approve') {
                Log::info('Adviser approved - attempting coordinator auto-assignment', [
                    'defense_request_id' => $defenseRequest->id,
                    'program' => $defenseRequest->program,
                    'student_id' => $defenseRequest->submitted_by,
                ]);

                $defenseRequest->assignCoordinator(
                    $defenseRequest->program,
                    $user->id,  // adviser is the one triggering the assignment
                    false,      // not manual, it's auto-assignment
                    'Auto-assigned when adviser approved the request'
                );

                // Send email notification to assigned coordinator
                if ($defenseRequest->coordinatorUser && $defenseRequest->coordinatorUser->email) {
                    Log::info('Sending email to assigned coordinator', [
                        'defense_request_id' => $defenseRequest->id,
                        'coordinator_id' => $defenseRequest->coordinator_user_id,
                        'coordinator_email' => $defenseRequest->coordinatorUser->email,
                    ]);

                    Mail::to($defenseRequest->coordinatorUser->email)
                        ->queue(new DefenseRequestAssignedToCoordinator($defenseRequest));
                } else {
                    Log::warning('Coordinator assigned but no email to send notification', [
                        'defense_request_id' => $defenseRequest->id,
                        'coordinator_user_id' => $defenseRequest->coordinator_user_id,
                    ]);
                }
            }

            // Only dispatch when it just became Approved
            if ($defenseRequest->status === 'Approved') {
                // Queue job AFTER transaction commits
                GenerateDefenseDocumentsJob::dispatch($defenseRequest->id)->afterCommit();
            }
            
            // Send email notification to student
            $student = User::find($defenseRequest->submitted_by);
            if ($student && $student->email) {
                if ($data['decision'] === 'approve') {
                    Mail::to($student->email)
                        ->queue(new DefenseRequestApproved(
                            $defenseRequest,
                            $student,
                            'adviser',
                            $comment
                        ));
                } else {
                    Mail::to($student->email)
                        ->queue(new DefenseRequestRejected(
                            $defenseRequest,
                            $student,
                            'adviser',
                            $comment
                        ));
                }
            }

            return response()->json([
                'ok'=>true,
                'request'=>[
                    'id'=>$defenseRequest->id,
                    'workflow_state'=>$defenseRequest->workflow_state,
                    'status'=>$defenseRequest->status,
                    'adviser_comments'=>$defenseRequest->adviser_comments,
                    'coordinator_comments'=>$defenseRequest->coordinator_comments,
                ],
                'workflow_history'=>$defenseRequest->workflow_history
            ]);
        } catch (\Throwable $e) {
            Log::error('adviserDecision error',[
                'id'=>$defenseRequest->id,
                'error'=>$e->getMessage()
            ]);
            return response()->json([
                'error'=>app()->environment('local') ? $e->getMessage() : 'Internal error'
            ],500);
        }
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

        $defenseRequest->attemptAutoComplete();

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
        ]);
    }

    public function updateStatus(Request $request, DefenseRequest $defenseRequest)
    {
        $user = Auth::user();
        if (!$user) return response()->json(['error'=>'Unauthorized'],401);

        $coordinatorRoles = ['Coordinator','Administrative Assistant','Dean'];
        if (!in_array($user->role,$coordinatorRoles)) {
            return response()->json(['error'=>'Forbidden'],403);
        }

        $data = $request->validate([
            'status' => 'required|in:Pending,Approved,Rejected'
        ]);

        $target = $data['status'];
        $originalState = $defenseRequest->workflow_state;

        try {
            if ($target === 'Approved') {
                if (!in_array($defenseRequest->workflow_state, [
                    'coordinator-approved','panels-assigned','scheduled','completed'
                ])) {
                    if (!in_array($defenseRequest->workflow_state, ['adviser-approved','coordinator-review'])) {
                        return response()->json([
                            'error'=>"Cannot approve from state '{$defenseRequest->workflow_state}'"
                        ],422);
                    }
                    $defenseRequest->approveByCoordinator(null, $user->id);
                } else {
                    $defenseRequest->status = 'Approved';
                    $defenseRequest->last_status_updated_at = now();
                    $defenseRequest->last_status_updated_by = $user->id;
                    $defenseRequest->save();
                }
            } elseif ($target === 'Rejected') {
                if (in_array($defenseRequest->workflow_state,['scheduled','completed'])) {
                    return response()->json(['error'=>'Cannot reject a scheduled/completed defense'],422);
                }

                $defenseRequest->ensureSubmittedHistory();
                $hist = $defenseRequest->workflow_history ?? [];

                $defenseRequest->status = 'Rejected';
                $defenseRequest->workflow_state = 'coordinator-rejected';
                $defenseRequest->coordinator_reviewed_at = now();
                $defenseRequest->coordinator_reviewed_by = $user->id;
                $defenseRequest->last_status_updated_at = now();
                $defenseRequest->last_status_updated_by = $user->id;

                $hist[] = [
                    'action'=>'coordinator-rejected',
                    'timestamp'=>now()->toISOString(),
                    'user_id'=>$user->id,
                    'user_name'=>$user->first_name.' '.$user->last_name,
                    'comment'=>null,
                    'from_state'=>$originalState,
                    'to_state'=>'coordinator-rejected'
                ];
                $defenseRequest->workflow_history = $hist;
                $defenseRequest->save();
            } else { // Pending
                if ($defenseRequest->workflow_state === 'coordinator-rejected') {
                    $defenseRequest->workflow_state = 'adviser-approved';
                    $defenseRequest->status = 'Pending';
                    $hist = $defenseRequest->workflow_history ?? [];
                    $hist[] = [
                        'action'=>'retrieved',
                        'timestamp'=>now()->toISOString(),
                        'user_id'=>$user->id,
                        'user_name'=>$user->first_name.' '.$user->last_name,
                        'from_state'=>'coordinator-rejected',
                        'to_state'=>'adviser-approved'
                    ];
                    $defenseRequest->workflow_history = $hist;
                } else {
                    $defenseRequest->status = 'Pending';
                }
                $defenseRequest->last_status_updated_at = now();
                $defenseRequest->last_status_updated_by = $user->id;
                $defenseRequest->save();
            }

            return response()->json([
                'ok'=>true,
                'id'=>$defenseRequest->id,
                'status'=>$defenseRequest->status,
                'workflow_state'=>$defenseRequest->workflow_state
            ]);
        } catch (\Throwable $e) {
            Log::error('updateStatus error',[
                'id'=>$defenseRequest->id,
                'error'=>$e->getMessage()
            ]);
            return response()->json(['error'=>'Update failed'],500);
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
            'status' => 'required|in:Pending,Approved,Rejected'
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
}
