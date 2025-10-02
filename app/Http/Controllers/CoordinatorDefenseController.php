<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Models\Panelist;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Services\DefenseConflictService;
use App\Services\DefenseNotificationService;

class CoordinatorDefenseController extends Controller
{
    private array $roles = ['Coordinator','Administrative Assistant','Dean'];

    private function authorizeRole(): void
    {
        $u = Auth::user();
        if (!$u || !in_array($u->role, $this->roles)) {
            abort(403);
        }
    }

    /**
     * Dashboard
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $coordinatorRoles = ['Coordinator', 'Administrative Assistant', 'Dean'];
        if (!in_array($user->role, $coordinatorRoles)) {
            abort(403, 'Unauthorized access to coordinator dashboard');
        }

        $defenseRequests = DefenseRequest::with(['user','adviserUser','panelsAssignedBy','scheduleSetBy'])
            ->whereIn('workflow_state', ['adviser-approved','coordinator-review','coordinator-approved','panels-assigned','scheduled'])
            ->orderBy('adviser_reviewed_at','desc')
            ->orderBy('created_at','desc')
            ->get()
//            ->each(fn($r)=>$r->ensureStatusWorkflowSync(true))   // REMOVE: was promoting states too early
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'student_name' => $r->first_name.' '.$r->last_name,
                    'school_id' => $r->school_id,
                    'program' => $r->program,
                    'thesis_title' => $r->thesis_title,
                    'defense_type' => $r->defense_type,
                    'adviser' => $r->defense_adviser,
                    'workflow_state' => $r->workflow_state,
                    'workflow_state_display' => $r->workflow_state_display,
                    'scheduling_status' => $r->scheduling_status,
                    'formatted_schedule' => $r->formatted_schedule,
                    'panels_list' => $r->panels_list,
                    'defense_chairperson' => $r->defense_chairperson,
                    'defense_panelist1' => $r->defense_panelist1,
                    'defense_panelist2' => $r->defense_panelist2,
                    'defense_panelist3' => $r->defense_panelist3,
                    'defense_panelist4' => $r->defense_panelist4,
                    'scheduled_date' => $r->scheduled_date?->format('Y-m-d'),
                    'scheduled_time' => $r->scheduled_time?->format('H:i'),
                    'scheduled_end_time' => $r->scheduled_end_time?->format('H:i'),
                    'defense_duration_minutes' => $r->defense_duration_minutes,
                    'formatted_time_range' => $r->formatted_time_range,
                    'defense_mode' => $r->defense_mode,
                    'defense_venue' => $r->defense_venue,
                    'scheduling_notes' => $r->scheduling_notes,
                    'panels_assigned_at' => $r->panels_assigned_at?->format('M d, Y g:i A'),
                    'schedule_set_at' => $r->schedule_set_at?->format('M d, Y g:i A'),
                    'adviser_notified_at' => $r->adviser_notified_at?->format('M d, Y g:i A'),
                    'student_notified_at' => $r->student_notified_at?->format('M d, Y g:i A'),
                    'panels_notified_at' => $r->panels_notified_at?->format('M d, Y g:i A'),
                    'submitted_at' => $r->submitted_at?->format('M d, Y g:i A'),
                    'adviser_reviewed_at' => $r->adviser_reviewed_at?->format('M d, Y g:i A'),
                ];
            });

        $facultyMembers = User::where('role','Faculty')
            ->select('id','first_name','last_name','email')
            ->orderBy('last_name')
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'name' => $f->first_name.' '.$f->last_name,
                'email' => $f->email ?? '',
                'type' => 'faculty'
            ]);

        $panelists = Panelist::where('status','Available')
            ->select('id','name','email','status')
            ->orderBy('name')
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'email' => $p->email,
                'type' => 'panelist'
            ]);

        $availablePanelMembers = $facultyMembers->concat($panelists)->values();

        $stats = [
            'pending_panels' => DefenseRequest::where('scheduling_status','pending-panels')
                ->whereIn('workflow_state',['adviser-approved','coordinator-review','coordinator-approved'])
                ->count(),
            'panels_assigned' => DefenseRequest::where('scheduling_status','panels-assigned')->count(),
            'scheduled' => DefenseRequest::where('scheduling_status','scheduled')->count(),
            'completed' => DefenseRequest::where('scheduling_status','completed')->count(),
        ];

        return Inertia::render('coordinator/defense-management/CoordinatorDefenseDashboard', [
            'defenseRequests' => $defenseRequests,
            'facultyMembers' => $facultyMembers,
            'panelists' => $panelists,
            'availablePanelMembers' => $availablePanelMembers,
            'stats' => $stats,
            'user' => $user,
        ]);
    }

    public function assignPanels(Request $request, DefenseRequest $defenseRequest)
    {
        $this->authorizeRole();

        $validated = $request->validate([
            'defense_chairperson' => 'required|string|max:255',
            'defense_panelist1'   => 'required|string|max:255',
            'defense_panelist2'   => 'nullable|string|max:255',
            'defense_panelist3'   => 'nullable|string|max:255',
            'defense_panelist4'   => 'nullable|string|max:255',
        ]);

        // Only allow from adviser-approved / coordinator-approved / panels-assigned
        if (!in_array($defenseRequest->workflow_state, [
            'adviser-approved','coordinator-approved','panels-assigned'
        ])) {
            $msg = "Cannot assign panels from state '{$defenseRequest->workflow_state}'";
            if ($request->expectsJson()) {
                return response()->json(['error'=>$msg],422);
            }
            return back()->withErrors(['error'=>$msg]);
        }

        try {
            DB::transaction(function () use ($defenseRequest,$validated) {
                $defenseRequest->assignPanels(
                    $validated['defense_chairperson'],
                    $validated['defense_panelist1'],
                    $validated['defense_panelist2'] ?? null,
                    $validated['defense_panelist3'] ?? null,
                    $validated['defense_panelist4'] ?? null,
                    Auth::id()
                );
            });

            if ($request->expectsJson()) {
                return response()->json([
                    'ok'=>true,
                    'workflow_state'=>$defenseRequest->workflow_state
                ]);
            }

            return back()->with([
                'success'=>'Defense panel assigned. Proceed to scheduling.',
                'assigned_request_id'=>$defenseRequest->id
            ]);
        } catch (\Throwable $e) {
            Log::error('assignPanels failure',[

                'id'=>$defenseRequest->id,
                'error'=>$e->getMessage()
            ]);
            if ($request->expectsJson()) {
                return response()->json(['error'=>'Assign panels failed'],500);
            }
            return back()->withErrors(['error'=>'Failed to assign defense panel.']);
        }
    }

    public function scheduleDefense(Request $request, DefenseRequest $defenseRequest)
    {
        $validated = $request->validate([
            'scheduled_date' => 'required|date|after:today',
            'scheduled_time' => 'required|date_format:H:i',
            'scheduled_end_time' => 'required|date_format:H:i|after:scheduled_time',
            'defense_mode' => 'required|in:face-to-face,online',
            'defense_venue' => 'required|string|max:255',
            'scheduling_notes' => 'nullable|string|max:1000',
        ]);

        try {
            $conflictService = new DefenseConflictService();
            $panels = [
                'defense_chairperson' => $defenseRequest->defense_chairperson,
                'defense_panelist1' => $defenseRequest->defense_panelist1,
                'defense_panelist2' => $defenseRequest->defense_panelist2,
                'defense_panelist3' => $defenseRequest->defense_panelist3,
                'defense_panelist4' => $defenseRequest->defense_panelist4,
            ];

            $conflicts = $conflictService->findPanelSchedulingConflicts(
                $defenseRequest,
                $panels,
                $validated['scheduled_date'],
                $validated['scheduled_time'],
                $validated['scheduled_end_time']
            );
            if ($conflicts) {
                $startTime = Carbon::parse($validated['scheduled_time']);
                $endTime = Carbon::parse($validated['scheduled_end_time']);
                $timeRange = $startTime->format('g:i A').' - '.$endTime->format('g:i A');

                $conflictMessages = [];
                foreach ($conflicts as $c) {
                    $conflictMessages[] = sprintf(
                        "%s (serving as %s) is already scheduled as %s for %s's defense during %s",
                        $c['person'],
                        $c['current_role'],
                        $c['conflicting_role'],
                        $c['student_name'],
                        $c['time_range']
                    );
                }

                $message = "Scheduling conflict for {$timeRange}:\n".implode("\n",$conflictMessages);
                return back()->withErrors(['scheduled_time'=>$message])->withInput();
            }

            if ($conflictService->hasVenueConflict(
                $defenseRequest,
                $validated['defense_venue'],
                $validated['scheduled_date'],
                $validated['scheduled_time'],
                $validated['scheduled_end_time']
            )) {
                $startTime = Carbon::parse($validated['scheduled_time']);
                $endTime = Carbon::parse($validated['scheduled_end_time']);
                $timeRange = $startTime->format('g:i A').' - '.$endTime->format('g:i A');
                $date = Carbon::parse($validated['scheduled_date'])->format('M d, Y');
                return back()->withErrors([
                    'defense_venue'=>"Venue conflict: {$validated['defense_venue']} already used on {$date} during {$timeRange}"
                ])->withInput();
            }

            DB::transaction(function () use ($defenseRequest,$validated) {
                $defenseRequest->scheduleDefense(
                    Carbon::parse($validated['scheduled_date']),
                    Carbon::parse($validated['scheduled_time']),
                    Carbon::parse($validated['scheduled_end_time']),
                    $validated['defense_mode'],
                    $validated['defense_venue'],
                    $validated['scheduling_notes'],
                    Auth::id()
                );
            });

            $scheduleDate = Carbon::parse($validated['scheduled_date'])->format('M d, Y');
            $timeRange = Carbon::parse($validated['scheduled_time'])->format('g:i A')
                .' - '.Carbon::parse($validated['scheduled_end_time'])->format('g:i A');
            $this->createSchedulingNotifications($defenseRequest,$scheduleDate,$timeRange,$validated);

            return back()->with([
                'success'=>"Defense scheduled for {$scheduleDate} ({$timeRange})",
                'scheduling_completed'=>true
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to schedule defense',[
                'defense_request_id'=>$defenseRequest->id,
                'error'=>$e->getMessage()
            ]);
            return back()->withErrors(['error'=>'Failed to schedule defense.'])->withInput();
        }
    }

    public function sendNotifications(Request $request, DefenseRequest $defenseRequest)
    {
        $validated = $request->validate([
            'notify_parties' => 'required|array',
            'notify_parties.*' => 'in:adviser,student,panels',
        ]);

        try {
            $service = new DefenseNotificationService();
            $notified = $service->sendSchedulingNotifications($defenseRequest,$validated['notify_parties']);
            $defenseRequest->notifyParties($validated['notify_parties']);
            return back()->with('success','Notifications sent: '.implode(', ',$notified));
        } catch (\Throwable $e) {
            Log::error('Notification send failed',[
                'defense_request_id'=>$defenseRequest->id,
                'error'=>$e->getMessage()
            ]);
            return back()->withErrors(['error'=>'Failed to send notifications.']);
        }
    }

    public function updateDefense(Request $request, DefenseRequest $defenseRequest)
    {
        $validated = $request->validate([
            'defense_chairperson' => 'nullable|string|max:255',
            'defense_panelist1' => 'nullable|string|max:255',
            'defense_panelist2' => 'nullable|string|max:255',
            'defense_panelist3' => 'nullable|string|max:255',
            'defense_panelist4' => 'nullable|string|max:255',
            'scheduled_date' => 'nullable|date',
            'scheduled_time' => 'nullable|date_format:H:i',
            'defense_mode' => 'nullable|in:face-to-face,online',
            'defense_venue' => 'nullable|string|max:255',
            'scheduling_notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::transaction(function () use ($defenseRequest,$validated) {
                $changes = [];
                foreach ($validated as $field => $value) {
                    if ($defenseRequest->$field !== $value) {
                        $changes[$field] = ['from'=>$defenseRequest->$field,'to'=>$value];
                    }
                }
                if ($changes) {
                    $defenseRequest->update($validated);
                    $desc = 'Defense details updated: '.implode(', ',
                        array_map(fn($k,$c) => "{$k}: {$c['from']} → {$c['to']}", array_keys($changes), $changes));
                    $defenseRequest->addWorkflowEntry('defense-updated',$desc,Auth::id());
                }
            });

            return back()->with('success','Defense details updated successfully!');
        } catch (\Throwable $e) {
            Log::error('Defense update failed',[
                'defense_request_id'=>$defenseRequest->id,
                'error'=>$e->getMessage()
            ]);
            return back()->withErrors(['error'=>'Failed to update defense details.']);
        }
    }

    public function show(DefenseRequest $defenseRequest)
    {
        $defenseRequest->load(['user','adviserUser','panelsAssignedBy','scheduleSetBy']);

        return response()->json([
            'id' => $defenseRequest->id,
            'student_name' => $defenseRequest->first_name.' '.$defenseRequest->last_name,
            'school_id' => $defenseRequest->school_id,
            'program' => $defenseRequest->program,
            'thesis_title' => $defenseRequest->thesis_title,
            'defense_type' => $defenseRequest->defense_type,
            'adviser' => $defenseRequest->defense_adviser,
            'defense_chairperson' => $defenseRequest->defense_chairperson,
            'defense_panelist1' => $defenseRequest->defense_panelist1,
            'defense_panelist2' => $defenseRequest->defense_panelist2,
            'defense_panelist3' => $defenseRequest->defense_panelist3,
            'defense_panelist4' => $defenseRequest->defense_panelist4,
            'scheduled_date' => $defenseRequest->scheduled_date?->format('Y-m-d'),
            'scheduled_time' => $defenseRequest->scheduled_time?->format('H:i'),
            'defense_mode' => $defenseRequest->defense_mode,
            'defense_venue' => $defenseRequest->defense_venue,
            'scheduling_notes' => $defenseRequest->scheduling_notes,
            'workflow_history' => $defenseRequest->workflow_history,
        ]);
    }

    private function createSchedulingNotifications(DefenseRequest $defenseRequest, string $scheduleDate, string $timeRange, array $validated)
    {
        if ($defenseRequest->submitted_by) {
            Notification::create([
                'user_id' => $defenseRequest->submitted_by,
                'type' => 'defense-request',
                'title' => 'Defense Scheduled',
                'message' => "Your {$defenseRequest->defense_type} defense: {$scheduleDate} {$timeRange}, Venue: {$validated['defense_venue']}",
                'link' => '/defense-requirements',
            ]);
        }

        $panelMembers = array_filter([
            $defenseRequest->defense_chairperson,
            $defenseRequest->defense_panelist1,
            $defenseRequest->defense_panelist2,
            $defenseRequest->defense_panelist3,
            $defenseRequest->defense_panelist4,
        ]);

        foreach ($panelMembers as $panelMemberName) {
            $panelUser = User::where(function ($q) use ($panelMemberName) {
                $parts = preg_split('/\s+/',trim($panelMemberName));
                if (count($parts) >= 2) {
                    $q->where('first_name','LIKE','%'.$parts[0].'%')
                      ->where('last_name','LIKE','%'.end($parts).'%');
                } else {
                    $q->where('first_name','LIKE','%'.$panelMemberName.'%')
                      ->orWhere('last_name','LIKE','%'.$panelMemberName.'%');
                }
            })->first();

            if ($panelUser) {
                Notification::create([
                    'user_id'=>$panelUser->id,
                    'type'=>'defense-request',
                    'title'=>'Panel Assignment',
                    'message'=>"Assigned to {$defenseRequest->first_name} {$defenseRequest->last_name}'s defense: {$scheduleDate} {$timeRange} at {$validated['defense_venue']}",
                    'link'=>'/defense-requests',
                ]);
            }
        }

        if ($defenseRequest->adviser_user_id && !in_array($defenseRequest->adviser_user_id,$panelMembers)) {
            Notification::create([
                'user_id'=>$defenseRequest->adviser_user_id,
                'type'=>'defense-request',
                'title'=>"Student's Defense Scheduled",
                'message'=>"Defense for {$defenseRequest->first_name} {$defenseRequest->last_name}: {$scheduleDate} {$timeRange}.",
                'link'=>'/defense-requests',
            ]);
        }
    }

    public function getRequestsForApproval(Request $request)
    {
        $user = Auth::user();
        $coordinatorRoles = ['Coordinator','Administrative Assistant','Dean'];
        if (!in_array($user->role,$coordinatorRoles)) {
            abort(403,'Unauthorized access');
        }

        $defenseRequests = DefenseRequest::with(['user','adviserUser'])
            ->orderBy('created_at','desc')
            ->get()
            ->map(function ($r) {
                return [
                    'id'=>$r->id,
                    'first_name'=>$r->first_name,
                    'middle_name'=>$r->middle_name,
                    'last_name'=>$r->last_name,
                    'program'=>$r->program,
                    'thesis_title'=>$r->thesis_title,
                    'date_of_defense'=>$r->scheduled_date?->format('Y-m-d H:i:s'),
                    'defense_type'=>$r->defense_type,
                    'mode_defense'=>$r->defense_mode,
                    'status'=>$this->mapToReactStatus($r->workflow_state),
                    'priority'=>$r->priority ?? 'Medium',
                    'last_status_updated_by'=>$r->lastStatusUpdatedBy?->name,
                    'last_status_updated_at'=>$r->last_status_updated_at?->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json($defenseRequests);
    }

    private function mapToReactStatus($workflowState)
    {
        $mapping = [
            'adviser-approved'     => 'Pending',
            'coordinator-review'   => 'Pending',
            'coordinator-approved' => 'Approved',
            'panels-assigned'      => 'Approved',
            'scheduled'            => 'Approved',
            'rejected'             => 'Rejected',
        ];
        return $mapping[$workflowState] ?? 'Pending';
    }

    private function normalizeDefenseRequestStatus(DefenseRequest $r): string
    {
        $raw = $r->status ?? '';
        if (in_array($raw,['Approved','Rejected','Pending'])) return $raw;

        $lc = strtolower($raw);
        if (str_contains($lc,'approved')) return 'Approved';
        if (str_contains($lc,'rejected')) return 'Rejected';

        return match($r->workflow_state) {
            'submitted','adviser-review','adviser-approved','coordinator-review','needs-info' => 'Pending',
            'coordinator-approved','panels-assigned','scheduled','completed' => 'Approved',
            'adviser-rejected','coordinator-rejected','rejected' => 'Rejected',
            default => 'Pending'
        };
    }

    /**
     * Coordinator approves a defense request (new)
     */
    public function approve(Request $request, DefenseRequest $defenseRequest)
    {
        $this->authorizeRole();

        // Allow approval if adviser-approved OR coordinator-review OR still submitted legacy
        if (!in_array($defenseRequest->workflow_state, ['adviser-approved','coordinator-review','submitted', null])) {
            return back()->withErrors(['error'=>'Cannot approve in current state.']);
        }

        $comment = $request->input('comment');
        $defenseRequest->approveByCoordinator($comment, Auth::id());

        return back()->with('success','Defense request approved by coordinator.');
    }

    /**
     * JSON for show-all-requests.tsx
     */
    public function allDefenseRequests(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role,['Coordinator','Administrative Assistant','Dean'])) {
            return response()->json(['error'=>'Unauthorized'],403);
        }

        $visibleStates = [
            'adviser-approved',
            'coordinator-review',
            'coordinator-approved',
            'panels-assigned',
            'scheduled',
            'completed'
        ];

        $items = DefenseRequest::with(['user','adviserUser','panelsAssignedBy','scheduleSetBy','lastStatusUpdater'])
            ->whereIn('workflow_state', $visibleStates)
            ->whereNotIn('workflow_state', ['submitted','adviser-review']) // defensive guard
            ->orderBy('adviser_reviewed_at','desc')
            ->orderBy('created_at','desc')
            ->get()
            ->map(fn($r) => $this->mapDefenseRequestForList($r));

        return response()->json($items->values());
    }

    private function mapDefenseRequestForList(DefenseRequest $r): array
    {
        $status = $this->normalizeDefenseRequestStatus($r);

        $adviserName = $r->defense_adviser ?: '—';
        $submittedAt = $r->adviser_reviewed_at
            ? (is_object($r->adviser_reviewed_at)
                ? $r->adviser_reviewed_at->format('Y-m-d H:i:s')
                : date('Y-m-d H:i:s', strtotime($r->adviser_reviewed_at)))
            : '—';

        return [
            'id' => $r->id,
            'first_name' => $r->first_name,
            'middle_name' => $r->middle_name,
            'last_name' => $r->last_name,
            'program' => $r->program,
            'thesis_title' => $r->thesis_title,
            'date_of_defense' => $r->scheduled_date?->format('Y-m-d') ?? '',
            'mode_defense' => $r->defense_mode ?? '',
            'defense_type' => $r->defense_type,
            'status' => $status,
            'workflow_state' => $r->workflow_state,
            'priority' => $r->priority,
            'adviser' => $adviserName,
            'submitted_at' => $submittedAt,
            'defense_chairperson' => $r->defense_chairperson,
            'defense_panelist1' => $r->defense_panelist1,
            'defense_panelist2' => $r->defense_panelist2,
            'defense_panelist3' => $r->defense_panelist3,
            'defense_panelist4' => $r->defense_panelist4,
            'scheduled_date' => $r->scheduled_date?->format('Y-m-d'),
            'scheduled_time' => $r->scheduled_time?->format('H:i'),
            'scheduled_end_time' => $r->scheduled_end_time?->format('H:i'),
            'defense_mode' => $r->defense_mode,
            'defense_venue' => $r->defense_venue,
            'scheduling_notes' => $r->scheduling_notes,
            'last_status_updated_by' => $r->lastStatusUpdater?->name,
            'last_status_updated_at' => $r->last_status_updated_at?->format('Y-m-d H:i:s'),
            'panelists' => collect([
                $r->defense_chairperson ?? null,
                $r->defense_panelist1 ?? null,
                $r->defense_panelist2 ?? null,
                $r->defense_panelist3 ?? null,
                $r->defense_panelist4 ?? null,
            ])->filter()->values()->all(),
        ];
    }

    /**
     * Faculty + available panelists
     */
    public function availablePanelMembersJson(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role,['Coordinator','Administrative Assistant','Dean'])) {
            return response()->json(['data'=>[],'next_page'=>null],403);
        }

        $q        = trim($request->query('q',''));
        $page     = max(1, (int)$request->query('page', 1));
        $perPage  = min(100, max(5, (int)$request->query('per_page', 25)));
        $offset   = ($page - 1) * $perPage;

        // Faculty sources
        $facultyQuery = User::whereIn('role',['Faculty','Adviser'])
            ->when($q !== '', function($query) use ($q) {
                $query->where(function($sub) use ($q) {
                    $sub->where('first_name','LIKE',"%{$q}%")
                        ->orWhere('last_name','LIKE',"%{$q}%")
                        ->orWhereRaw("CONCAT(first_name,' ',last_name) LIKE ?",["%{$q}%"]);
                });
            });

        $facultyTotal = (clone $facultyQuery)->count();

        $faculty = $facultyQuery
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->skip($offset)
            ->take($perPage)
            ->get()
            ->map(fn($f) => [
                'id' => 'faculty-'.$f->id,
                'name' => trim($f->first_name.' '.($f->middle_name ? $f->middle_name.' ' : '').$f->last_name),
                'email' => $f->email,
                'type' => 'Faculty',
            ]);

        // Panelists
        $panelQuery = Panelist::where('status','Available')
            ->when($q !== '', function($query) use ($q) {
                $query->where(function($sub) use ($q) {
                    $sub->where('name','LIKE',"%{$q}%")
                        ->orWhere('email','LIKE',"%{$q}%");
                });
            });

        $panelTotal = (clone $panelQuery)->count();

        $panelists = $panelQuery
            ->orderBy('name')
            ->skip($offset)
            ->take($perPage)
            ->get()
            ->map(fn($p) => [
                'id' => 'panelist-'.$p->id,
                'name' => $p->name,
                'email' => $p->email,
                'type' => 'Panelist',
            ]);

        // Merge (faculty + panelists) for this page
        $merged = $faculty->concat($panelists)->values();

        // Decide next page: if BOTH sources exhausted for this page size
        $maxTotal = $facultyTotal + $panelTotal;
        $fetchedSoFar = $offset + $merged->count();
        $nextPage = $fetchedSoFar < $maxTotal ? $page + 1 : null;

        return response()->json([
            'data' => $merged,
            'next_page' => $nextPage,
            'total' => $maxTotal,
            'page' => $page,
        ]);
    }

    /**
     * JSON: assign panels
     */
    public function assignPanelsJson(Request $request, DefenseRequest $defenseRequest)
    {
        $this->authorizeRole();

        $data = $request->validate([
            'defense_chairperson' => 'required|string|max:255',
            'defense_panelist1'   => 'required|string|max:255',
            'defense_panelist2'   => 'nullable|string|max:255',
            'defense_panelist3'   => 'nullable|string|max:255',
            'defense_panelist4'   => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $origState = $defenseRequest->workflow_state;
            // Only allow if adviser-approved or already in panel stages
            if (!in_array($origState, [
                'coordinator-approved','panels-assigned','scheduled',
                'adviser-approved'
            ])) {
                return response()->json([
                    'error'=>"Cannot assign panels from state '{$origState}'"
                ],422);
            }

            foreach ($data as $k=>$v) {
                $defenseRequest->{$k} = $v;
            }

            if ($defenseRequest->workflow_state === 'coordinator-approved' ||
                $defenseRequest->workflow_state === 'adviser-approved') {
                $defenseRequest->workflow_state = 'panels-assigned';
                $defenseRequest->addWorkflowEntry(
                    'panels-assigned',
                    null,
                    Auth::id(),
                    $origState,
                    'panels-assigned'
                );
            }

            $defenseRequest->panels_assigned_by = Auth::id();
            if (property_exists($defenseRequest,'scheduling_status') || isset($defenseRequest->scheduling_status)) {
                $defenseRequest->scheduling_status = 'panels-assigned';
            }

            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = Auth::id();
            $defenseRequest->save();

            DB::commit();

            return response()->json([
                'ok'=>true,
                'request'=>$this->mapForDetails($defenseRequest)
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('assignPanelsJson error',[

                'id'=>$defenseRequest->id,
                'error'=>$e->getMessage()
            ]);
            return response()->json(['error'=>'Assigning panels failed'],500);
        }
    }

    public function scheduleDefenseJson(Request $request, DefenseRequest $defenseRequest)
    {
        $this->authorizeRole();

        $data = $request->validate([
            'scheduled_date'      => 'required|date',
            'scheduled_time'      => 'required|date_format:H:i',
            'scheduled_end_time'  => 'required|date_format:H:i|after:scheduled_time',
            'defense_mode'        => 'required|in:face-to-face,online',
            'defense_venue'       => 'required|string|max:255',
            'scheduling_notes'    => 'nullable|string|max:1000'
        ]);

        try {
            DB::beginTransaction();

            $origState = $defenseRequest->workflow_state;
            if (!in_array($origState, [
                'panels-assigned','scheduled','coordinator-approved'
            ])) {
                return response()->json([
                    'error'=>"Cannot schedule from state '{$origState}'"
                ],422);
            }

            foreach ($data as $k=>$v) {
                $defenseRequest->{$k} = $v;
            }

            $defenseRequest->scheduled_date = $data['scheduled_date'];
            $defenseRequest->scheduled_time = $data['scheduled_time'];
            $defenseRequest->scheduled_end_time = $data['scheduled_end_time'];
            $defenseRequest->defense_mode = $data['defense_mode'];
            $defenseRequest->defense_venue = $data['defense_venue'];

            if ($defenseRequest->workflow_state !== 'scheduled') {
                $defenseRequest->workflow_state = 'scheduled';
                $defenseRequest->addWorkflowEntry(
                    'scheduled',
                    $data['scheduling_notes'] ?? null,
                    Auth::id(),
                    $origState,
                    'scheduled'
                );
            }

            if (property_exists($defenseRequest,'scheduling_status') || isset($defenseRequest->scheduling_status)) {
                $defenseRequest->scheduling_status = 'scheduled';
            }

            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = Auth::id();
            $defenseRequest->save();

            DB::commit();

            return response()->json([
                'ok'=>true,
                'request'=>$this->mapForDetails($defenseRequest)
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('scheduleDefenseJson error',[

                'id'=>$defenseRequest->id,
                'error'=>$e->getMessage()
            ]);
            return response()->json(['error'=>'Scheduling failed'],500);
        }
    }

    private function mapForDetails(DefenseRequest $r): array
    {
        $r->attemptAutoComplete(); // lazy auto-complete for coordinator view
        return [
            'id'=>$r->id,
            'first_name'=>$r->first_name,
            'middle_name'=>$r->middle_name,
            'last_name'=>$r->last_name,
            'school_id'=>$r->school_id,
            'program'=>$r->program,
            'thesis_title'=>$r->thesis_title,
            'defense_type'=>$r->defense_type,
            'defense_adviser'=>$r->defense_adviser,
            'defense_chairperson'=>$r->defense_chairperson,
            'defense_panelist1'=>$r->defense_panelist1,
            'defense_panelist2'=>$r->defense_panelist2,
            'defense_panelist3'=>$r->defense_panelist3,
            'defense_panelist4'=>$r->defense_panelist4,
            'scheduled_date'=>$r->scheduled_date,
            'scheduled_time'=>$r->scheduled_time,
            'scheduled_end_time'=>$r->scheduled_end_time,
            'defense_mode'=>$r->defense_mode,
            'defense_venue'=>$r->defense_venue,
            'scheduling_notes'=>$r->scheduling_notes ?? null,
            'workflow_state'=>$r->workflow_state,
            'status'=>$r->status,
            'priority'=>$r->priority,
            'workflow_history'=>$r->workflow_history,
            'last_status_updated_at'=>$r->last_status_updated_at?->toIso8601String(),
            'last_status_updated_by'=>$r->last_status_updated_by
        ];
    }

    public function updateStatus(Request $request, DefenseRequest $defenseRequest)
    {
        $this->authorizeRole();

        $validated = $request->validate([
            'status' => 'required|in:Pending,Approved,Rejected'
        ]);
        $user = Auth::user();

        $origState = $defenseRequest->workflow_state;
        $newStatus = $validated['status'];

        DB::beginTransaction();
        try {
            if ($newStatus === 'Approved') {
                // Only allow approval from certain states
                if (!in_array($origState, ['adviser-approved','coordinator-review','submitted', null])) {
                    return response()->json(['error'=>'Cannot approve in current state.'], 422);
                }
                $defenseRequest->approveByCoordinator(null, $user->id);
                // approveByCoordinator should already add a workflow entry
            } elseif ($newStatus === 'Rejected') {
                // Allow rejection from any state except already rejected
                if ($origState === 'rejected') {
                    return response()->json(['error'=>'Already rejected.'], 422);
                }
                $defenseRequest->status = 'Rejected';
                $defenseRequest->workflow_state = 'rejected';
                $defenseRequest->last_status_updated_at = now();
                $defenseRequest->last_status_updated_by = $user->id;
                $defenseRequest->addWorkflowEntry(
                    'rejected',
                    'Request rejected by coordinator',
                    $user->id,
                    $origState,
                    'rejected'
                );
                $defenseRequest->save();
            } elseif ($newStatus === 'Pending') {
                // "Retrieve" action: set back to pending
                $defenseRequest->status = 'Pending';
                $defenseRequest->workflow_state = 'coordinator-review';
                $defenseRequest->last_status_updated_at = now();
                $defenseRequest->last_status_updated_by = $user->id;
                $defenseRequest->addWorkflowEntry(
                    'retrieved',
                    'Request retrieved (set to pending) by coordinator',
                    $user->id,
                    $origState,
                    'coordinator-review'
                );
                $defenseRequest->save();
            }

            DB::commit();

            return response()->json([
                'ok' => true,
                'request' => $this->mapForDetails($defenseRequest)
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('updateStatus error', [
                'id' => $defenseRequest->id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to update status.'], 500);
        }
    }
}