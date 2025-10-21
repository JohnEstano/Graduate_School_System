<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use App\Models\Panelist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class DefenseScheduleController extends Controller
{
    /**
     * Display the defense schedule calendar view
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Ensure user is authorized
        $coordinatorRoles = ['Coordinator', 'Administrative Assistant', 'Dean'];
        if (!in_array($user->role, $coordinatorRoles)) {
            abort(403, 'Unauthorized access to defense schedule');
        }

        // Get all scheduled defenses
        $scheduledDefenses = DefenseRequest::with(['user', 'panelsAssignedBy', 'scheduleSetBy'])
            ->whereNotNull('scheduled_date')
            ->whereNotNull('scheduled_time')
            ->whereIn('workflow_state', ['scheduled', 'completed'])
            ->orderBy('scheduled_date', 'asc')
            ->orderBy('scheduled_time', 'asc')
            ->get()
            ->map(function ($defense) {
                return [
                    'id' => $defense->id,
                    'student_name' => $defense->first_name . ' ' . $defense->last_name,
                    'school_id' => $defense->school_id,
                    'program' => $defense->program,
                    'thesis_title' => $defense->thesis_title,
                    'defense_type' => $defense->defense_type,
                    'scheduled_date' => $defense->scheduled_date->format('Y-m-d'),
                    'scheduled_time' => $defense->scheduled_time->format('H:i'),
                    'defense_mode' => $defense->defense_mode,
                    'defense_venue' => $defense->defense_venue,
                    'panels_list' => $defense->panels_list,
                    'workflow_state' => $defense->workflow_state,
                    'scheduling_notes' => $defense->scheduling_notes,
                ];
            });

        return Inertia::render('coordinator/schedule/DefenseScheduleCalendar', [
            'scheduledDefenses' => $scheduledDefenses,
            'user' => $user,
        ]);
    }

    /**
     * API endpoint for calendar data
     */
    public function calendar(Request $request)
    {
        $defenses = DefenseRequest::whereNotNull('scheduled_date')
            ->whereNotNull('scheduled_time')
            ->whereIn('workflow_state', ['scheduled', 'completed'])
            ->get()
            ->map(function ($defense) {
                return [
                    'id' => $defense->id,
                    'title' => $defense->thesis_title,
                    'student_name' => $defense->first_name . ' ' . $defense->last_name,
                    'school_id' => $defense->school_id,
                    'program' => $defense->program,
                    'defense_type' => $defense->defense_type,
                    'date_of_defense' => $defense->scheduled_date->format('Y-m-d H:i:s'),
                    'scheduled_date' => $defense->scheduled_date->format('Y-m-d'),
                    'scheduled_time' => $defense->scheduled_time->format('H:i'),
                    'defense_mode' => $defense->defense_mode,
                    'defense_venue' => $defense->defense_venue,
                    'status' => ucfirst($defense->workflow_state),
                    'panels' => $defense->panels_list,
                    'scheduling_notes' => $defense->scheduling_notes,
                ];
            });

        return response()->json($defenses);
    }

    /**
     * Get conflicts for a specific date and time
     */
    public function checkConflicts(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'time' => 'required|date_format:H:i',
            'panels' => 'required|array',
            'venue' => 'nullable|string',
            'exclude_id' => 'nullable|integer', // Exclude current defense from conflict check
        ]);

        $conflicts = [];
        
        // Check panel conflicts
        $panelConflicts = DefenseRequest::where('id', '!=', $validated['exclude_id'] ?? 0)
            ->whereDate('scheduled_date', $validated['date'])
            ->whereTime('scheduled_time', $validated['time'])
            ->whereIn('workflow_state', ['scheduled', 'completed'])
            ->get()
            ->filter(function ($defense) use ($validated) {
                $defensePanels = array_filter([
                    $defense->defense_chairperson,
                    $defense->defense_panelist1,
                    $defense->defense_panelist2,
                    $defense->defense_panelist3,
                    $defense->defense_panelist4,
                ]);
                
                foreach ($validated['panels'] as $panel) {
                    if (in_array($panel, $defensePanels)) {
                        return true;
                    }
                }
                return false;
            })
            ->map(function ($defense) use ($validated) {
                return [
                    'type' => 'panel',
                    'defense_id' => $defense->id,
                    'student_name' => $defense->first_name . ' ' . $defense->last_name,
                    'conflicting_panels' => array_intersect(
                        array_filter([
                            $defense->defense_chairperson,
                            $defense->defense_panelist1,
                            $defense->defense_panelist2,
                            $defense->defense_panelist3,
                            $defense->defense_panelist4,
                        ]),
                        $validated['panels']
                    ),
                ];
            });

        // Check venue conflicts
        if (!empty($validated['venue'])) {
            $venueConflicts = DefenseRequest::where('id', '!=', $validated['exclude_id'] ?? 0)
                ->whereDate('scheduled_date', $validated['date'])
                ->whereTime('scheduled_time', $validated['time'])
                ->where('defense_venue', $validated['venue'])
                ->whereIn('workflow_state', ['scheduled', 'completed'])
                ->get()
                ->map(function ($defense) use ($validated) {
                    return [
                        'type' => 'venue',
                        'defense_id' => $defense->id,
                        'student_name' => $defense->first_name . ' ' . $defense->last_name,
                        'venue' => $validated['venue'],
                    ];
                });

            $conflicts = array_merge($conflicts, $venueConflicts->toArray());
        }

        $conflicts = array_merge($conflicts, $panelConflicts->toArray());

        return response()->json([
            'has_conflicts' => count($conflicts) > 0,
            'conflicts' => $conflicts,
        ]);
    }

    /**
     * Get available panelists for a specific date and time
     */
    public function availablePanelists(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'time' => 'required|date_format:H:i',
            'exclude_id' => 'nullable|integer',
        ]);

        // Get all panelists
        $allPanelists = Panelist::where('status', 'Available')->get();

        // Get panelists already assigned at this time
        $busyPanelists = DefenseRequest::where('id', '!=', $validated['exclude_id'] ?? 0)
            ->whereDate('scheduled_date', $validated['date'])
            ->whereTime('scheduled_time', $validated['time'])
            ->whereIn('workflow_state', ['scheduled', 'completed'])
            ->get()
            ->flatMap(function ($defense) {
                return array_filter([
                    $defense->defense_chairperson,
                    $defense->defense_panelist1,
                    $defense->defense_panelist2,
                    $defense->defense_panelist3,
                    $defense->defense_panelist4,
                ]);
            })
            ->unique()
            ->toArray();

        $availablePanelists = $allPanelists->map(function ($panelist) use ($busyPanelists) {
            return [
                'id' => $panelist->id,
                'name' => $panelist->name,
                'email' => $panelist->email,
                'status' => $panelist->status,
                'is_available' => !in_array($panelist->name, $busyPanelists),
                'date_available' => $panelist->date_available,
            ];
        });

        return response()->json($availablePanelists);
    }
}
