<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class DefenseRequest extends Model
{
    protected $fillable = [
        'first_name', 'middle_name', 'last_name',
        'school_id', 'program', 'thesis_title', 'date_of_defense',
        'mode_defense', 'defense_type',
        'advisers_endorsement', 'rec_endorsement', 'proof_of_payment', 'reference_no',
        'defense_adviser', 'defense_chairperson',
        'defense_panelist1', 'defense_panelist2', 'defense_panelist3', 'defense_panelist4',
        'status', 'priority', 'last_status_updated_at', 'last_status_updated_by',
        'submitted_by', 'submitted_at',
        'adviser_user_id', 'assigned_to_user_id', 'workflow_state',
        'adviser_comments', 'adviser_reviewed_at', 'adviser_reviewed_by',
        'coordinator_comments', 'coordinator_reviewed_at', 'coordinator_reviewed_by',
        'workflow_history',
        'manuscript_proposal', 'similarity_index',
        // Professional Defense Scheduling Fields
        'scheduled_date', 'scheduled_time', 'scheduled_end_time', 'defense_duration_minutes', 
        'formatted_time_range', 'defense_mode', 'defense_venue', 'scheduling_notes',
        'panels_assigned_at', 'panels_assigned_by', 'schedule_set_at', 'schedule_set_by',
        'adviser_notified_at', 'student_notified_at', 'panels_notified_at', 'scheduling_status',
    ];

    protected $casts = [
        'workflow_history' => 'array',
        'adviser_reviewed_at' => 'datetime',
        'coordinator_reviewed_at' => 'datetime',
        'submitted_at' => 'datetime',
        'last_status_updated_at' => 'datetime',
        // Professional Scheduling Casts
        'scheduled_date' => 'datetime',
        'scheduled_time' => 'datetime',
        'scheduled_end_time' => 'datetime',
        'panels_assigned_at' => 'datetime',
        'schedule_set_at' => 'datetime',
        'adviser_notified_at' => 'datetime',
        'student_notified_at' => 'datetime',
        'panels_notified_at' => 'datetime',
    ];

    public function lastStatusUpdater()
    {
        return $this->belongsTo(\App\Models\User::class, 'last_status_updated_by');
    }

    public function adviserUser()
    {
        return $this->belongsTo(User::class, 'adviser_user_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function adviserReviewer()
    {
        return $this->belongsTo(User::class, 'adviser_reviewed_by');
    }

    public function coordinatorReviewer()
    {
        return $this->belongsTo(User::class, 'coordinator_reviewed_by');
    }

    public function panelsAssignedBy()
    {
        return $this->belongsTo(User::class, 'panels_assigned_by');
    }

    public function scheduleSetBy()
    {
        return $this->belongsTo(User::class, 'schedule_set_by');
    }

    /**
     * Add an entry to the workflow history
     */
    public function addWorkflowEntry($action, $comment = null, $userId = null)
    {
        $history = $this->workflow_history ?? [];
        $currentUser = Auth::user();
        
        $history[] = [
            'action' => $action,
            'comment' => $comment,
            'user_id' => $userId ?? ($currentUser ? $currentUser->id : null),
            'user_name' => $userId ? User::find($userId)?->first_name . ' ' . User::find($userId)?->last_name : ($currentUser ? $currentUser->first_name . ' ' . $currentUser->last_name : 'System'),
            'timestamp' => now()->toISOString(),
        ];
        
        $this->workflow_history = $history;
        return $this;
    }

    /**
     * Get the current workflow state display name
     */
    public function getWorkflowStateDisplayAttribute()
    {
        return match($this->workflow_state) {
            'submitted' => 'Submitted to Adviser',
            'adviser-review' => 'Under Adviser Review',
            'adviser-approved' => 'Approved by Adviser',
            'adviser-rejected' => 'Rejected by Adviser',
            'coordinator-review' => 'Under Coordinator Review',
            'coordinator-approved' => 'Approved by Coordinator',
            'coordinator-rejected' => 'Rejected by Coordinator',
            'scheduled' => 'Defense Scheduled',
            'completed' => 'Defense Completed',
            default => ucfirst(str_replace('-', ' ', $this->workflow_state))
        };
    }

    /**
     * Professional method to assign panels to a defense request
     */
    public function assignPanels($chairperson, $panelist1, $panelist2 = null, $panelist3 = null, $panelist4 = null, $assignedBy = null)
    {
        $this->update([
            'defense_chairperson' => $chairperson,
            'defense_panelist1' => $panelist1,
            'defense_panelist2' => $panelist2,
            'defense_panelist3' => $panelist3,
            'defense_panelist4' => $panelist4,
            'panels_assigned_at' => now(),
            'panels_assigned_by' => $assignedBy ?? Auth::id(),
            'scheduling_status' => 'panels-assigned',
        ]);

        $this->addWorkflowEntry('panels-assigned', "Panels assigned: Chairperson: {$chairperson}, Panelists: {$panelist1}" . 
            ($panelist2 ? ", {$panelist2}" : '') . 
            ($panelist3 ? ", {$panelist3}" : '') . 
            ($panelist4 ? ", {$panelist4}" : ''), $assignedBy);

        return $this;
    }

    /**
     * Professional method to schedule a defense with time range
     */
    public function scheduleDefense($date, $startTime, $endTime, $mode, $venue, $notes = null, $scheduledBy = null)
    {
        // Calculate duration in minutes from start and end times
        $startDateTime = $date->copy()->setTimeFromTimeString($startTime->format('H:i:s'));
        $endDateTime = $date->copy()->setTimeFromTimeString($endTime->format('H:i:s'));
        $duration = $endDateTime->diffInMinutes($startDateTime);
        
        // Format time range for display (e.g., "12:00 PM - 2:00 PM")
        $timeRange = $startDateTime->format('g:i A') . ' - ' . $endDateTime->format('g:i A');
        
        $this->update([
            'scheduled_date' => $date,
            'scheduled_time' => $startTime,
            'scheduled_end_time' => $endTime->format('H:i:s'),
            'defense_duration_minutes' => $duration,
            'formatted_time_range' => $timeRange,
            'defense_mode' => $mode,
            'defense_venue' => $venue,
            'scheduling_notes' => $notes,
            'schedule_set_at' => now(),
            'schedule_set_by' => $scheduledBy ?? Auth::id(),
            'scheduling_status' => 'scheduled',
            'workflow_state' => 'scheduled',
        ]);

        $this->addWorkflowEntry('defense-scheduled', 
            "Defense scheduled for {$date->format('M d, Y')} from {$timeRange} ({$mode})" . 
            ($venue ? " at {$venue}" : '') . 
            ($notes ? ". Notes: {$notes}" : ''), $scheduledBy);

        return $this;
    }

    /**
     * Professional method to notify relevant parties
     */
    public function notifyParties($parties = ['adviser', 'student', 'panels'])
    {
        $notified = [];
        
        if (in_array('adviser', $parties)) {
            $this->update(['adviser_notified_at' => now()]);
            $notified[] = 'adviser';
        }
        
        if (in_array('student', $parties)) {
            $this->update(['student_notified_at' => now()]);
            $notified[] = 'student';
        }
        
        if (in_array('panels', $parties)) {
            $this->update(['panels_notified_at' => now()]);
            $notified[] = 'panels';
        }

        $this->addWorkflowEntry('notifications-sent', 
            "Notifications sent to: " . implode(', ', $notified));

        return $this;
    }

    /**
     * Get formatted defense schedule
     */
    public function getFormattedScheduleAttribute()
    {
        if (!$this->scheduled_date || !$this->scheduled_time) {
            return 'Not scheduled';
        }

        return $this->scheduled_date->format('M d, Y') . ' at ' . 
               $this->scheduled_time->format('g:i A') . 
               ' (' . ucfirst($this->defense_mode) . ')';
    }

    /**
     * Get panels list as array
     */
    public function getPanelsListAttribute()
    {
        $panels = [];
        
        if ($this->defense_chairperson) {
            $panels[] = ['role' => 'Chairperson', 'name' => $this->defense_chairperson];
        }
        
        if ($this->defense_panelist1) {
            $panels[] = ['role' => 'Panelist 1', 'name' => $this->defense_panelist1];
        }
        
        if ($this->defense_panelist2) {
            $panels[] = ['role' => 'Panelist 2', 'name' => $this->defense_panelist2];
        }
        
        if ($this->defense_panelist3) {
            $panels[] = ['role' => 'Panelist 3', 'name' => $this->defense_panelist3];
        }
        
        if ($this->defense_panelist4) {
            $panels[] = ['role' => 'Panelist 4', 'name' => $this->defense_panelist4];
        }

        return $panels;
    }
}
