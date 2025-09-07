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

class DefenseRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $props = [];

        // Student: show the latest defense request for the student's school
        if ($user->role === 'Student') {
            $latest = DefenseRequest::with('lastStatusUpdater')
                ->where('school_id', $user->school_id)
                ->latest()->first();
            if ($latest) {
                $latest->last_status_updated_by = $latest->lastStatusUpdater?->name;
            }
            $props['defenseRequest'] = $latest;
            // Existing student page is under defense-requirements (re-using modal form there)
            return Inertia::render('student/submissions/defense-requirements/Index', $props);
        }

        // Administrative Assistant / Dean: show all requests (fallback to coordinator-style view)
        if (in_array($user->role, ['Administrative Assistant', 'Dean'])) {
            $all = DefenseRequest::with(['lastStatusUpdater','adviserUser','assignedTo'])
                ->orderByDesc('created_at')
                ->get();

            // add last_status_updated_by for frontend convenience
            $all->transform(function ($item) {
                $item->last_status_updated_by = $item->lastStatusUpdater?->name;
                return $item;
            });

            $props['defenseRequests'] = $all;

            if ($request->wantsJson()) {
                return response()->json($props['defenseRequests'] ?? []);
            }

            return Inertia::render('coordinator/submissions/defense-request/Index', $props);
        }

        // Coordinator: show pending/active requests for coordinator dashboard
        if ($user->role === 'Coordinator') {
            $pending = DefenseRequest::with(['adviserUser','assignedTo'])
                ->whereIn('workflow_state', ['coordinator-review','approved','coordinator-rejected'])
                ->orderByDesc('created_at')
                ->get();

            $pending->transform(function ($item) {
                $item->last_status_updated_by = $item->lastStatusUpdater?->name;
                return $item;
            });

            $props['defenseRequests'] = $pending;

            if ($request->wantsJson()) {
                // Always return ALL requests for the coordinator dashboard when JSON requested
                return response()->json($props['defenseRequests'] ?? []);
            }

            return Inertia::render('coordinator/submissions/defense-request/Index', $props);
        }

        // Adviser / Faculty: ONLY show requests where this faculty is the mapped adviser OR currently assigned reviewer
        if (in_array($user->role, ['Faculty', 'Adviser'])) {
            $assigned = DefenseRequest::with(['adviserUser','assignedTo'])
                ->where(function($q) use ($user){
                    $q->where('adviser_user_id', $user->id)
                      ->orWhere('assigned_to_user_id', $user->id);
                })
                ->orderByDesc('created_at')
                ->get();

            $assigned->transform(function ($item) {
                $item->last_status_updated_by = $item->lastStatusUpdater?->name;
                return $item;
            });

            $props['defenseRequests'] = $assigned;
            return Inertia::render('faculty/submissions/defense-request/Index', $props);
        }

        // Fallback — render student defense-requirements index (empty props if nothing set)
        return Inertia::render('student/submissions/defense-requirements/Index', $props);
    }

    public function review(DefenseRequest $defenseRequest, Request $request)
    {
        $request->validate([
            'action' => 'required|in:approve,reject,needs-info',
        ]);

        $defenseRequest->update([
            'status' => $request->action,
        ]);

        return back()->with('success', 'Status updated successfully');
    }

    public function store(Request $request)
    {
        Log::info('Defense request submission started', ['user_id' => Auth::id(), 'request_data' => $request->all()]);
        
        $data = $request->validate([
            'firstName' => 'required|string',
            'middleName' => 'nullable|string',
            'lastName' => 'required|string',
            'schoolId' => 'required|string',
            'program' => 'required|string',
            'thesisTitle' => 'required|string',
            'defenseType' => 'required|string|in:Proposal,Prefinal,Final',
            'defenseAdviser' => 'required|string',
            // Professional file validation for academic documents
            'advisersEndorsement' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:204800', // 200MB
            'recEndorsement' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:204800', // 200MB
            'proofOfPayment' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:204800', // 200MB
            // Reference number is a plain text field (not a file upload)
            'referenceNo' => 'required|string|max:100',
        ]);

        Log::info('Validation passed', ['validated_data' => array_keys($data)]);

        foreach ([ 'advisersEndorsement', 'recEndorsement', 'proofOfPayment' ] as $field) {
            if ($request->hasFile($field)) {
                try {
                    $data[$field] = $request->file($field)->store('defense-attachments');
                } catch (\Throwable $e) {
                    Log::error('File upload failed for '.$field.': '.$e->getMessage());
                }
            }
        }

        // Auto-suggest adviser if not provided (supports disabling via ?no_auto_adviser=1)
        if (empty($data['defenseAdviser'])) {
            if ($request->boolean('no_auto_adviser')) {
                Log::info('Skipping adviser auto-suggestion due to no_auto_adviser flag');
            } else {
                try {
                    $service = app(\App\Services\AdviserSuggestionService::class);
                    $legacySession = Cache::get('legacy_session_'.Auth::id());
                    $suggested = $service->suggestForStudent(Auth::user(), $legacySession, $data['program'] ?? null);
                    if ($suggested) {
                        $data['defenseAdviser'] = $suggested;
                    }
                } catch (\Throwable $e) {
                    Log::debug('Adviser auto-suggest failed: '.$e->getMessage());
                }
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
                'date_of_defense' => null, // Coordinator will set this later
                'mode_defense' => null, // Coordinator will set this later
                'defense_type' => $data['defenseType'],
                'advisers_endorsement' => $data['advisersEndorsement'] ?? null,
                'rec_endorsement' => $data['recEndorsement'] ?? null,
                'proof_of_payment' => $data['proofOfPayment'] ?? null,
                'reference_no' => $data['referenceNo'] ?? null,
                'defense_adviser' => $data['defenseAdviser'],
                // Committee members will be set by coordinator after approval
                'defense_chairperson' => null,
                'defense_panelist1' => null,
                'defense_panelist2' => null,
                'defense_panelist3' => null,
                'defense_panelist4' => null,
                'submitted_by' => Auth::id(),
                'status' => 'Pending', // ensure default even if DB default changes
                'priority' => 'Medium',
                // workflow defaults
                'workflow_state' => 'adviser-review',
            ]);
            Log::info('DefenseRequest created', ['id' => $defenseRequest->id, 'student_id' => Auth::id()]);

            // Attempt to map adviser name to a user id for workflow routing
            if ($defenseRequest->defense_adviser) {
                $adviserName = trim($defenseRequest->defense_adviser);
                Log::info('Looking for adviser user', ['adviser_name' => $adviserName]);
                
                $adviserUser = User::where(function($query) use ($adviserName) {
                    // Try exact full name match (first + last)
                    $query->whereRaw('CONCAT(first_name, " ", last_name) = ?', [$adviserName])
                          // Try exact full name match (last, first)
                          ->orWhereRaw('CONCAT(last_name, ", ", first_name) = ?', [$adviserName]);
                    
                    // Handle middle initials/names - remove middle parts for matching
                    $nameParts = preg_split('/\s+/', $adviserName);
                    if (count($nameParts) >= 2) {
                        $firstName = $nameParts[0];
                        $lastName = end($nameParts);
                        
                        // Match first and last name, ignoring middle names/initials
                        $query->orWhere(function($q) use ($firstName, $lastName) {
                            $q->where('first_name', 'LIKE', '%' . $firstName . '%')
                              ->where('last_name', 'LIKE', '%' . $lastName . '%');
                        });
                        
                        // Also try exact first and last name match
                        $query->orWhere(function($q) use ($firstName, $lastName) {
                            $q->where('first_name', $firstName)
                              ->where('last_name', $lastName);
                        });
                    }
                    
                    // Fallback: partial name matching
                    $query->orWhere(function($q) use ($adviserName) {
                        if (strlen($adviserName) > 3) {
                            $q->where('first_name', 'LIKE', '%' . $adviserName . '%')
                              ->orWhere('last_name', 'LIKE', '%' . $adviserName . '%');
                        }
                    });
                })
                ->where('role', 'Faculty') // Only match faculty members
                ->first();
                
                if ($adviserUser) {
                    Log::info('Found adviser user', ['user_id' => $adviserUser->id, 'user_name' => $adviserUser->first_name . ' ' . $adviserUser->last_name]);
                    $defenseRequest->adviser_user_id = $adviserUser->id;
                    $defenseRequest->assigned_to_user_id = $adviserUser->id; // first reviewer
                    $defenseRequest->save();
                    Notification::create([
                        'user_id' => $adviserUser->id,
                        'type' => 'defense-request',
                        'title' => 'New Defense Request (Adviser Review)',
                        'message' => "A {$defenseRequest->defense_type} defense request from {$defenseRequest->first_name} {$defenseRequest->last_name} requires your review.",
                        'link' => url("/defense-request/{$defenseRequest->id}"),
                    ]);
                }
            }

            // If no adviser user found, fall back to coordinators
            if (!$defenseRequest->assigned_to_user_id) {
                $coordinators = User::where('role','Coordinator')->get();
                foreach ($coordinators as $c) {
                    Notification::create([
                        'user_id' => $c->id,
                        'type' => 'defense-request',
                        'title' => 'New Defense Request Submitted',
                        'message' => "{$defenseRequest->first_name} {$defenseRequest->last_name} submitted a new {$defenseRequest->defense_type} defense request.",
                        'link' => url("/defense-request/{$defenseRequest->id}"),
                    ]);
                }
                $defenseRequest->workflow_state = 'coordinator-review';
                $defenseRequest->save();
            }

            DB::commit();
            Log::info('Defense request saved successfully', ['id' => $defenseRequest->id, 'workflow_state' => $defenseRequest->workflow_state]);
            
            if ($request->query('json') == '1' || $request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'id' => $defenseRequest->id,
                    'workflow_state' => $defenseRequest->workflow_state,
                    'status' => $defenseRequest->status,
                ], 201);
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('DefenseRequest store failed', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Failed to save defense request: ' . $e->getMessage()], 500);
            }
            return Redirect::back()->with('error', 'Failed to save defense request: ' . $e->getMessage());
        }

        return Redirect::back()->with('success', 'Your defense request has been submitted!');
    }

    /**
     * Show a single defense request (JSON) with strict access control.
     * Allowed roles:
     *  - Student who owns it (matching school_id)
     *  - Adviser / Faculty only if adviser_user_id or assigned_to_user_id matches their id
     *  - Coordinator, Administrative Assistant, Dean (oversight roles)
     */
    public function show(DefenseRequest $defenseRequest, Request $request)
    {
        $user = Auth::user();
        $allowed = false;
        if (!$user) abort(401);

        if (in_array($user->role, ['Coordinator','Administrative Assistant','Dean'])) {
            $allowed = true; // oversight roles see all
        } elseif ($user->role === 'Student' && $defenseRequest->school_id === $user->school_id) {
            $allowed = true;
        } elseif (in_array($user->role, ['Faculty','Adviser']) && (
            $defenseRequest->adviser_user_id === $user->id ||
            $defenseRequest->assigned_to_user_id === $user->id
        )) {
            $allowed = true;
        }

        if (!$allowed) abort(403, 'Not authorized to view this defense request');

        if ($request->wantsJson()) {
            return response()->json($defenseRequest);
        }
        // For now just return JSON; can adapt to an Inertia show page later if needed
        return response()->json($defenseRequest);
    }

    /**
     * API endpoint for real-time defense request updates
     * Returns JSON with latest defense request data for polling
     */
    public function apiShow(DefenseRequest $defenseRequest)
    {
        $user = Auth::user();
        if (!$user) abort(401);

        // Check authorization (same as show method)
        $allowed = false;
        if (in_array($user->role, ['Coordinator','Administrative Assistant','Dean'])) {
            $allowed = true; // oversight roles see all
        } elseif ($user->role === 'Student' && $defenseRequest->school_id === $user->school_id) {
            $allowed = true;
        } elseif (in_array($user->role, ['Faculty','Adviser']) && (
            $defenseRequest->adviser_user_id === $user->id ||
            $defenseRequest->assigned_to_user_id === $user->id
        )) {
            $allowed = true;
        }

        if (!$allowed) abort(403, 'Not authorized to view this defense request');

        // Return fresh data with all relevant fields for the frontend
        return response()->json([
            'id' => $defenseRequest->id,
            'workflow_state' => $defenseRequest->workflow_state,
            'workflow_state_display' => $defenseRequest->workflow_state_display,
            'status' => $defenseRequest->status,
            'thesis_title' => $defenseRequest->thesis_title,
            'school_id' => $defenseRequest->school_id,
            'defense_chairperson' => $defenseRequest->defense_chairperson,
            'defense_panelist1' => $defenseRequest->defense_panelist1,
            'defense_panelist2' => $defenseRequest->defense_panelist2,
            'defense_panelist3' => $defenseRequest->defense_panelist3,
            'defense_panelist4' => $defenseRequest->defense_panelist4,
            'scheduled_date' => $defenseRequest->scheduled_date,
            'scheduled_time' => $defenseRequest->scheduled_time,
            'scheduled_end_time' => $defenseRequest->scheduled_end_time,
            'formatted_time_range' => $defenseRequest->formatted_time_range,
            'defense_venue' => $defenseRequest->defense_venue,
            'defense_mode' => $defenseRequest->defense_mode,
            'adviser_comments' => $defenseRequest->adviser_comments,
            'coordinator_comments' => $defenseRequest->coordinator_comments,
            'date_of_defense' => $defenseRequest->date_of_defense,
            'mode_defense' => $defenseRequest->mode_defense,
            'last_updated' => $defenseRequest->updated_at,
        ]);
    }

    /**
     * Return an adviser suggestion (JSON) for the authenticated student.
     */
    public function adviserSuggestion(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'Student') {
            return response()->json(['suggestion' => null, 'source' => null], 200);
        }
        $legacySession = Cache::get('legacy_session_'.$user->id);
        try {
            $service = app(\App\Services\AdviserSuggestionService::class);
            $suggestion = $service->suggestForStudent($user, $legacySession, $user->program ?? null, $request->query('period_id'));
            return response()->json($suggestion);
        } catch (\Throwable $e) {
            Log::debug('adviserSuggestion error: '.$e->getMessage());
            return response()->json(['suggestion' => null, 'source' => null, 'error' => 'failed']);
        }
    }

    /**
     * Return a list of adviser candidates (JSON) for auto-complete.
     */
    public function adviserCandidates(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'Student') {
            return response()->json(['instructors' => []]);
        }
        $legacySession = Cache::get('legacy_session_'.$user->id);
        try {
            $service = app(\App\Services\AdviserSuggestionService::class);
            $candidates = $service->collectCandidates($user, $legacySession, $user->program ?? null, $request->query('period_id'));
            if (empty($candidates['instructors'])) {
                Log::debug('adviserCandidates empty instructors', [
                    'user_id' => $user->id,
                    'legacy_session_present' => (bool)$legacySession,
                    'program' => $user->program,
                ]);
            }
            return response()->json($candidates);
        } catch (\Throwable $e) {
            Log::debug('adviserCandidates error: '.$e->getMessage());
            return response()->json(['instructors' => [], 'error' => 'failed']);
        }
    }

    public function updateStatus(Request $request, DefenseRequest $defenseRequest)
    {
        $request->validate([
            'status' => 'required|in:Pending,In progress,Approved,Rejected,Needs-info',
        ]);
        $defenseRequest->update([
            'status' => $request->status,
            'last_status_updated_at' => now()->setTimezone('Asia/Manila'),
            'last_status_updated_by' => Auth::id(),
        ]);
        $student = User::where('school_id', $defenseRequest->school_id)->first();
        if ($student) {
            Notification::create([
                'user_id' => $student->id,
                'type' => 'defense-request',
                'title' => 'Defense Request Status Updated',
                'message' => "Your defense request has been {$defenseRequest->status}.",
                'link' => url("/defense-request/{$defenseRequest->id}"),
            ]);
        }
        return response()->json([
            'success' => true,
            'status' => $defenseRequest->status,
            'last_status_updated_by' => $defenseRequest->lastStatusUpdater?->name,
            'last_status_updated_at' => optional($defenseRequest->last_status_updated_at)->setTimezone('Asia/Manila')->toISOString(),
        ]);
    }

    /** Adviser approves or rejects request with comments, then forwards to coordinator if approved */
    public function adviserDecision(Request $request, DefenseRequest $defenseRequest)
    {
        try {
            $request->validate([
                'decision' => 'required|in:approve,reject',
                'comments' => 'nullable|string|max:1000'
            ]);
            $user = Auth::user();
            
            // Check authorization
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
            }
            
            // Check if user can make this decision
            if ($defenseRequest->adviser_user_id !== $user->id && $defenseRequest->assigned_to_user_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Not authorized to review this request'], 403);
            }
            
            // Allow review from submitted or adviser-review states
            if (!in_array($defenseRequest->workflow_state, ['submitted', 'adviser-review'])) {
                return response()->json(['success' => false, 'message' => 'Request is not in reviewable state'], 400);
            }
            
            if ($request->decision === 'reject') {
                $defenseRequest->workflow_state = 'adviser-rejected';
                $defenseRequest->status = 'Rejected by Adviser';
                $defenseRequest->adviser_comments = $request->comments;
                $defenseRequest->adviser_reviewed_at = now();
                $defenseRequest->adviser_reviewed_by = $user->id;
                
                // Add workflow history
                $defenseRequest->addWorkflowEntry(
                    'adviser-rejected',
                    $request->comments ?: 'Rejected by adviser',
                    $user->id
                );
                
                // Notify student of rejection
                if ($defenseRequest->submitted_by) {
                    Notification::create([
                        'user_id' => $defenseRequest->submitted_by,
                        'type' => 'defense-request',
                        'title' => 'Defense Request Rejected by Adviser',
                        'message' => "Your {$defenseRequest->defense_type} defense request has been rejected by your adviser." . ($request->comments ? " Comment: {$request->comments}" : " Please contact your adviser for feedback."),
                        'link' => url("/defense-request"),
                    ]);
                }
            } else {
                // Approve and forward to coordinator(s)
                $defenseRequest->workflow_state = 'adviser-approved';
                $defenseRequest->status = 'Approved by Adviser';
                $defenseRequest->adviser_comments = $request->comments;
                $defenseRequest->adviser_reviewed_at = now();
                $defenseRequest->adviser_reviewed_by = $user->id;
                
                // Add workflow history
                $defenseRequest->addWorkflowEntry(
                    'adviser-approved',
                    $request->comments ?: 'Approved by adviser',
                    $user->id
                );
                
                // Forward to coordinator(s)
                $coordinator = User::where('role','Coordinator')->first();
                if ($coordinator) {
                    $defenseRequest->assigned_to_user_id = $coordinator->id;
                    $defenseRequest->workflow_state = 'coordinator-review'; // Move to coordinator review
                    
                    Notification::create([
                        'user_id' => $coordinator->id,
                        'type' => 'defense-request',
                        'title' => 'Defense Request Awaiting Coordinator Review',
                        'message' => "A {$defenseRequest->defense_type} defense request from {$defenseRequest->first_name} {$defenseRequest->last_name} was approved by adviser and needs your review.",
                        'link' => url("/defense-request/{$defenseRequest->id}"),
                    ]);
                }
                
                // Notify student of approval
                if ($defenseRequest->submitted_by) {
                    Notification::create([
                        'user_id' => $defenseRequest->submitted_by,
                        'type' => 'defense-request',
                        'title' => 'Defense Request Approved by Adviser',
                        'message' => "Your {$defenseRequest->defense_type} defense request has been approved by your adviser and forwarded to the Coordinator for final review." . ($request->comments ? " Comment: {$request->comments}" : ""),
                        'link' => url("/defense-request"),
                    ]);
                }
            }
            
            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = $user->id;
            $defenseRequest->save();
            
            return response()->json([
                'success' => true,
                'workflow_state' => $defenseRequest->workflow_state,
                'status' => $defenseRequest->status,
                'message' => $request->decision === 'approve' ? 'Request approved successfully' : 'Request rejected successfully',
                'comments' => $request->comments
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Invalid decision value', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('AdviserDecision error: ' . $e->getMessage(), ['request_id' => $defenseRequest->id, 'user_id' => Auth::id()]);
            return response()->json(['success' => false, 'message' => 'Internal server error occurred'], 500);
        }
    }

    /** Coordinator final approval / rejection */
    public function coordinatorDecision(Request $request, DefenseRequest $defenseRequest)
    {
        $request->validate(['decision' => 'required|in:approve,reject']);
        $user = Auth::user();
        if ($defenseRequest->workflow_state !== 'coordinator-review' || $user->role !== 'Coordinator') {
            return response()->json(['error' => 'Not authorized'], 403);
        }
        
        if ($request->decision === 'reject') {
            $defenseRequest->workflow_state = 'coordinator-rejected';
            $defenseRequest->status = 'Rejected by Coordinator';
            $defenseRequest->coordinator_comments = $request->comments ?? 'Rejected by coordinator';
            
            // Add workflow history
            $defenseRequest->addWorkflowEntry(
                'coordinator-rejected',
                $request->comments ?: 'Rejected by coordinator',
                $user->id
            );
            
            // Notify student of rejection
            if ($defenseRequest->submitted_by) {
                Notification::create([
                    'user_id' => $defenseRequest->submitted_by,
                    'type' => 'defense-request',
                    'title' => 'Defense Request Rejected by Coordinator',
                    'message' => "Your {$defenseRequest->defense_type} defense request has been rejected by the Coordinator. " . 
                               ($request->comments ? "Feedback: {$request->comments}. " : "") .
                               "Please address the concerns and resubmit.",
                    'link' => '/defense-requirements',
                ]);
            }
        } else {
            $defenseRequest->workflow_state = 'coordinator-approved';
            $defenseRequest->status = 'Approved by Coordinator';
            $defenseRequest->coordinator_comments = $request->comments ?? 'Approved by coordinator';
            
            // Add workflow history
            $defenseRequest->addWorkflowEntry(
                'coordinator-approved',
                $request->comments ?: 'Approved by coordinator',
                $user->id
            );
            
            // Notify student of approval
            if ($defenseRequest->submitted_by) {
                Notification::create([
                    'user_id' => $defenseRequest->submitted_by,
                    'type' => 'defense-request',
                    'title' => '🎉 Defense Request Approved!',
                    'message' => "Excellent! Your {$defenseRequest->defense_type} defense request has been approved by the Coordinator. " .
                               "Panel assignment and scheduling will begin shortly. You will be notified once your defense is scheduled.",
                    'link' => '/defense-requirements',
                ]);
            }
        }
        
        $defenseRequest->last_status_updated_at = now();
        $defenseRequest->last_status_updated_by = $user->id;
        $defenseRequest->save();
        
        return response()->json(['success'=>true,'workflow_state'=>$defenseRequest->workflow_state]);
    }

    public function updatePriority(Request $request, DefenseRequest $defenseRequest)
    {
        $request->validate([
            'priority' => 'required|in:Low,Medium,High',
        ]);
        $defenseRequest->update([
            'priority' => $request->priority,
            'last_status_updated_at' => now()->setTimezone('Asia/Manila'),
            'last_status_updated_by' => Auth::id(),
        ]);
        $defenseRequest->load('lastStatusUpdater');
        return response()->json([
            'success' => true,
            'priority' => $defenseRequest->priority,
            'last_status_updated_by' => $defenseRequest->lastStatusUpdater?->name,
            'last_status_updated_at' => optional($defenseRequest->last_status_updated_at)->setTimezone('Asia/Manila')->toISOString(),
        ]);
    }

    public function bulkUpdateStatus(Request $request)
    {
        Log::info('Bulk status update request', $request->all());

        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
            'status' => 'required|in:Pending,In progress,Approved,Rejected,Needs-info',
        ]);
        if ($validator->fails()) {
            Log::error('Bulk status update validation failed', [
                'errors' => $validator->errors()->all(),
                'request' => $request->all()
            ]);
            return response()->json(['error' => $validator->errors()->first()], 422);
        }
        $ids = $request->ids;
        if (empty($ids) || !is_array($ids)) {
            Log::error('Bulk status update: No IDs provided or not array', ['ids' => $ids, 'request' => $request->all()]);
            return response()->json(['error' => 'No IDs provided'], 400);
        }
        try {
            $updateCount = DefenseRequest::whereIn('id', $ids)->update([
                'status' => $request->status,
                'last_status_updated_at' => now()->setTimezone('Asia/Manila'),
                'last_status_updated_by' => Auth::id(),
            ]);
            Log::info('Bulk status update DB result', ['updateCount' => $updateCount, 'ids' => $ids]);
            $updated = DefenseRequest::with('lastStatusUpdater')->whereIn('id', $ids)->get();
            $result = $updated->map(function ($item) {
                $lastStatusUpdatedAt = null;
                if ($item->last_status_updated_at) {
                    if ($item->last_status_updated_at instanceof \Carbon\Carbon) {
                        $lastStatusUpdatedAt = $item->last_status_updated_at->setTimezone('Asia/Manila')->toISOString();
                    } else {
                        $lastStatusUpdatedAt = $item->last_status_updated_at;
                    }
                }
                return [
                    'id' => $item->id,
                    'status' => $item->status,
                    'last_status_updated_by' => $item->lastStatusUpdater?->name,
                    'last_status_updated_at' => $lastStatusUpdatedAt,
                ];
            });
            Log::info('Bulk status update result', ['ids' => $ids, 'result' => $result]);
            return response()->json($result);
        } catch (\Throwable $e) {
            Log::error('Bulk status update error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json(['error' => 'Bulk update failed', 'details' => $e->getMessage()], 500);
        }
    }

    public function bulkUpdatePriority(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'priority' => 'required|in:Low,Medium,High',
        ]);
        $ids = $request->ids;
        DefenseRequest::whereIn('id', $ids)->update([
            'priority' => $request->priority,
            'last_status_updated_at' => now()->setTimezone('Asia/Manila'),
            'last_status_updated_by' => Auth::id(),
        ]);

        $updated = DefenseRequest::with('lastStatusUpdater')->whereIn('id', $ids)->get();
        $result = $updated->map(function ($item) {
            $lastStatusUpdatedAt = null;
            if ($item->last_status_updated_at) {
                if ($item->last_status_updated_at instanceof \Carbon\Carbon) {
                    $lastStatusUpdatedAt = $item->last_status_updated_at->setTimezone('Asia/Manila')->toISOString();
                } else {
                    $lastStatusUpdatedAt = $item->last_status_updated_at;
                }
            }
            return [
                'id' => $item->id,
                'priority' => $item->priority,
                'last_status_updated_by' => $item->lastStatusUpdater?->name,
                'last_status_updated_at' => $lastStatusUpdatedAt,
            ];
        });
        return response()->json($result);
    }

    public function count()
    {
        $count = DefenseRequest::where('status', 'Pending')->count();
        return response()->json(['count' => $count]);
    }

    public function calendar()
    {
        return \App\Models\DefenseRequest::select('id', 'thesis_title', 'date_of_defense', 'status')
            ->get();
    }

    public function destroy(DefenseRequest $defenseRequest)
    {
        $defenseRequest->delete();
        return response()->json(['success' => true]);
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);
        DefenseRequest::whereIn('id', $request->ids)->delete();
        return response()->json(['success' => true]);
    }

    public function all(Request $request)
    {
        return abort(404);
    }

    public function downloadAttachment(Request $request, $filename)
    {
        $user = Auth::user();
        
        // Find the defense request that contains this file
        $defenseRequest = DefenseRequest::where(function($query) use ($filename) {
            $query->where('advisers_endorsement', 'LIKE', "%{$filename}")
                  ->orWhere('rec_endorsement', 'LIKE', "%{$filename}")
                  ->orWhere('proof_of_payment', 'LIKE', "%{$filename}");
        })->first();

        if (!$defenseRequest) {
            abort(404, 'File not found');
        }

        // Check access permissions
        $canAccess = false;
        
        // Student who submitted can access
        if ($defenseRequest->submitted_by === $user->id) {
            $canAccess = true;
        }
        
        // Assigned adviser can access
        if ($defenseRequest->adviser_user_id === $user->id) {
            $canAccess = true;
        }
        
        // Currently assigned reviewer can access
        if ($defenseRequest->assigned_to_user_id === $user->id) {
            $canAccess = true;
        }
        
        // Coordinators and admins can access
        if (in_array($user->role, ['Coordinator', 'Administrative Assistant', 'Dean'])) {
            $canAccess = true;
        }

        if (!$canAccess) {
            abort(403, 'Unauthorized to access this file');
        }

        $filePath = storage_path("app/defense-attachments/{$filename}");
        
        if (!file_exists($filePath)) {
            abort(404, 'File not found on disk');
        }

        return response()->file($filePath);
    }

    public function pending()
    {
        return DefenseRequest::where('status', 'Pending')
            ->select('id', 'thesis_title', 'date_of_defense', 'status', 'priority')
            ->orderByDesc('created_at')
            ->get();
    }
}
