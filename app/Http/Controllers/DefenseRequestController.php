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
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\App; // add if you use App::getLocale() or similar

class DefenseRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) abort(401);

        $coordinatorRoles = ['Coordinator','Administrative Assistant','Dean'];
        if (in_array($user->role,$coordinatorRoles)) {
            $visibleStates = [
                'adviser-approved','coordinator-review','coordinator-approved',
                'panels-assigned','scheduled','completed','adviser-rejected','coordinator-rejected'
            ];

            $requests = DefenseRequest::with([
                'user','adviserUser','panelsAssignedBy','scheduleSetBy','lastStatusUpdater'
            ])
            ->whereIn('workflow_state',$visibleStates)
            ->orderBy('adviser_reviewed_at','desc')
            ->orderBy('created_at','desc')
            ->get()
            ->map(function($r){
                $status = $this->normalizeStatusForCoordinator($r);
                $lastUpdated = $r->last_status_updated_at instanceof Carbon
                    ? $r->last_status_updated_at->format('Y-m-d H:i:s')
                    : ($r->last_status_updated_at ?? '');
                $scheduledDate = $r->scheduled_date instanceof Carbon
                    ? $r->scheduled_date->format('Y-m-d')
                    : '';
                return [
                    'id' => $r->id,
                    'first_name' => $r->first_name,
                    'middle_name' => $r->middle_name,
                    'last_name' => $r->last_name,
                    'program' => $r->program,
                    'thesis_title' => $r->thesis_title,
                    'date_of_defense' => $scheduledDate,
                    'mode_defense' => $r->defense_mode ?? '',
                    'defense_type' => $r->defense_type,
                    'status' => $status,
                    'workflow_state' => $r->workflow_state,
                    'priority' => $r->priority ?? 'Medium',
                    'last_status_updated_by' => $r->lastStatusUpdater?->name,
                    'last_status_updated_at' => $lastUpdated,
                ];
            });

            return Inertia::render('coordinator/submissions/defense-request/Index', [
                'defenseRequests' => $requests->values(),
                'auth' => [
                    'user' => [
                        'role' => $user->role,
                        'school_id' => $user->school_id,
                    ]
                ]
            ]);
        }

        if ($user->role === 'Student') {
            $latest = DefenseRequest::with('lastStatusUpdater')
                ->where('submitted_by',$user->id)
                ->latest()->first();
            if ($latest) {
                $latest->last_status_updated_by = $latest->lastStatusUpdater?->name;
            }
            return Inertia::render('student/submissions/defense-requirements/Index', [
                'defenseRequest' => $latest
            ]);
        }

        if (in_array($user->role,['Faculty','Adviser'])) {
            $assigned = DefenseRequest::with(['adviserUser','assignedTo','lastStatusUpdater'])
                ->forAdviser($user)
                ->orderByDesc('created_at')
                ->get()
                ->each->ensureSubmittedHistory();

            return Inertia::render('adviser/defense-requirements/show-all-defense-requirements', [
                'defenseRequirements' => $assigned
            ]);
        }

        return redirect()->route('dashboard');
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

            // Adviser auto-map
            $adviserUser = User::where('role','Faculty')
                ->whereRaw('LOWER(CONCAT(first_name," ",last_name)) = ?', [strtolower($defenseRequest->defense_adviser)])
                ->first();
            if ($adviserUser) {
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
                // keep status as 'Pending' (so coordinator still sees it in review list)
                $defenseRequest->status = 'Pending';
                // clear prior adviser rejection comment if re‑approved
                $defenseRequest->adviser_comments = null;
            } else {
                $defenseRequest->workflow_state = 'adviser-rejected';
                // DO NOT set status = 'Rejected' -> prevents leaking to coordinator rejected tab
                // Leave status as current (typically 'Pending')
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

            // Normalize workflow_history
            $hist = is_array($defenseRequest->workflow_history) ? $defenseRequest->workflow_history : [];
            foreach ($hist as &$h) {
                $h['comment']   = $h['comment']   ?? null;
                $h['user_name'] = $h['user_name'] ?? '';
            }
            $defenseRequest->workflow_history = $hist;

            $defenseRequest->save();

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
            \Log::error('adviserDecision error',[

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

            // Normalize history
            $hist = is_array($defenseRequest->workflow_history) ? $defenseRequest->workflow_history : [];
            foreach ($hist as &$h) {
                $h['comment']   = $h['comment']   ?? null;
                $h['user_name'] = $h['user_name'] ?? '';
            }
            $defenseRequest->workflow_history = $hist;

            $defenseRequest->save();

            return response()->json([
                'ok'=>true,
                'workflow_state'=>$defenseRequest->workflow_state,
                'status'=>$defenseRequest->status,
                'coordinator_comments'=>$defenseRequest->coordinator_comments,
                'adviser_comments'=>$defenseRequest->adviser_comments,
                'workflow_history'=>$defenseRequest->workflow_history
            ]);
        } catch (\Throwable $e) {
            \Log::error('coordinatorDecision error',[
                'id'=>$defenseRequest->id,
                'error'=>$e->getMessage()
            ]);
            return response()->json(['error'=>app()->environment('local')?$e->getMessage():'Internal error'],500);
        }
    }

    /** Lightweight API for polling (student/adviser dashboards) */
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
                // Promote to coordinator-approved if not already in a final/advanced state
                if (!in_array($defenseRequest->workflow_state, [
                    'coordinator-approved','panels-assigned','scheduled','completed'
                ])) {
                    // Must come from adviser-approved or coordinator-review
                    if (!in_array($defenseRequest->workflow_state, ['adviser-approved','coordinator-review'])) {
                        return response()->json([
                            'error'=>"Cannot approve from state '{$defenseRequest->workflow_state}'"
                        ],422);
                    }
                    $defenseRequest->approveByCoordinator(null,$user->id); // sets status + history
                } else {
                    // Already approved-type state; just normalize status
                    $defenseRequest->status = 'Approved';
                    $defenseRequest->last_status_updated_at = now();
                    $defenseRequest->last_status_updated_by = $user->id;
                    $defenseRequest->save();
                }
            } elseif ($target === 'Rejected') {
                // Only allow rejection if not already finalized
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
                // "Retrieve" from coordinator-rejected back to adviser-approved (so coordinator can act again)
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
            \Log::error('updateStatus error',[
                'id'=>$defenseRequest->id,
                'error'=>$e->getMessage()
            ]);
            return response()->json(['error'=>'Update failed'],500);
        }
    }

    /** Update single priority */
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

    /** Bulk status */
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

                // Reuse logic by cloning request object for single update
                $fakeReq = new Request(['status'=>$data['status']]);
                $this->updateStatus($fakeReq, $dr);
                $updated[] = $id;
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('bulkUpdateStatus error',['error'=>$e->getMessage()]);
            return response()->json(['error'=>'Bulk status update failed'],500);
        }

        return response()->json([
            'ok'=>true,
            'updated_ids'=>$updated,
            'status'=>$data['status']
        ]);
    }

    /** Bulk priority */
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
            \Log::error('bulkUpdatePriority error',['error'=>$e->getMessage()]);
            return response()->json(['error'=>'Bulk priority update failed'],500);
        }

        return response()->json([
            'ok'=>true,
            'priority'=>$data['priority'],
            'updated_ids'=>$data['ids']
        ]);
    }

    /* === Status mapping helper === */
    private function normalizeStatusForCoordinator(DefenseRequest $r): string
    {
        $wf = $r->workflow_state;
        return match($wf) {
            'adviser-rejected','coordinator-rejected' => 'Rejected',
            'coordinator-approved','scheduled','completed' => 'Approved',
            default => 'Pending',
        };
    }
}
