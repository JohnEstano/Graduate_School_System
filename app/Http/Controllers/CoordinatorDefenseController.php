<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use App\Models\User;
use App\Models\Notification;
use App\Services\DefenseNotificationService;
use App\Services\DefenseConflictService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class CoordinatorDefenseController extends Controller
{
    /**
     * Display the coordinator defense management dashboard
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Ensure user is authorized (Coordinator, Administrative Assistant, or Dean)
        $coordinatorRoles = ['Coordinator', 'Administrative Assistant', 'Dean'];
        if (!in_array($user->role, $coordinatorRoles)) {
            abort(403, 'Unauthorized access to coordinator dashboard');
        }

        // Get approved defense requests that need scheduling
        $defenseRequests = DefenseRequest::with([
            'user', 'adviserUser', 'panelsAssignedBy', 'scheduleSetBy'
        ])
        ->whereIn('workflow_state', ['adviser-approved', 'coordinator-review', 'coordinator-approved', 'scheduled'])
        ->orderBy('adviser_reviewed_at', 'desc')
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($request) {
            return [
                'id' => $request->id,
                'student_name' => $request->first_name . ' ' . $request->last_name,
                'school_id' => $request->school_id,
                'program' => $request->program,
                'thesis_title' => $request->thesis_title,
                'defense_type' => $request->defense_type,
                'adviser' => $request->defense_adviser,
                'workflow_state' => $request->workflow_state,
                'workflow_state_display' => $request->workflow_state_display,
                'scheduling_status' => $request->scheduling_status,
                'formatted_schedule' => $request->formatted_schedule,
                'panels_list' => $request->panels_list,
                'defense_chairperson' => $request->defense_chairperson,
                'defense_panelist1' => $request->defense_panelist1,
                'defense_panelist2' => $request->defense_panelist2,
                'defense_panelist3' => $request->defense_panelist3,
                'defense_panelist4' => $request->defense_panelist4,
                'scheduled_date' => $request->scheduled_date?->format('Y-m-d'),
                'scheduled_time' => $request->scheduled_time?->format('H:i'),
                'scheduled_end_time' => $request->scheduled_end_time?->format('H:i'),
                'defense_duration_minutes' => $request->defense_duration_minutes,
                'formatted_time_range' => $request->formatted_time_range,
                'defense_mode' => $request->defense_mode,
                'defense_venue' => $request->defense_venue,
                'scheduling_notes' => $request->scheduling_notes,
                'panels_assigned_at' => $request->panels_assigned_at?->format('M d, Y g:i A'),
                'schedule_set_at' => $request->schedule_set_at?->format('M d, Y g:i A'),
                'adviser_notified_at' => $request->adviser_notified_at?->format('M d, Y g:i A'),
                'student_notified_at' => $request->student_notified_at?->format('M d, Y g:i A'),
                'panels_notified_at' => $request->panels_notified_at?->format('M d, Y g:i A'),
                'submitted_at' => $request->submitted_at?->format('M d, Y g:i A'),
                'adviser_reviewed_at' => $request->adviser_reviewed_at?->format('M d, Y g:i A'),
            ];
        });

        // Get available faculty for panel assignment
        $facultyMembers = User::where('role', 'Faculty')
            ->select('id', 'first_name', 'last_name')
            ->orderBy('last_name')
            ->get()
            ->map(function ($faculty) {
                return [
                    'id' => $faculty->id,
                    'name' => $faculty->first_name . ' ' . $faculty->last_name,
                    'email' => $faculty->email ?? '',
                    'type' => 'faculty'
                ];
            });

        // Get available panelists from the panelists database
        $panelists = \App\Models\Panelist::where('status', 'Available')
            ->select('id', 'name', 'email', 'status')
            ->orderBy('name')
            ->get()
            ->map(function ($panelist) {
                return [
                    'id' => $panelist->id,
                    'name' => $panelist->name,
                    'email' => $panelist->email,
                    'type' => 'panelist'
                ];
            });

        // Combine faculty and panelists for comprehensive panel selection
        $availablePanelMembers = $facultyMembers->concat($panelists)->values();

        // Dashboard statistics
        $stats = [
            'pending_panels' => DefenseRequest::where('scheduling_status', 'pending-panels')
                ->whereIn('workflow_state', ['adviser-approved', 'coordinator-review', 'coordinator-approved'])->count(),
            'panels_assigned' => DefenseRequest::where('scheduling_status', 'panels-assigned')->count(),
            'scheduled' => DefenseRequest::where('scheduling_status', 'scheduled')->count(),
            'completed' => DefenseRequest::where('scheduling_status', 'completed')->count(),
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

    /**
     * Assign panels to a defense request and redirect to scheduling
     */
    public function assignPanels(Request $request, DefenseRequest $defenseRequest)
    {
        $validated = $request->validate([
            'defense_chairperson' => 'required|string|max:255',
            'defense_panelist1' => 'required|string|max:255',
            'defense_panelist2' => 'nullable|string|max:255',
            'defense_panelist3' => 'nullable|string|max:255',
            'defense_panelist4' => 'nullable|string|max:255',
        ], [
            'defense_chairperson.required' => 'Please select a chairperson for the defense panel.',
            'defense_panelist1.required' => 'Please select at least one panelist for the defense.',
            'defense_chairperson.max' => 'Chairperson name is too long.',
            'defense_panelist1.max' => 'Panelist name is too long.',
        ]);

        try {
            // Validate panel assignment
            $conflictService = new DefenseConflictService();
            $basicErrors = $conflictService->validateAssignmentBasic($defenseRequest, $validated);
            if (!empty($basicErrors)) {
                return back()->withErrors($basicErrors)->withInput();
            }

            DB::transaction(function () use ($defenseRequest, $validated) {
                $defenseRequest->assignPanels(
                    $validated['defense_chairperson'],
                    $validated['defense_panelist1'],
                    $validated['defense_panelist2'],
                    $validated['defense_panelist3'],
                    $validated['defense_panelist4'],
                    Auth::id()
                );
            });

            Log::info('Panels assigned successfully', [
                'defense_request_id' => $defenseRequest->id,
                'coordinator_id' => Auth::id(),
                'panels' => $validated,
            ]);

            // Return with success and flag to move to scheduling
            return back()->with([
                'success' => 'Defense panel assigned successfully! Please set the defense schedule.',
                'move_to_scheduling' => true,
                'assigned_request_id' => $defenseRequest->id
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to assign panels', [
                'defense_request_id' => $defenseRequest->id,
                'coordinator_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Failed to assign defense panel. Please try again.'])->withInput();
        }
    }

    /**
     * Schedule a defense
     */
    public function scheduleDefense(Request $request, DefenseRequest $defenseRequest)
    {
        $validated = $request->validate([
            'scheduled_date' => 'required|date|after:today',
            'scheduled_time' => 'required|date_format:H:i',
            'scheduled_end_time' => 'required|date_format:H:i|after:scheduled_time',
            'defense_mode' => 'required|in:face-to-face,online',
            'defense_venue' => 'required|string|max:255',
            'scheduling_notes' => 'nullable|string|max:1000',
        ], [
            'scheduled_date.required' => 'Please select a defense date.',
            'scheduled_date.after' => 'Defense date must be in the future.',
            'scheduled_time.required' => 'Please select a defense start time.',
            'scheduled_time.date_format' => 'Please enter a valid start time in HH:MM format.',
            'scheduled_end_time.required' => 'Please select a defense end time.',
            'scheduled_end_time.date_format' => 'Please enter a valid end time in HH:MM format.',
            'scheduled_end_time.after' => 'End time must be after start time.',
            'defense_mode.required' => 'Please select the defense mode.',
            'defense_mode.in' => 'Defense mode must be either face-to-face or online.',
            'defense_venue.required' => 'Please specify the defense venue.',
            'defense_venue.max' => 'Venue name is too long.',
            'scheduling_notes.max' => 'Scheduling notes are too long (maximum 1000 characters).',
        ]);

        try {
            $conflictService = new DefenseConflictService();

            // Check for panel member time conflicts if panels are already assigned
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
                $validated['scheduled_date'] ?? null,
                $validated['scheduled_time'] ?? null,
                $validated['scheduled_end_time'] ?? null
            );
            
            if (!empty($conflicts)) {
                $startTime = Carbon::parse($validated['scheduled_time']);
                $endTime = Carbon::parse($validated['scheduled_end_time']);
                $timeRange = $startTime->format('g:i A') . ' - ' . $endTime->format('g:i A');
                
                // Create detailed conflict messages
                $conflictMessages = [];
                foreach ($conflicts as $conflict) {
                    $conflictMessages[] = sprintf(
                        "%s (serving as %s) is already scheduled as %s for %s's defense during %s",
                        $conflict['person'],
                        $conflict['current_role'],
                        $conflict['conflicting_role'],
                        $conflict['student_name'],
                        $conflict['time_range']
                    );
                }
                
                $message = "⚠️ **Scheduling Conflict Detected**\n\n" . 
                          "The requested time slot **{$timeRange}** conflicts with existing defense schedules:\n\n" .
                          "• " . implode("\n• ", $conflictMessages) . "\n\n" .
                          "Please select a different time slot or reassign panel members to resolve this conflict.";
                
                return back()->withErrors(['scheduled_time' => $message])->withInput();
            }

            // Venue conflict with time range
            if ($conflictService->hasVenueConflict(
                $defenseRequest, 
                $validated['defense_venue'], 
                $validated['scheduled_date'], 
                $validated['scheduled_time'],
                $validated['scheduled_end_time']
            )) {
                $startTime = Carbon::parse($validated['scheduled_time']);
                $endTime = Carbon::parse($validated['scheduled_end_time']);
                $timeRange = $startTime->format('g:i A') . ' - ' . $endTime->format('g:i A');
                $date = Carbon::parse($validated['scheduled_date'])->format('M d, Y');
                
                $message = "🏛️ **Venue Conflict Detected**\n\n" .
                          "The venue **{$validated['defense_venue']}** is already reserved for another defense on **{$date}** during **{$timeRange}**.\n\n" .
                          "Please select a different venue or time slot to resolve this conflict.";
                
                return back()->withErrors([
                    'defense_venue' => $message
                ])->withInput();
            }

            DB::transaction(function () use ($defenseRequest, $validated) {
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

            Log::info('Defense scheduled successfully', [
                'defense_request_id' => $defenseRequest->id,
                'coordinator_id' => Auth::id(),
                'schedule' => $validated,
            ]);

            $scheduleDate = Carbon::parse($validated['scheduled_date'])->format('M d, Y');
            $startTime = Carbon::parse($validated['scheduled_time']);
            $endTime = Carbon::parse($validated['scheduled_end_time']);
            $timeRange = $startTime->format('g:i A') . ' - ' . $endTime->format('g:i A');
            
            // Create notifications for student and panel members
            $this->createSchedulingNotifications($defenseRequest, $scheduleDate, $timeRange, $validated);
            
            return back()->with([
                'success' => "Defense scheduled successfully for {$scheduleDate} from {$timeRange}",
                'scheduling_completed' => true
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to schedule defense', [
                'defense_request_id' => $defenseRequest->id,
                'coordinator_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Failed to schedule defense. Please try again.'])->withInput();
        }
    }

    /**
     * Send notifications to relevant parties
     */
    public function sendNotifications(Request $request, DefenseRequest $defenseRequest)
    {
        $validated = $request->validate([
            'notify_parties' => 'required|array',
            'notify_parties.*' => 'in:adviser,student,panels',
        ]);

        try {
            $notificationService = new DefenseNotificationService();
            $notifiedParties = $notificationService->sendSchedulingNotifications(
                $defenseRequest, 
                $validated['notify_parties']
            );

            // Update the defense request with notification timestamps
            $defenseRequest->notifyParties($validated['notify_parties']);

            Log::info('Notifications sent successfully', [
                'defense_request_id' => $defenseRequest->id,
                'coordinator_id' => Auth::id(),
                'notified_parties' => $notifiedParties,
            ]);

            return back()->with('success', 'Notifications sent successfully to: ' . implode(', ', $notifiedParties));

        } catch (\Exception $e) {
            Log::error('Failed to send notifications', [
                'defense_request_id' => $defenseRequest->id,
                'coordinator_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Failed to send notifications. Please try again.']);
        }
    }

    /**
     * Update defense request details
     */
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
            DB::transaction(function () use ($defenseRequest, $validated) {
                $changes = [];
                
                foreach ($validated as $field => $value) {
                    if ($defenseRequest->$field !== $value) {
                        $changes[$field] = [
                            'from' => $defenseRequest->$field,
                            'to' => $value
                        ];
                    }
                }

                if (!empty($changes)) {
                    $defenseRequest->update($validated);
                    
                    $changeDescription = 'Defense details updated: ' . 
                        implode(', ', array_map(function ($field, $change) {
                            return "{$field}: {$change['from']} → {$change['to']}";
                        }, array_keys($changes), $changes));

                    $defenseRequest->addWorkflowEntry('defense-updated', $changeDescription, Auth::id());
                }
            });

            Log::info('Defense updated successfully', [
                'defense_request_id' => $defenseRequest->id,
                'coordinator_id' => Auth::id(),
                'changes' => $validated,
            ]);

            return back()->with('success', 'Defense details updated successfully!');

        } catch (\Exception $e) {
            Log::error('Failed to update defense', [
                'defense_request_id' => $defenseRequest->id,
                'coordinator_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Failed to update defense details. Please try again.']);
        }
    }

    /**
     * Get defense request details for editing
     */
    public function show(DefenseRequest $defenseRequest)
    {
        $defenseRequest->load(['user', 'adviserUser', 'panelsAssignedBy', 'scheduleSetBy']);

        return response()->json([
            'id' => $defenseRequest->id,
            'student_name' => $defenseRequest->first_name . ' ' . $defenseRequest->last_name,
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

    /**
     * Create notifications for all relevant parties when defense is scheduled
     */
    private function createSchedulingNotifications(DefenseRequest $defenseRequest, string $scheduleDate, string $timeRange, array $validated)
    {
        // Notify the student
        if ($defenseRequest->submitted_by) {
            Notification::create([
                'user_id' => $defenseRequest->submitted_by,
                'type' => 'defense-request',
                'title' => '🎉 Your Defense Has Been Scheduled!',
                'message' => "Great news! Your {$defenseRequest->defense_type} defense has been scheduled for {$scheduleDate} from {$timeRange}. " .
                           "Venue: {$validated['defense_venue']}. " . 
                           "Chairperson: {$defenseRequest->defense_chairperson}. " .
                           "Please prepare your presentation materials.",
                'link' => '/defense-requirements',
            ]);
        }

        // Notify panel members
        $panelMembers = array_filter([
            $defenseRequest->defense_chairperson,
            $defenseRequest->defense_panelist1,
            $defenseRequest->defense_panelist2,
            $defenseRequest->defense_panelist3,
            $defenseRequest->defense_panelist4,
        ]);

        foreach ($panelMembers as $panelMemberName) {
            // Find user by name (this is a simple approach; in production you might want a more robust mapping)
            $panelUser = User::where(function($query) use ($panelMemberName) {
                $nameParts = explode(' ', trim($panelMemberName));
                if (count($nameParts) >= 2) {
                    $query->where('first_name', 'LIKE', '%' . $nameParts[0] . '%')
                          ->where('last_name', 'LIKE', '%' . end($nameParts) . '%');
                } else {
                    $query->where('first_name', 'LIKE', '%' . $panelMemberName . '%')
                          ->orWhere('last_name', 'LIKE', '%' . $panelMemberName . '%');
                }
            })->first();

            if ($panelUser) {
                Notification::create([
                    'user_id' => $panelUser->id,
                    'type' => 'defense-request',
                    'title' => '📅 Defense Panel Assignment',
                    'message' => "You have been assigned as a panel member for {$defenseRequest->first_name} {$defenseRequest->last_name}'s {$defenseRequest->defense_type} defense on {$scheduleDate} from {$timeRange} at {$validated['defense_venue']}.",
                    'link' => '/defense-requests',
                ]);
            }
        }

        // Notify the adviser if different from panel members
        if ($defenseRequest->adviser_user_id && !in_array($defenseRequest->defense_adviser, $panelMembers)) {
            Notification::create([
                'user_id' => $defenseRequest->adviser_user_id,
                'type' => 'defense-request',
                'title' => '📋 Your Student\'s Defense Scheduled',
                'message' => "The defense for your advisee {$defenseRequest->first_name} {$defenseRequest->last_name} has been scheduled for {$scheduleDate} from {$timeRange} at {$validated['defense_venue']}.",
                'link' => '/defense-requests',
            ]);
        }
    }
}
