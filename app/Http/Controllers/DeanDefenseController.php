<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Carbon\Carbon;

class DeanDefenseController extends Controller
{
    /**
     * Authorize dean access
     */
    private function authorizeDean(): void
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'Dean') {
            abort(403, 'Only the Dean can access this resource');
        }
    }

    /**
     * Display list of defense requests for dean review
     * Shows all coordinator-approved and scheduled defenses
     */
    public function index(Request $request)
    {
        $this->authorizeDean();
        
        $user = Auth::user();

        // Fetch all defense requests that are coordinator-approved and scheduled
        // These are ready for dean's final approval
        $defenseRequests = DefenseRequest::with(['user', 'adviserUser'])
            ->whereIn('workflow_state', [
                'coordinator-approved',
                'panels-assigned',
                'scheduled',
                'dean-review',
                'dean-approved'
            ])
            ->where('coordinator_status', 'Approved') // Only show coordinator-approved requests
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'first_name' => $r->first_name,
                    'middle_name' => $r->middle_name,
                    'last_name' => $r->last_name,
                    'program' => $r->program,
                    'thesis_title' => $r->thesis_title,
                    'defense_type' => $r->defense_type,
                    'scheduled_date' => $r->scheduled_date?->format('Y-m-d'),
                    'scheduled_time' => $r->scheduled_time,
                    'defense_mode' => $r->defense_mode,
                    'status' => $this->mapToReactStatus($r->workflow_state, $r->dean_status),
                    'coordinator_status' => $r->coordinator_status ?? 'Pending',
                    'dean_status' => $r->dean_status ?? 'Pending',
                    'aa_status' => optional($r->aaVerification)->status ?? 'pending',
                    'priority' => $r->priority ?? 'Medium',
                    'adviser' => $r->defense_adviser,
                ];
            });

        return Inertia::render('dean/defense-requests/Index', [
            'defenseRequests' => $defenseRequests,
            'user' => $user,
        ]);
    }

    /**
     * Get all defense requests as JSON for table
     */
    public function allDefenseRequests(Request $request)
    {
        $this->authorizeDean();

        $items = DefenseRequest::with(['user', 'adviserUser', 'aaVerification'])
            ->whereIn('workflow_state', [
                'coordinator-approved',
                'panels-assigned',
                'scheduled',
                'dean-review',
                'dean-approved'
            ])
            ->where('coordinator_status', 'Approved')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($r) => $this->mapDefenseRequestForList($r));

        return response()->json($items->values());
    }

    /**
     * Show defense request details for dean review
     */
    public function details($id)
    {
        $this->authorizeDean();
        
        $defenseRequest = DefenseRequest::with(['user', 'adviserUser', 'aaVerification'])
            ->findOrFail($id);

        // Compose panelists list manually
        $panelistFields = [
            $defenseRequest->defense_chairperson,
            $defenseRequest->defense_panelist1,
            $defenseRequest->defense_panelist2,
            $defenseRequest->defense_panelist3,
            $defenseRequest->defense_panelist4,
        ];
        
        $panelists = collect($panelistFields)
            ->filter()
            ->map(function ($panelistName) {
                $p = \App\Models\Panelist::where('name', $panelistName)->first();
                if ($p) {
                    return ['id' => $p->id, 'name' => $p->name, 'email' => $p->email ?? ''];
                }
                return ['id' => null, 'name' => $panelistName, 'email' => ''];
            })->values()->all();

        return Inertia::render('dean/defense-requests/details', [
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
                'submitted_at' => $defenseRequest->submitted_at?->format('Y-m-d H:i:s'),
                'panelists' => $panelists,
                'defense_adviser' => $defenseRequest->defense_adviser,
                'defense_chairperson' => $defenseRequest->defense_chairperson,
                'defense_panelist1' => $defenseRequest->defense_panelist1,
                'defense_panelist2' => $defenseRequest->defense_panelist2,
                'defense_panelist3' => $defenseRequest->defense_panelist3,
                'defense_panelist4' => $defenseRequest->defense_panelist4,
                'amount' => $defenseRequest->amount,
                'reference_no' => $defenseRequest->reference_no,
                'coordinator_status' => $defenseRequest->coordinator_status,
                'dean_status' => $defenseRequest->dean_status ?? 'Pending',
                'coordinator_signed_on_behalf' => $defenseRequest->coordinator_signed_on_behalf ?? false,
                'adviser_status' => $defenseRequest->adviser_status,
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
                'program_level' => \App\Helpers\ProgramLevel::getLevel($defenseRequest->program),
                'coordinator' => $defenseRequest->coordinator_user_id ? [
                    'id' => $defenseRequest->coordinator_user_id,
                    'name' => optional(User::find($defenseRequest->coordinator_user_id))->name,
                    'email' => optional(User::find($defenseRequest->coordinator_user_id))->email,
                ] : null,
                'aa_verification_status' => optional($defenseRequest->aaVerification)->status ?? 'pending',
                'aa_verification_id' => optional($defenseRequest->aaVerification)->id,
                'invalid_comment' => optional($defenseRequest->aaVerification)->invalid_comment,
            ],
            'userRole' => Auth::user()->role,
        ]);
    }

    /**
     * Generate preview PDF (without signature) for dean review
     */
    public function generatePreview(Request $request)
    {
        $this->authorizeDean();

        $defenseRequest = DefenseRequest::findOrFail($request->defense_request_id);

        // TODO: Implement PDF generation using existing document template system
        // This should generate the endorsement form WITHOUT any signature
        // Return PDF as download/blob
        
        Log::info('🎨 Dean preview generation requested', [
            'defense_request_id' => $defenseRequest->id,
            'user_id' => Auth::id()
        ]);

        // Placeholder: Return existing endorsement or generate new one
        return response()->json([
            'message' => 'Preview generation not yet implemented',
            'todo' => 'Implement PDF generation service'
        ], 501);
    }

    /**
     * Generate final document with signature
     */
    public function generateDocument(Request $request)
    {
        $this->authorizeDean();

        $validated = $request->validate([
            'defense_request_id' => 'required|exists:defense_requests,id',
            'use_coordinator_signature' => 'nullable|boolean',
            'dean_full_name' => 'nullable|string',
            'dean_title' => 'nullable|string',
            'coordinator_full_name' => 'nullable|string',
            'coordinator_title' => 'nullable|string',
        ]);

        $defenseRequest = DefenseRequest::findOrFail($validated['defense_request_id']);
        $useCoordinatorSignature = $validated['use_coordinator_signature'] ?? false;

        Log::info('📄 Dean document generation requested', [
            'defense_request_id' => $defenseRequest->id,
            'use_coordinator_signature' => $useCoordinatorSignature,
            'user_id' => Auth::id()
        ]);

        // TODO: Implement PDF generation with signature
        // If $useCoordinatorSignature is true:
        //   - Use coordinator's signature
        //   - Add delegation note: "Signed by [Coordinator Name] on behalf of the Dean"
        // Else:
        //   - Use dean's signature
        
        return response()->json([
            'message' => 'Document generation not yet implemented',
            'todo' => 'Implement PDF generation with signature embedding'
        ], 501);
    }

    /**
     * Approve defense request with dean signature
     */
    public function approve(Request $request, DefenseRequest $defenseRequest)
    {
        $this->authorizeDean();

        $validated = $request->validate([
            'send_email' => 'nullable|boolean',
            'use_coordinator_signature' => 'nullable|boolean',
            'coordinator_full_name' => 'nullable|string',
            'coordinator_title' => 'nullable|string',
            'dean_full_name' => 'nullable|string',
            'dean_title' => 'nullable|string',
            'endorsement_file' => 'required|file|mimes:pdf|max:10240', // 10MB max
        ]);

        $user = Auth::user();
        $sendEmail = $validated['send_email'] ?? false;
        $useCoordinatorSignature = $validated['use_coordinator_signature'] ?? false;

        try {
            DB::beginTransaction();

            Log::info('🚀 Dean approval process started', [
                'defense_request_id' => $defenseRequest->id,
                'dean_id' => $user->id,
                'use_coordinator_signature' => $useCoordinatorSignature,
                'send_email' => $sendEmail
            ]);

            // Store endorsement file
            if ($request->hasFile('endorsement_file')) {
                $file = $request->file('endorsement_file');
                $filename = 'dean_endorsement_' . $defenseRequest->id . '_' . time() . '.pdf';
                $path = $file->storeAs('endorsements', $filename, 'public');
                $defenseRequest->dean_endorsement_form = $path;
            }

            // Update dean approval status
            $defenseRequest->dean_status = 'Approved';
            $defenseRequest->dean_approved_by = $user->id;
            $defenseRequest->dean_approved_at = now();
            $defenseRequest->coordinator_signed_on_behalf = $useCoordinatorSignature;
            
            // Update workflow state
            $defenseRequest->workflow_state = 'dean-approved';
            
            // Add workflow entry
            $comment = $useCoordinatorSignature 
                ? "Approved by Dean (coordinator signature used on behalf)"
                : "Approved by Dean";
                
            $defenseRequest->addWorkflowEntry(
                'dean-approved',
                $comment,
                $user->id,
                $defenseRequest->workflow_state,
                'dean-approved'
            );

            $defenseRequest->save();

            // Send email notifications if requested
            if ($sendEmail) {
                $this->sendApprovalNotifications($defenseRequest);
            }

            DB::commit();

            Log::info('✅ Dean approval successful', [
                'defense_request_id' => $defenseRequest->id,
                'emails_sent' => $sendEmail
            ]);

            return response()->json([
                'ok' => true,
                'message' => 'Defense request approved successfully',
                'request' => $this->mapForDetails($defenseRequest)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('❌ Dean approval failed', [
                'defense_request_id' => $defenseRequest->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to approve defense request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send approval notification emails to all parties
     */
    private function sendApprovalNotifications(DefenseRequest $defenseRequest)
    {
        Log::info('📧 Sending dean approval notifications', [
            'defense_request_id' => $defenseRequest->id
        ]);

        // 1. Notify student
        if ($defenseRequest->submitted_by) {
            $student = User::find($defenseRequest->submitted_by);
            if ($student && $student->email) {
                Mail::to($student->email)
                    ->queue(new \App\Mail\DefenseScheduledStudent($defenseRequest));
                Log::info('✉️ Email sent to student', ['email' => $student->email]);
            }
        }

        // 2. Notify adviser
        if ($defenseRequest->adviser_user_id) {
            $adviser = User::find($defenseRequest->adviser_user_id);
            if ($adviser && $adviser->email) {
                Mail::to($adviser->email)
                    ->queue(new \App\Mail\DefenseScheduledAdviser($defenseRequest));
                Log::info('✉️ Email sent to adviser', ['email' => $adviser->email]);
            }
        }

        // 3. Notify panel members
        $panelMembers = array_filter([
            $defenseRequest->defense_chairperson,
            $defenseRequest->defense_panelist1,
            $defenseRequest->defense_panelist2,
            $defenseRequest->defense_panelist3,
            $defenseRequest->defense_panelist4,
        ]);

        foreach ($panelMembers as $panelMemberName) {
            $panelUser = User::where(function ($q) use ($panelMemberName) {
                $parts = preg_split('/\s+/', trim($panelMemberName));
                if (count($parts) >= 2) {
                    $q->where('first_name', 'LIKE', '%' . $parts[0] . '%')
                      ->where('last_name', 'LIKE', '%' . end($parts) . '%');
                } else {
                    $q->where('first_name', 'LIKE', '%' . $panelMemberName . '%')
                      ->orWhere('last_name', 'LIKE', '%' . $panelMemberName . '%');
                }
            })->first();

            if ($panelUser && $panelUser->email) {
                Mail::to($panelUser->email)
                    ->queue(new \App\Mail\DefensePanelInvitation(
                        $defenseRequest,
                        $panelUser,
                        'Panel Member'
                    ));
                Log::info('✉️ Email sent to panel member', ['email' => $panelUser->email]);
            }
        }
    }

    /**
     * Map defense request for list display
     */
    private function mapDefenseRequestForList(DefenseRequest $r): array
    {
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
            'status' => $this->mapToReactStatus($r->workflow_state, $r->dean_status),
            'workflow_state' => $r->workflow_state,
            'priority' => $r->priority,
            'adviser' => $r->defense_adviser,
            'submitted_at' => $r->submitted_at?->format('Y-m-d H:i:s'),
            'coordinator_status' => $r->coordinator_status ?? 'Pending',
            'dean_status' => $r->dean_status ?? 'Pending',
            'aa_status' => optional($r->aaVerification)->status ?? 'pending',
            'last_status_updated_by' => $r->lastStatusUpdater?->name,
            'last_status_updated_at' => $r->last_status_updated_at?->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Map for details display
     */
    private function mapForDetails(DefenseRequest $r): array
    {
        return [
            'id' => $r->id,
            'workflow_state' => $r->workflow_state,
            'dean_status' => $r->dean_status,
            'coordinator_status' => $r->coordinator_status,
            'coordinator_signed_on_behalf' => $r->coordinator_signed_on_behalf,
        ];
    }

    /**
     * Map workflow state to React-friendly status
     */
    private function mapToReactStatus($workflowState, $deanStatus = null)
    {
        // If dean has reviewed, use dean status
        if ($deanStatus === 'Approved') return 'Approved';
        if ($deanStatus === 'Rejected') return 'Rejected';

        // Otherwise, pending dean review
        if (in_array($workflowState, [
            'coordinator-approved',
            'panels-assigned',
            'scheduled',
            'dean-review'
        ])) {
            return 'Pending';
        }

        return 'Pending';
    }
}
