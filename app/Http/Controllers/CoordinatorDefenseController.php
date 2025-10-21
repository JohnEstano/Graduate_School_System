<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Helpers\ProgramLevel;

class CoordinatorDefenseController extends Controller
{
    /**
     * Show details page for a defense request (Coordinator view)
     */
    public function details($id)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Coordinator', 'Administrative Assistant', 'Dean'])) {
            abort(403, 'Unauthorized');
        }

        $defenseRequest = DefenseRequest::findOrFail($id);

        // Calculate program level (FOR TESTING: Maps Bachelors to Masteral)
        $programLevel = ProgramLevel::getLevel($defenseRequest->program);

        // Get coordinator info
        $coordinatorInfo = null;
        if ($defenseRequest->coordinator_user_id) {
            $coord = User::find($defenseRequest->coordinator_user_id);
            if ($coord) {
                $coordinatorInfo = [
                    'id' => $coord->id,
                    'name' => trim($coord->first_name . ' ' . ($coord->middle_name ? $coord->middle_name . ' ' : '') . $coord->last_name),
                    'email' => $coord->email,
                ];
            }
        }

        return Inertia::render('coordinator/submissions/defense-request/details', [
            'defenseRequest' => [
                'id' => $defenseRequest->id,
                'first_name' => $defenseRequest->first_name,
                'middle_name' => $defenseRequest->middle_name,
                'last_name' => $defenseRequest->last_name,
                'school_id' => $defenseRequest->school_id,
                'program' => $defenseRequest->program,
                'program_level' => $programLevel, // "Masteral" for Bachelors, "Doctorate" for PhD
                'thesis_title' => $defenseRequest->thesis_title,
                'defense_type' => $defenseRequest->defense_type,
                'status' => $defenseRequest->status,
                'priority' => $defenseRequest->priority,
                'workflow_state' => $defenseRequest->workflow_state,
                'defense_adviser' => $defenseRequest->defense_adviser,
                'defense_chairperson' => $defenseRequest->defense_chairperson,
                'defense_panelist1' => $defenseRequest->defense_panelist1,
                'defense_panelist2' => $defenseRequest->defense_panelist2,
                'defense_panelist3' => $defenseRequest->defense_panelist3,
                'defense_panelist4' => $defenseRequest->defense_panelist4,
                'scheduled_date' => $defenseRequest->scheduled_date?->format('Y-m-d'),
                'scheduled_time' => $defenseRequest->scheduled_time,
                'scheduled_end_time' => $defenseRequest->scheduled_end_time,
                'defense_mode' => $defenseRequest->defense_mode,
                'defense_venue' => $defenseRequest->defense_venue,
                'scheduling_notes' => $defenseRequest->scheduling_notes,
                'advisers_endorsement' => $defenseRequest->advisers_endorsement,
                'rec_endorsement' => $defenseRequest->rec_endorsement,
                'proof_of_payment' => $defenseRequest->proof_of_payment,
                'reference_no' => $defenseRequest->reference_no,
                'endorsement_form' => $defenseRequest->endorsement_form,
                'manuscript_proposal' => $defenseRequest->manuscript_proposal,
                'similarity_index' => $defenseRequest->similarity_index,
                'avisee_adviser_attachment' => $defenseRequest->avisee_adviser_attachment,
                'ai_detection_certificate' => $defenseRequest->ai_detection_certificate,
                'last_status_updated_by' => $defenseRequest->last_status_updated_by,
                'last_status_updated_at' => $defenseRequest->last_status_updated_at?->format('Y-m-d H:i:s'),
                'workflow_history' => $defenseRequest->workflow_history ?? [],
                'adviser_status' => $defenseRequest->adviser_status,
                'coordinator_status' => $defenseRequest->coordinator_status,
                'submitted_at' => $defenseRequest->submitted_at?->format('Y-m-d H:i:s'),
                'coordinator' => $coordinatorInfo, // Coordinator name & email
            ],
            'userRole' => $user->role,
        ]);
    }

    /**
     * Assign or update panels for a defense request
     * UPDATED: Handles both initial assignment and re-assignment (editing)
     */
    public function assignPanelsJson(Request $request, DefenseRequest $defenseRequest)
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
        $wasAlreadyAssigned = !empty($defenseRequest->panels_assigned_at);

        DB::beginTransaction();
        try {
            // Save panel assignments
            $defenseRequest->defense_chairperson = $data['defense_chairperson'] ?? null;
            $defenseRequest->defense_panelist1 = $data['defense_panelist1'] ?? null;
            $defenseRequest->defense_panelist2 = $data['defense_panelist2'] ?? null;
            $defenseRequest->defense_panelist3 = $data['defense_panelist3'] ?? null;
            $defenseRequest->defense_panelist4 = $data['defense_panelist4'] ?? null;
            
            // Set assignment metadata
            if (!$wasAlreadyAssigned) {
                $defenseRequest->panels_assigned_at = now();
                $defenseRequest->panels_assigned_by = $user->id;
            }

            // Update workflow state to 'panels-assigned' if not already
            if ($defenseRequest->workflow_state !== 'panels-assigned' 
                && $defenseRequest->workflow_state !== 'scheduled' 
                && $defenseRequest->workflow_state !== 'coordinator-approved') {
                $defenseRequest->workflow_state = 'panels-assigned';
            }

            // Add workflow history entry
            if ($wasAlreadyAssigned) {
                // This is an edit/re-assignment
                $defenseRequest->addWorkflowEntry(
                    'panels-updated',
                    'Panels updated by ' . $user->name,
                    $user->id,
                    $originalState,
                    $defenseRequest->workflow_state
                );
            } else {
                // This is initial assignment
                $defenseRequest->addWorkflowEntry(
                    'panels-assigned',
                    'Panels assigned by ' . $user->name,
                    $user->id,
                    $originalState,
                    'panels-assigned'
                );
            }

            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = $user->id;
            $defenseRequest->save();

            DB::commit();

            Log::info($wasAlreadyAssigned ? 'Panels updated' : 'Panels assigned', [
                'defense_id' => $defenseRequest->id,
                'user_id' => $user->id,
                'workflow_state' => $defenseRequest->workflow_state,
            ]);

            return response()->json([
                'ok' => true,
                'request' => $defenseRequest,
                'workflow_state' => $defenseRequest->workflow_state,
                'workflow_history' => $defenseRequest->workflow_history,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error assigning/updating panels', [
                'error' => $e->getMessage(),
                'defense_id' => $defenseRequest->id
            ]);
            return response()->json(['error' => 'Failed to assign panels'], 500);
        }
    }

    /**
     * Schedule or update schedule for a defense
     * UPDATED: Handles both initial scheduling and re-scheduling (editing)
     */
    public function scheduleDefenseJson(Request $request, DefenseRequest $defenseRequest)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['Coordinator', 'Administrative Assistant', 'Dean'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'required|date_format:H:i',
            'scheduled_end_time' => 'required|date_format:H:i',
            'defense_mode' => 'required|in:face-to-face,online',
            'defense_venue' => 'required|string',
            'scheduling_notes' => 'nullable|string',
        ]);

        // Validate times
        $start = strtotime($data['scheduled_time']);
        $end = strtotime($data['scheduled_end_time']);
        if ($end <= $start) {
            return response()->json(['error' => 'End time must be after start time'], 422);
        }

        $originalState = $defenseRequest->workflow_state;
        $wasAlreadyScheduled = !empty($defenseRequest->schedule_set_at);

        DB::beginTransaction();
        try {
            // Save schedule
            $defenseRequest->scheduled_date = $data['scheduled_date'];
            $defenseRequest->scheduled_time = $data['scheduled_time'];
            $defenseRequest->scheduled_end_time = $data['scheduled_end_time'];
            $defenseRequest->defense_mode = $data['defense_mode'];
            $defenseRequest->defense_venue = $data['defense_venue'];
            $defenseRequest->scheduling_notes = $data['scheduling_notes'] ?? null;
            
            // Set scheduling metadata
            if (!$wasAlreadyScheduled) {
                $defenseRequest->schedule_set_at = now();
                $defenseRequest->schedule_set_by = $user->id;
            }

            // Update workflow state to 'scheduled' if not already approved/completed
            if ($defenseRequest->workflow_state !== 'scheduled' 
                && $defenseRequest->workflow_state !== 'coordinator-approved' 
                && $defenseRequest->workflow_state !== 'completed') {
                $defenseRequest->workflow_state = 'scheduled';
            }

            // Add workflow history entry
            if ($wasAlreadyScheduled) {
                // This is a re-schedule/edit
                $defenseRequest->addWorkflowEntry(
                    'schedule-updated',
                    'Schedule updated by ' . $user->name . ($data['scheduling_notes'] ? ': ' . $data['scheduling_notes'] : ''),
                    $user->id,
                    $originalState,
                    $defenseRequest->workflow_state
                );
            } else {
                // This is initial scheduling
                $defenseRequest->addWorkflowEntry(
                    'scheduled',
                    $data['scheduling_notes'],
                    $user->id,
                    $originalState,
                    'scheduled'
                );
            }

            $defenseRequest->last_status_updated_at = now();
            $defenseRequest->last_status_updated_by = $user->id;
            $defenseRequest->save();

            DB::commit();

            Log::info($wasAlreadyScheduled ? 'Schedule updated' : 'Defense scheduled', [
                'defense_id' => $defenseRequest->id,
                'scheduled_date' => $data['scheduled_date'],
                'scheduled_time' => $data['scheduled_time'],
                'workflow_state' => $defenseRequest->workflow_state,
            ]);

            return response()->json([
                'ok' => true,
                'request' => $defenseRequest,
                'workflow_state' => $defenseRequest->workflow_state,
                'workflow_history' => $defenseRequest->workflow_history,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error scheduling/updating defense', [
                'error' => $e->getMessage(),
                'defense_id' => $defenseRequest->id
            ]);
            return response()->json(['error' => 'Failed to schedule defense'], 500);
        }
    }

    /**
     * Get all panel members (faculty + panelists)
     */
    public function panelMembersAll()
    {
        $faculty = User::where('role', 'Faculty')
            ->select('id', 'first_name', 'middle_name', 'last_name', 'email')
            ->get()
            ->map(fn($u) => [
                'id' => 'faculty-' . $u->id,
                'name' => trim($u->first_name . ' ' . ($u->middle_name ?? '') . ' ' . $u->last_name),
                'email' => $u->email,
                'type' => 'Faculty',
                'status' => 'Available',
            ]);

        $panelists = \App\Models\Panelist::select('id', 'name', 'email', 'role', 'status')
            ->get()
            ->map(fn($p) => [
                'id' => 'panelist-' . $p->id,
                'name' => $p->name,
                'email' => $p->email ?? '',
                'type' => $p->role ?? 'Panelist',
                'status' => $p->status ?? 'Available',
            ]);

        return response()->json($faculty->merge($panelists)->values());
    }
}