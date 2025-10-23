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
        if (!$user)
            abort(401);

        $coordinatorRoles = ['Coordinator', 'Administrative Assistant', 'Dean'];

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
                $query->where(function ($q) use ($s) {
                    $q->where('thesis_title', 'like', "%$s%")
                        ->orWhere('first_name', 'like', "%$s%")
                        ->orWhere('last_name', 'like', "%$s%")
                        ->orWhere('school_id', 'like', "%$s%");
                });
            }

            $rows = $query
                ->with('aaVerification') // Load AA verification relationship
                ->orderByRaw("FIELD(workflow_state,'adviser-approved','coordinator-review','coordinator-approved','panels-assigned','scheduled','completed','coordinator-rejected')")
                ->orderBy('adviser_reviewed_at', 'desc')
                ->limit(300)
                ->get([
                    'id',
                    'first_name',
                    'middle_name',
                    'last_name',
                    'school_id',
                    'program',
                    'thesis_title',
                    'defense_type',
                    'status',
                    'priority',
                    'workflow_state',
                    'scheduled_date',
                    'scheduled_time',
                    'scheduled_end_time',
                    'defense_mode',
                    'defense_venue',
                    'panels_assigned_at',
                    'defense_adviser',
                    'adviser_reviewed_at',
                    'defense_chairperson',
                    'defense_panelist1',
                    'defense_panelist2',
                    'defense_panelist3',
                    'defense_panelist4',
                    'coordinator_status',
                    'amount',
                    'reference_no',
                ])->map(function ($r) {
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
                        ->map(function ($panelistIdOrName) {
                            // Try to resolve by ID first
                            if (is_numeric($panelistIdOrName)) {
                                $p = \App\Models\Panelist::find($panelistIdOrName);
                                if ($p)
                                    return ['id' => $p->id, 'name' => $p->name];
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
                        // ADD THESE TWO FIELDS:
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
                $pendingCount = collect($rows)->where('normalized_status', 'Pending')->count();
                return response()->json([
                    'defenseRequests' => $rows,
                    'pendingCount' => $pendingCount,
                ]);
            }

            return inertia('coordinator/submissions/defense-request/Index', [
                'defenseRequests' => $rows,
                'filters' => [
                    'search' => $request->input('search', '')
                ]
            ]);
        }

        // Student view
        $requirements = DefenseRequest::where('submitted_by', $user->id)
            ->where('workflow_state', '!=', 'cancelled')
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', '!=', 'Cancelled');
            })
            ->orderByDesc('created_at')
            ->get();

        $terminal = ['cancelled', 'adviser-rejected', 'coordinator-rejected', 'completed'];
        $active = $requirements->first(fn($r) => !in_array($r->workflow_state, $terminal));
        $defenseRequest = $active ?: $requirements->first();

        if ($request->expectsJson()) {
            $list = $requirements->map(function ($r) {
                return [
                    'id' => $r->id,
                    'thesis_title' => $r->thesis_title,
                    'status' => $r->status ?? 'Pending',
                    'workflow_state' => $r->workflow_state,
                    'priority' => $r->priority,
                    'submitted_by' => $r->submitted_by,
                    'created_at' => $r->created_at?->toIso8601String(),
                    'scheduled_date' => $r->scheduled_date?->format('Y-m-d'),
                    'normalized_status' => $this->normalizeStatusForCoordinator($r),
                ];
            });

            return response()->json([
                'defenseRequests' => $list,
                'activeId' => $defenseRequest?->id,
                'count' => $list->count(),
            ]);
        }

        // Fallback (not the dashboard, separate page)
        return Inertia::render('student/submissions/defense-requirements/Index', [
            'defenseRequest' => $defenseRequest,
            'defenseRequests' => $requirements->map(fn($r) => [
                'id' => $r->id,
                'thesis_title' => $r->thesis_title,
                'status' => $r->status ?? 'Pending',
                'workflow_state' => $r->workflow_state,
                'created_at' => $r->created_at?->toIso8601String(),
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

        foreach (['advisersEndorsement', 'recEndorsement', 'proofOfPayment'] as $f) {
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
                'workflow_history' => [
                    [
                        'action' => 'submitted',
                        'timestamp' => now()->toISOString(),
                        'user_id' => Auth::id(),
                        'user_name' => null,
                        'from_state' => null,
                        'to_state' => 'submitted'
                    ]
                ]
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
                    'user_id' => $adviserUser->id,
                    'type' => 'defense-request',
                    'title' => 'New Defense Request',
                    'message' => "Review needed for {$defenseRequest->defense_type} request ({$defenseRequest->thesis_title}).",
                    'link' => url("/defense-request/{$defenseRequest->id}")
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
                    'success' => true,
                    'id' => $defenseRequest->id,
                    'workflow_state' => $defenseRequest->workflow_state
                ], 201);
            }
            return Redirect::back()->with('success', 'Defense request submitted.');
        } catch (\Throwable $e) {
            DB::rollBack();
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
            }
            return Redirect::back()->with('error', 'Submission failed: ' . $e->getMessage());
        }
    }




    /** Coordinator approve / reject */
    public function coordinatorDecision(Request $request, DefenseRequest $defenseRequest)
    {
        $user = Auth::user();
        if (!$user)
            abort(401);
        if (!in_array($user->role, ['Coordinator', 'Administrative Assistant', 'Dean'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
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
            'comment' => 'nullable|string|max:3000'
        ]);
        $comment = $data['comment'] ?? null;

        $allowedCurrent = ['adviser-approved', 'coordinator-review'];
        $current = $defenseRequest->workflow_state;
        if (!in_array($current, $allowedCurrent)) {
            return response()->json([
                'error' => "Cannot act in state '{$current}'"
            ], 422);
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
                $h['comment'] = $h['comment'] ?? null;
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
                'ok' => true,
                'workflow_state' => $defenseRequest->workflow_state,
                'status' => $defenseRequest->status,
                'coordinator_comments' => $defenseRequest->coordinator_comments,
                'adviser_comments' => $defenseRequest->adviser_comments,
                'workflow_history' => $defenseRequest->workflow_history
            ]);
        } catch (\Throwable $e) {
            Log::error('coordinatorDecision error', [
                'id' => $defenseRequest->id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => app()->environment('local') ? $e->getMessage() : 'Internal error'], 500);
        }
    }

    /** Lightweight API for polling */
    public function apiShow(DefenseRequest $defenseRequest)
    {
        $user = Auth::user();
        if (!$user)
            abort(401);

        return response()->json([
            'id' => $defenseRequest->id,
            'first_name' => $defenseRequest->first_name,
            'middle_name' => $defenseRequest->middle_name,
            'last_name' => $defenseRequest->last_name,
            'thesis_title' => $defenseRequest->thesis_title,
            'school_id' => $defenseRequest->school_id,
            'program' => $defenseRequest->program,
            'defense_type' => $defenseRequest->defense_type,
            'priority' => $defenseRequest->priority,
            'status' => $defenseRequest->status,
            'workflow_state' => $defenseRequest->workflow_state,
            'workflow_state_display' => $defenseRequest->workflow_state_display ?? null,
            'adviser_status' => $defenseRequest->adviser_status,
            'coordinator_status' => $defenseRequest->coordinator_status,
            'adviser_comments' => $defenseRequest->adviser_comments,
            'coordinator_comments' => $defenseRequest->coordinator_comments,
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
            'panels_assigned_at' => $defenseRequest->panels_assigned_at,
            'submitted_at' => $defenseRequest->submitted_at?->toISOString(),
            'workflow_history' => $defenseRequest->workflow_history,
            'last_status_updated_by' => $defenseRequest->last_status_updated_by,
            'last_status_updated_at' => $defenseRequest->last_status_updated_at?->toISOString(),
            'advisers_endorsement' => $defenseRequest->advisers_endorsement,
            'rec_endorsement' => $defenseRequest->rec_endorsement,
            'proof_of_payment' => $defenseRequest->proof_of_payment,
            'reference_no' => $defenseRequest->reference_no,
            'manuscript_proposal' => $defenseRequest->manuscript_proposal,
            'similarity_index' => $defenseRequest->similarity_index,
            'avisee_adviser_attachment' => $defenseRequest->avisee_adviser_attachment,
            'ai_detection_certificate' => $defenseRequest->ai_detection_certificate,
            'endorsement_form' => $defenseRequest->endorsement_form,
            'coordinator_status_display' => $defenseRequest->coordinator_status_display,
            'amount' => $defenseRequest->amount,
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
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $coordinatorRoles = ['Coordinator', 'Administrative Assistant', 'Dean'];
        if (!in_array($user->role, $coordinatorRoles)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'decision' => 'required|in:approve,reject,retrieve',
            'comment' => 'nullable|string|max:3000',
            'send_email' => 'sometimes|boolean',
        ]);

        $decision = $data['decision'];
        $comment = $data['comment'] ?? null;
        $sendEmail = $data['send_email'] ?? false;
        $originalState = $defenseRequest->workflow_state;

        DB::beginTransaction();

        if ($decision === 'approve') {
            // Check required fields
            $missingFields = [];
            
            if (empty($defenseRequest->scheduled_date)) {
                $missingFields[] = 'Defense Date';
            }
            if (empty($defenseRequest->scheduled_time)) {
                $missingFields[] = 'Defense Start Time';
            }
            if (empty($defenseRequest->scheduled_end_time)) {
                $missingFields[] = 'Defense End Time';
            }
            if (empty($defenseRequest->defense_mode)) {
                $missingFields[] = 'Defense Mode';
            }
            if (empty($defenseRequest->defense_venue)) {
                $missingFields[] = 'Defense Venue';
            }
            
            // Check panels
            $panelCount = collect([
                $defenseRequest->defense_chairperson,
                $defenseRequest->defense_panelist1,
                $defenseRequest->defense_panelist2,
                $defenseRequest->defense_panelist3,
                $defenseRequest->defense_panelist4,
            ])->filter()->count();
            
            if ($panelCount === 0) {
                $missingFields[] = 'Panel Members (at least one required)';
            }

            if (!empty($missingFields)) {
                DB::rollBack();
                return response()->json([
                    'error' => 'Cannot approve. Missing required fields.',
                    'missing_fields' => $missingFields
                ], 422);
            }

            // Approve
            $defenseRequest->coordinator_status = 'Approved';
            $defenseRequest->workflow_state = 'coordinator-approved';
            $defenseRequest->status = 'Approved';
            $defenseRequest->coordinator_reviewed_at = now();
            $defenseRequest->coordinator_reviewed_by = $user->id;
            
            $historyEntry = [
                'action' => 'coordinator-approved',
                'coordinator_status' => 'Approved',
                'timestamp' => now()->toISOString(),
                'user_id' => $user->id,
                'user_name' => $user->first_name . ' ' . $user->last_name,
                'from_state' => $originalState,
                'to_state' => 'coordinator-approved',
                'comment' => $comment
            ];

        } elseif ($decision === 'reject') {
            $defenseRequest->coordinator_status = 'Rejected';
            $defenseRequest->workflow_state = 'coordinator-rejected';
            $defenseRequest->status = 'Rejected';
            $defenseRequest->coordinator_reviewed_at = now();
            $defenseRequest->coordinator_reviewed_by = $user->id;
            
            $historyEntry = [
                'action' => 'coordinator-rejected',
                'coordinator_status' => 'Rejected',
                'timestamp' => now()->toISOString(),
                'user_id' => $user->id,
                'user_name' => $user->first_name . ' ' . $user->last_name,
                'from_state' => $originalState,
                'to_state' => 'coordinator-rejected',
                'comment' => $comment
            ];

        } else { // retrieve
            $defenseRequest->coordinator_status = 'Pending';
            $defenseRequest->workflow_state = 'coordinator-review';
            $defenseRequest->status = 'Pending';
            
            $historyEntry = [
                'action' => 'retrieved',
                'coordinator_status' => 'Pending',
                'timestamp' => now()->toISOString(),
                'user_id' => $user->id,
                'user_name' => $user->first_name . ' ' . $user->last_name,
                'from_state' => $originalState,
                'to_state' => 'coordinator-review',
                'comment' => $comment
            ];
        }

        $defenseRequest->last_status_updated_at = now();
        $defenseRequest->last_status_updated_by = $user->id;

        // Add workflow history
        $hist = $defenseRequest->workflow_history ?? [];
        $hist[] = $historyEntry;
        $defenseRequest->workflow_history = $hist;

        $defenseRequest->save();

        // Send emails if requested and approved
        if ($sendEmail && $decision === 'approve') {
            try {
                $student = $defenseRequest->user;
                if ($student && $student->email) {
                    Mail::to($student->email)->send(new DefenseRequestApproved($defenseRequest));
                }
            } catch (\Exception $e) {
                Log::error('Email sending failed', ['error' => $e->getMessage()]);
            }
        }

        DB::commit();

        Log::info('updateStatus success', [
            'defense_id' => $defenseRequest->id,
            'decision' => $decision,
            'workflow_state' => $defenseRequest->workflow_state
        ]);

        return response()->json([
            'ok' => true,
            'request' => $defenseRequest->fresh(),
            'workflow_history' => $defenseRequest->workflow_history,
            'workflow_state' => $defenseRequest->workflow_state,
            'status' => $defenseRequest->status,
            'coordinator_status' => $defenseRequest->coordinator_status,
        ]);

    } catch (\Throwable $e) {
        DB::rollBack();
        Log::error('updateStatus error', [
            'defense_id' => $defenseRequest->id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json([
            'error' => 'Failed to update status: ' . $e->getMessage()
        ], 500);
    }
}


    /** Adviser approve / reject (no status mutation on reject) */
    public function adviserDecision(Request $request, DefenseRequest $defenseRequest)
    {
        try {
            Log::info('updateStatus called', [
                'defense_id' => $defenseRequest->id,
                'request_data' => $request->all()
            ]);

            $user = Auth::user();
            if (!$user) {
                Log::warning('updateStatus: Unauthorized - no user');
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $coordinatorRoles = ['Coordinator', 'Administrative Assistant', 'Dean'];
            if (!in_array($user->role, $coordinatorRoles)) {
                Log::warning('updateStatus: Forbidden', ['user_role' => $user->role]);
                return response()->json(['error' => 'Forbidden'], 403);
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

            // If approving, optionally save panels/schedule first (atomic)
            if ($target === 'Approved') {
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
                    foreach (['scheduled_date', 'scheduled_time', 'scheduled_end_time', 'defense_mode', 'defense_venue'] as $f) {
                        if (!empty($sched[$f])) {
                            $scheduleToValidate[$f] = $sched[$f];
                        } elseif (!empty($defenseRequest->{$f})) {
                            // Use existing value from database
                            $scheduleToValidate[$f] = $defenseRequest->{$f};
                        }
                    }

                    // Check completeness - all required fields must have values (either new or existing)
                    $missing = [];
                    foreach (['scheduled_date', 'scheduled_time', 'scheduled_end_time', 'defense_mode', 'defense_venue'] as $f) {
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
                        return response()->json(['error' => 'Missing schedule fields', 'missing' => $missing], 422);
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
                        return response()->json(['error' => 'Scheduling conflicts detected', 'conflicts' => $conflicts], 422);
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
            Log::error('updateStatus error', [
                'id' => $defenseRequest->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Update failed'], 500);
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
                    $panelMembers[] = (object) [
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
                Mail::to($student->email)->send(new DefenseScheduled(
                    $defenseRequest,
                    $student
                ));
                Log::info('Student email sent');
                // Add delay to respect Resend's rate limit (2 requests/second)
                usleep(500000); // 500ms delay
            } else {
                Log::warning('Student email skipped', [
                    'has_student' => !!$student,
                    'has_email' => $student?->email
                ]);
            }

            // Send email to adviser
            if ($adviser && $adviser->email) {
                Log::info('Sending email to adviser', ['email' => $adviser->email]);
                Mail::to($adviser->email)->send(new DefenseScheduled(
                    $defenseRequest,
                    $adviser
                ));
                Log::info('Adviser email sent');
                // Add delay to respect Resend's rate limit (2 requests/second)
                usleep(500000); // 500ms delay
            } else {
                Log::warning('Adviser email skipped', [
                    'has_adviser' => !!$adviser,
                    'has_email' => $adviser?->email
                ]);
            }

            // Send email to each panel member
            // Add delay between sends to respect Resend's rate limit (2 requests/second)
            foreach ($panelMembers as $index => $member) {
                if ($member && $member->email) {
                    // Add 500ms delay between emails (except for the first one)
                    if ($index > 0) {
                        usleep(500000); // 500ms = 0.5 seconds
                    }

                    Log::info('Sending email to panel member', [
                        'user_id' => $member->id,
                        'email' => $member->email
                    ]);
                    Mail::to($member->email)->send(new DefenseScheduled(
                        $defenseRequest,
                        $member
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
        if (!$user)
            return response()->json(['error' => 'Unauthorized'], 401);
        $coordinatorRoles = ['Coordinator', 'Administrative Assistant', 'Dean'];
        if (!in_array($user->role, $coordinatorRoles)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'priority' => 'required|in:Low,Medium,High'
        ]);

        $defenseRequest->priority = $data['priority'];
        $defenseRequest->last_status_updated_at = now();
        $defenseRequest->last_status_updated_by = $user->id;
        $defenseRequest->save();

        return response()->json([
            'ok' => true,
            'id' => $defenseRequest->id,
            'priority' => $defenseRequest->priority
        ]);
    }

    public function bulkUpdateStatus(Request $request)
    {
        $user = Auth::user();
        if (!$user)
            return response()->json(['error' => 'Unauthorized'], 401);
        $coordinatorRoles = ['Coordinator', 'Administrative Assistant', 'Dean'];
        if (!in_array($user->role, $coordinatorRoles)) {
            return response()->json(['error' => 'Forbidden'], 403);
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
                if (!$dr)
                    continue;
                $fakeReq = new Request(['status' => $data['status']]);
                // Delegate to adviserDecision which contains the status update logic;
                // call it and ignore the JSON response, but catch errors so bulk operation continues.
                try {
                    $this->adviserDecision($fakeReq, $dr);
                } catch (\Throwable $e) {
                    Log::error('bulkUpdateStatus: adviserDecision failed', [
                        'id' => $id,
                        'error' => $e->getMessage()
                    ]);
                    continue;
                }
                $updated[] = $id;
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('bulkUpdateStatus error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Bulk status update failed'], 500);
        }

        return response()->json([
            'ok' => true,
            'updated_ids' => $updated,
            'status' => $data['status']
        ]);
    }

    public function bulkUpdatePriority(Request $request)
    {
        $user = Auth::user();
        if (!$user)
            return response()->json(['error' => 'Unauthorized'], 401);
        $coordinatorRoles = ['Coordinator', 'Administrative Assistant', 'Dean'];
        if (!in_array($user->role, $coordinatorRoles)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:defense_requests,id',
            'priority' => 'required|in:Low,Medium,High'
        ]);

        DB::beginTransaction();
        try {
            DefenseRequest::whereIn('id', $data['ids'])->update([
                'priority' => $data['priority'],
                'last_status_updated_at' => now(),
                'last_status_updated_by' => $user->id
            ]);
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('bulkUpdatePriority error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Bulk priority update failed'], 500);
        }

        return response()->json([
            'ok' => true,
            'priority' => $data['priority'],
            'updated_ids' => $data['ids']
        ]);
    }

    /** Coordinator queue (JSON API) */
    public function coordinatorQueue(Request $request)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['Coordinator', 'Administrative Assistant', 'Dean'])) {
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
            $query->where(function ($q) use ($s) {
                $q->where('thesis_title', 'like', "%$s%")
                    ->orWhere('first_name', 'like', "%$s%")
                    ->orWhere('last_name', 'like', "%$s%")
                    ->orWhere('school_id', 'like', "%$s%");
            });
        }

        $rows = $query
            ->orderByRaw("FIELD(workflow_state,'adviser-approved','coordinator-review','coordinator-approved','panels-assigned','scheduled','completed','coordinator-rejected')")
            ->orderBy('adviser_reviewed_at', 'desc')
            ->limit(300)
            ->get([
                'id',
                'first_name',
                'middle_name',
                'last_name',
                'school_id',
                'program',
                'thesis_title',
                'defense_type',
                'status',
                'priority',
                'workflow_state',
                'scheduled_date',
                'defense_mode',
                'defense_venue',
                'panels_assigned_at'
            ])->map(function ($r) {
                return [
                    'id' => $r->id,
                    'first_name' => $r->first_name,
                    'last_name' => $r->last_name,
                    'program' => $r->program,
                    'thesis_title' => $r->thesis_title,
                    'defense_type' => $r->defense_type,
                    'priority' => $r->priority,
                    'workflow_state' => $r->workflow_state,
                    'status' => $r->status,
                    'scheduled_date' => $r->scheduled_date?->format('Y-m-d'),
                    'defense_mode' => $r->defense_mode,
                ];
            });

        return response()->json([
            'ok' => true,
            'items' => $rows
        ]);
    }

    /** Adviser queue (JSON): all requests assigned to / associated with this adviser needing or showing progress */
    public function adviserQueue(Request $request)
    {
        $user = $request->user();
        if (!$user)
            abort(401);
        if (!in_array($user->role, ['Faculty', 'Adviser'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $fullName = strtolower(trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')));

        $query = DefenseRequest::query()
            ->where(function ($q) use ($user, $fullName) {
                $q->where('adviser_user_id', $user->id)
                    ->orWhere('assigned_to_user_id', $user->id)
                    ->orWhereRaw('LOWER(defense_adviser) = ?', [$fullName]);
            })
            // Exclude cancelled workflow_state or status
            ->where('workflow_state', '!=', 'cancelled')
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', '!=', 'Cancelled');
            });

        if ($s = $request->input('search')) {
            $s = trim($s);
            $query->where(function ($q) use ($s) {
                $q->where('thesis_title', 'like', "%$s%")
                    ->orWhere('first_name', 'like', "%$s%")
                    ->orWhere('last_name', 'like', "%$s%")
                    ->orWhere('school_id', 'like', "%$s%");
            });
        }

        // Basic ordering: newest submissions first, but keep those awaiting adviser action on top
        $rows = $query
            ->orderByRaw("FIELD(workflow_state,'submitted','adviser-review','pending','adviser-pending') DESC")
            ->orderByDesc('created_at')
            ->limit(300)
            ->get([
                'id',
                'first_name',
                'last_name',
                'school_id',
                'program',
                'thesis_title',
                'defense_type',
                'priority',
                'workflow_state',
                'status',
                'created_at'
            ])->map(function ($r) {
                return [
                    'id' => $r->id,
                    'first_name' => $r->first_name,
                    'last_name' => $r->last_name,
                    'school_id' => $r->school_id,
                    'program' => $r->program,
                    'thesis_title' => $r->thesis_title,
                    'defense_type' => $r->defense_type,
                    'priority' => $r->priority,
                    'workflow_state' => $r->workflow_state,
                    'status' => $r->status ?? 'Pending',
                    'created_at' => $r->created_at?->toIso8601String(),
                ];
            });

        return response()->json([
            'ok' => true,
            'items' => $rows,
            'count' => $rows->count(),
            'pending_adviser_count' => $rows->filter(function ($r) {
                $wf = strtolower($r['workflow_state'] ?? '');
                return in_array($wf, ['', 'submitted', 'pending', 'adviser-pending', 'adviser-review']);
            })->count(),
        ]);
    }

    public function calendar(Request $request)
    {
        $user = Auth::user();
        if (!$user)
            abort(401);

        // Only show entries that are effectively approved AND have a scheduled date
        // (Status = Approved OR workflow_state in these states) AND scheduled_date not null.
        $approvedStates = ['coordinator-approved', 'panels-assigned', 'scheduled', 'completed'];

        $q = DefenseRequest::query()
            ->whereNotNull('scheduled_date')
            ->where(function ($qq) use ($approvedStates) {
                $qq->where('status', 'Approved')
                    ->orWhereIn('workflow_state', $approvedStates);
            });

        // Optional: limit to those visible to non-coordinators (e.g., a student only sees own)
        if (in_array($user->role, ['Student'])) {
            $q->where('submitted_by', $user->id);
        }

        if (in_array($user->role, ['Faculty', 'Adviser'])) {
            $full = strtolower(trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')));
            $q->where(function ($qq) use ($user, $full) {
                $qq->where('adviser_user_id', $user->id)
                    ->orWhere('assigned_to_user_id', $user->id)
                    ->orWhereRaw('LOWER(defense_adviser)=?', [$full]);
            });
        }

        $rows = $q->orderBy('scheduled_date')
            ->orderBy('scheduled_time')
            ->limit(500)
            ->get([
                'id',
                'thesis_title',
                'defense_type',
                'status',
                'workflow_state',
                'program',
                'school_id',
                'first_name',
                'last_name',
                'scheduled_date',
                'scheduled_time',
                'scheduled_end_time',
                'defense_mode',
                'defense_venue'
            ])->map(function ($r) {
                return [
                    'id' => $r->id,
                    'thesis_title' => $r->thesis_title,
                    'defense_type' => $r->defense_type,
                    'status' => $r->status ?? 'Approved',
                    'workflow_state' => $r->workflow_state,
                    'student_name' => trim($r->first_name . ' ' . $r->last_name),
                    'program' => $r->program,
                    'school_id' => $r->school_id,
                    // Frontend expects date_of_defense
                    'date_of_defense' => $r->scheduled_date?->format('Y-m-d'),
                    'start_time' => $r->scheduled_time,
                    'end_time' => $r->scheduled_end_time,
                    'defense_mode' => $r->defense_mode,
                    'defense_venue' => $r->defense_venue,
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
        return match ($r->workflow_state) {
            'adviser-rejected', 'coordinator-rejected' => 'Rejected',
            'coordinator-approved', 'scheduled', 'completed' => 'Approved',
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
            if (!$defenseRequest)
                continue;

            // Only allow if in correct state
            if (!in_array($defenseRequest->workflow_state, ['submitted', 'adviser-review', 'adviser-rejected']))
                continue;

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
                'action' => 'adviser-approved',
                'timestamp' => now()->toISOString(),
                'user_id' => $user->id,
                'user_name' => $user->first_name . ' ' . $user->last_name,
                'from_state' => $fromState,
                'to_state' => 'adviser-approved'
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
            if (!$defenseRequest)
                continue;

            // Only allow if in correct state
            if (!in_array($defenseRequest->workflow_state, ['submitted', 'adviser-review', 'adviser-approved']))
                continue;

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
            if (!$defenseRequest)
                continue;

            // Only allow if in correct state
            if (!in_array($defenseRequest->workflow_state, ['adviser-approved', 'adviser-rejected']))
                continue;

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
            ]);

            \Log::info('updateAdviserStatus: Validation passed', ['data' => $data]);

            $fromState = $defenseRequest->workflow_state;
            $defenseRequest->adviser_status = $data['adviser_status'];

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
                    Notification::create([
                        'user_id' => $defenseRequest->coordinator_user_id,
                        'type' => 'defense_endorsed',
                        'title' => 'Defense Request Endorsed by Adviser',
                        'message' => "{$user->first_name} {$user->last_name} has endorsed the defense request for {$defenseRequest->first_name} {$defenseRequest->last_name} - \"{$defenseRequest->thesis_title}\".",
                        'action_url' => route('coordinator.defense-requests.details', $defenseRequest->id),
                    ]);
                    \Log::info('updateAdviserStatus: Coordinator notification created');
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

    public function allForCoordinator(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Coordinator', 'Administrative Assistant', 'Dean'])) {
            abort(403);
        }

        $defenseRequests = DefenseRequest::query()
            ->orderByDesc('created_at')
            ->get();

        // Map to summary format expected by frontend
        $result = $defenseRequests->map(function ($r) {
            return [
                'id' => $r->id,
                'first_name' => $r->first_name,
                'middle_name' => $r->middle_name,
                'last_name' => $r->last_name,
                'program' => $r->program,
                'thesis_title' => $r->thesis_title,
                'date_of_defense' => $r->scheduled_date ? $r->scheduled_date->format('Y-m-d') : null,
                'scheduled_date' => $r->scheduled_date ? $r->scheduled_date->format('Y-m-d') : null,
                'mode_defense' => $r->defense_mode,
                'defense_mode' => $r->defense_mode,
                'defense_type' => $r->defense_type,
                'status' => $r->status ?? 'Pending',
                'priority' => $r->priority ?? 'Medium',
                'last_status_updated_by' => $r->last_status_updated_by,
                'last_status_updated_at' => $r->last_status_updated_at,
                'workflow_state' => $r->workflow_state,
            ];
        });

        return response()->json($result);
    }

    public function savePanels(Request $request, DefenseRequest $defenseRequest)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Coordinator', 'Administrative Assistant', 'Dean'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
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
        try {
            // Check authorization
            $user = Auth::user();
            if (!$user) {
                Log::error('completeDefense: No authenticated user');
                return response()->json(['error' => 'Unauthorized - No user'], 401);
            }

            if (!in_array($user->role, ['Administrative Assistant', 'Dean', 'Coordinator'])) {
                Log::error('completeDefense: Unauthorized role', ['role' => $user->role]);
                return response()->json(['error' => 'Unauthorized - Invalid role'], 403);
            }

            Log::info('completeDefense: Starting', [
                'defense_id' => $defenseRequest->id,
                'user_id' => $user->id,
                'user_role' => $user->role
            ]);

            DB::beginTransaction();

            // Update defense request to completed
            $originalState = $defenseRequest->workflow_state;
            $defenseRequest->workflow_state = 'completed';
            $defenseRequest->coordinator_status = 'Approved';
            $defenseRequest->status = 'Completed';
            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = $user->id;

            // Add workflow history
            $hist = $defenseRequest->workflow_history ?? [];
            $hist[] = [
                'action' => 'marked-completed',
                'timestamp' => now()->toISOString(),
                'user_id' => $user->id,
                'user_name' => $user->first_name . ' ' . $user->last_name,
                'from_state' => $originalState,
                'to_state' => 'completed',
                'comment' => 'Defense marked as completed by ' . $user->first_name . ' ' . $user->last_name
            ];
            $defenseRequest->workflow_history = $hist;

            $defenseRequest->save();

            Log::info('completeDefense: Defense request updated', [
                'defense_id' => $defenseRequest->id,
                'new_status' => $defenseRequest->status,
                'new_workflow_state' => $defenseRequest->workflow_state
            ]);

            // 🎉 AUTOMATICALLY CREATE HONORARIUM PAYMENTS
            Log::info('completeDefense: Creating honorarium payments', [
                'defense_id' => $defenseRequest->id,
                'program' => $defenseRequest->program,
                'defense_type' => $defenseRequest->defense_type
            ]);

            // Get program level
            $programLevel = \App\Helpers\ProgramLevel::getLevel($defenseRequest->program);

            Log::info('completeDefense: Program level determined', [
                'program' => $defenseRequest->program,
                'program_level' => $programLevel
            ]);

            // Create payments for each committee member
            $members = [
                ['role' => 'Adviser', 'name' => $defenseRequest->defense_adviser],
                ['role' => 'Panel Chair', 'name' => $defenseRequest->defense_chairperson],
                ['role' => 'Panel Member 1', 'name' => $defenseRequest->defense_panelist1],
                ['role' => 'Panel Member 2', 'name' => $defenseRequest->defense_panelist2],
                ['role' => 'Panel Member 3', 'name' => $defenseRequest->defense_panelist3],
                ['role' => 'Panel Member 4', 'name' => $defenseRequest->defense_panelist4],
            ];

            $paymentsCreated = 0;
            foreach ($members as $member) {
                if (empty($member['name'])) {
                    Log::debug('completeDefense: Skipping empty member', ['role' => $member['role']]);
                    continue;
                }

                Log::info('completeDefense: Processing member', [
                    'role' => $member['role'],
                    'name' => $member['name']
                ]);

                // Get rate for this role
                $rate = \App\Models\PaymentRate::where('program_level', $programLevel)
                    ->where('defense_type', $defenseRequest->defense_type)
                    ->where('type', $member['role'])
                    ->first();

                if (!$rate) {
                    Log::warning('completeDefense: No payment rate found', [
                        'program_level' => $programLevel,
                        'defense_type' => $defenseRequest->defense_type,
                        'role' => $member['role']
                    ]);
                    continue;
                }

                Log::info('completeDefense: Rate found', [
                    'role' => $member['role'],
                    'amount' => $rate->amount
                ]);

                // Try to find panelist by name
                $panelist = \App\Models\Panelist::where('name', $member['name'])->first();

                // Create honorarium payment
                $payment = \App\Models\HonorariumPayment::create([
                    'defense_request_id' => $defenseRequest->id,
                    'panelist_id' => $panelist?->id,
                    'panelist_name' => $member['name'],
                    'role' => $member['role'],
                    'amount' => $rate->amount,
                    'payment_status' => 'pending',
                    'defense_date' => $defenseRequest->scheduled_date,
                    'student_name' => trim($defenseRequest->first_name . ' ' . $defenseRequest->last_name),
                    'program' => $defenseRequest->program,
                    'defense_type' => $defenseRequest->defense_type,
                ]);

                Log::info('completeDefense: Payment created', [
                    'payment_id' => $payment->id,
                    'role' => $member['role'],
                    'amount' => $rate->amount
                ]);

                $paymentsCreated++;
            }

            DB::commit();

            Log::info('completeDefense: Success', [
                'defense_id' => $defenseRequest->id,
                'payments_created' => $paymentsCreated
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Defense marked as completed and honorarium payments created.',
                'defense' => [
                    'id' => $defenseRequest->id,
                    'workflow_state' => $defenseRequest->workflow_state,
                    'status' => $defenseRequest->status,
                    'payments_count' => $paymentsCreated
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('completeDefense: Exception caught', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'defense_request_id' => $defenseRequest->id ?? null
            ]);

            return response()->json([
                'error' => 'Failed to mark defense as completed: ' . $e->getMessage()
            ], 500);
        }
    }
}
