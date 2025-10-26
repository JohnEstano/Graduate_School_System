<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Panelist;
use App\Models\HonorariumPayment;
use App\Models\PaymentRate;
use Carbon\Carbon;
use App\Helpers\ProgramLevel;

class DefenseRequest extends Model
{
    protected $guarded = [];
    protected $casts = [
        'workflow_history'           => 'array',
        'last_status_updated_at'     => 'datetime',
        'created_at'                 => 'datetime',
        'updated_at'                 => 'datetime',
        'adviser_reviewed_at'        => 'datetime',
        'coordinator_reviewed_at'    => 'datetime',
        'submitted_at'               => 'datetime',
        'scheduled_date'             => 'datetime',
        'scheduled_end_time'         => 'string',
        'coordinator_assigned_at'    => 'datetime',
        'coordinator_manually_assigned' => 'boolean',
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    public function user()                { return $this->belongsTo(User::class,'submitted_by'); }
    public function adviserUser()         { return $this->belongsTo(User::class,'adviser_user_id'); }
    public function assignedTo()          { return $this->belongsTo(User::class,'assigned_to_user_id'); }
    public function panelsAssignedBy()    { return $this->belongsTo(User::class,'panels_assigned_by'); }
    public function scheduleSetBy()       { return $this->belongsTo(User::class,'schedule_set_by'); }
    public function lastStatusUpdater()   { return $this->belongsTo(User::class,'last_status_updated_by'); }
    public function adviserReviewer()     { return $this->belongsTo(User::class,'adviser_reviewed_by'); }
    public function coordinatorReviewer() { return $this->belongsTo(User::class,'coordinator_reviewed_by'); }
    public function student()             { return $this->belongsTo(User::class, 'submitted_by'); }
    public function coordinator()         { return $this->belongsTo(User::class, 'coordinator_user_id'); }

    public function honorariumPayments()
    {
        return $this->hasMany(HonorariumPayment::class);
    }

    // Helper: get all panelists as models (Panelist or User)
    public function getPanelistsAttribute()
    {
        $fields = [
            $this->defense_chairperson,
            $this->defense_panelist1,
            $this->defense_panelist2,
            $this->defense_panelist3,
            $this->defense_panelist4,
        ];

        // Collect numeric IDs to fetch Panelist records in one query
        $ids = array_values(array_filter(array_map(function ($v) {
            return is_numeric($v) ? (int)$v : null;
        }, $fields)));

        $panelistRecords = collect();
        if (!empty($ids)) {
            $panelistRecords = Panelist::whereIn('id', $ids)->get()->keyBy(function ($p) {
                return (int) $p->id;
            });
        }

        $result = collect();
        foreach ($fields as $f) {
            if (!$f) continue;

            if (is_numeric($f) && isset($panelistRecords[(int)$f])) {
                $result->push($panelistRecords[(int)$f]);
                continue;
            }

            // Try to find internal faculty user by exact full name (fallback)
            $user = User::whereRaw("CONCAT(first_name, ' ', last_name) = ?", [$f])->first();
            if ($user) {
                $result->push($user);
                continue;
            }

            // Last fallback: simple object with name
            $obj = new \stdClass();
            $obj->id = null;
            $obj->name = $f;
            $obj->email = null;
            $result->push($obj);
        }

        return $result->values();
    }

    public function scopeForAdviser($q, User $user)
    {
        $lname = strtolower($user->last_name);
        $fname = strtolower($user->first_name);
        return $q->where(function($qq) use ($user,$lname,$fname) {
            $qq->where('adviser_user_id',$user->id)
               ->orWhere('assigned_to_user_id',$user->id)
               ->orWhereRaw('LOWER(defense_adviser) LIKE ?', ["%$lname%"])
               ->orWhereRaw('LOWER(defense_adviser) LIKE ?', ["%$fname%"]);
        });
    }

    public function getWorkflowStateDisplayAttribute()
    {
        return match($this->workflow_state) {
            'submitted','adviser-review'    => 'Submitted',
            'adviser-approved'              => 'Adviser Approved',
            'adviser-rejected'              => 'Adviser Rejected',
            'coordinator-approved'          => 'Coordinator Approved',
            'coordinator-rejected'          => 'Coordinator Rejected',
            'panels-assigned'               => 'Panels Assigned',
            'scheduled'                     => 'Scheduled',
            'completed'                     => 'Completed',
            'cancelled'                     => 'Cancelled',
            default                         => ucfirst($this->workflow_state ?? 'Unknown'),
        };
    }

    public function ensureSubmittedHistory()
    {
        if (!$this->submitted_at) {
            $this->submitted_at = $this->created_at ?: now();
        }
        $hist = is_array($this->workflow_history) ? $this->workflow_history : [];
        $hasSubmitted = collect($hist)->contains(fn($h)=>($h['action']??'')==='submitted');
        if (!$hasSubmitted) {
            $hist[] = [
                'action'=>'submitted',
                'timestamp'=>($this->submitted_at ?: now())->toIso8601String(),
                'user_id'=>$this->submitted_by,
                'user_name'=>null,
                'comment'=>null,
                'from_state'=>null,
                'to_state'=>'submitted'
            ];
            $this->workflow_history = $hist;
        }
        return $this;
    }

    public function addWorkflowEntry($action,$comment=null,$userId=null,$from=null,$to=null)
    {
        $history = is_array($this->workflow_history) ? $this->workflow_history : [];
        $u = $userId ? User::find($userId) : Auth::user();
        $history[] = [
            'action'=>$action,
            'comment'=>$comment,
            'user_id'=>$u?->id,
            'user_name'=>trim(($u?->first_name ?? '').' '.($u?->last_name ?? '')),
            'timestamp'=>now()->toIso8601String(),
            'from_state'=>$from,
            'to_state'=>$to ?? $action
        ];
        $this->workflow_history = $history;
        return $this;
    }

    public function approveByCoordinator(?string $comment=null, ?int $userId=null)
    {
        $uid = $userId ?? Auth::id();
        $this->coordinator_comments = $comment;
        $this->coordinator_reviewed_at = now();
        $this->coordinator_reviewed_by = $uid;
        $this->workflow_state = 'coordinator-approved';
        $this->status = 'Approved';
        $this->last_status_updated_at = now();
        $this->last_status_updated_by = $uid;

        $this->ensureSubmittedHistory()
             ->addWorkflowEntry('coordinator-approved',$comment,$uid,'adviser-approved','coordinator-approved');

        $this->save();
        return $this;
    }

    /**
     * Assign panelists and create honorarium payments for each assigned panelist.
     */
    public function assignPanels(
        string $chair,
        string $panel1,
        ?string $panel2,
        ?string $panel3,
        ?string $panel4,
        int $userId
    ): self {
        $orig = $this->workflow_state;

        $this->defense_chairperson = $chair;
        $this->defense_panelist1 = $panel1;
        $this->defense_panelist2 = $panel2;
        $this->defense_panelist3 = $panel3;
        $this->defense_panelist4 = $panel4;

        // Transition only from adviser-approved or coordinator-approved
        if (in_array($this->workflow_state, ['adviser-approved','coordinator-approved'])) {
            $this->workflow_state = 'panels-assigned';
            $this->addWorkflowEntry(
                'panels-assigned',
                null,
                $userId,
                $orig,
                'panels-assigned'
            );
        }

        if (property_exists($this,'scheduling_status') || isset($this->scheduling_status)) {
            $this->scheduling_status = 'panels-assigned';
        }

        $this->panels_assigned_at = now();
        $this->panels_assigned_by = $userId;
        $this->last_status_updated_at = now();
        $this->last_status_updated_by = $userId;

        $this->save();

        // --- HONORARIUM PAYMENT CREATION LOGIC ---
        $panelAssignments = [
            ['id' => $chair,   'role' => 'Chairperson'],
            ['id' => $panel1,  'role' => 'Panel Member'],
            ['id' => $panel2,  'role' => 'Panel Member'],
            ['id' => $panel3,  'role' => 'Panel Member'],
            ['id' => $panel4,  'role' => 'Panel Member'],
        ];

        // You may need to store the defense type in the model, e.g. $this->defense_type
        $defenseType = $this->defense_type ?? 'Final'; // fallback if not set

        foreach ($panelAssignments as $panel) {
            if (!$panel['id']) continue;

            // Avoid duplicate payments for the same panelist/role/defense
            $exists = $this->honorariumPayments()
                ->where('panelist_id', $panel['id'])
                ->where('role', $panel['role'])
                ->where('panelist_type', 'Panelist')
                ->exists();

            if ($exists) continue;

            // Get honorarium rate for this role and defense type
            $spec = PanelistHonorariumSpec::where('role', $panel['role'])
                ->where('defense_type', $defenseType)
                ->first();

            $amount = $spec ? $spec->amount : 0;

            HonorariumPayment::create([
                'defense_request_id' => $this->id,
                'panelist_id'        => $panel['id'],
                'panelist_type'      => 'Panelist',
                'role'               => $panel['role'],
                'amount'             => $amount,
                'status'             => 'Unpaid',
            ]);
        }

        return $this;
    }

    public function createHonorariumPayments()
    {
        $panelAssignments = [
            ['id' => $this->defense_chairperson, 'role' => 'Chairperson'],
            ['id' => $this->defense_panelist1, 'role' => 'Panel Member'],
            ['id' => $this->defense_panelist2, 'role' => 'Panel Member'],
            ['id' => $this->defense_panelist3, 'role' => 'Panel Member'],
            ['id' => $this->defense_panelist4, 'role' => 'Panel Member'],
        ];

        $defenseType = $this->defense_type ?? 'Final';

        foreach ($panelAssignments as $panel) {
            if (!$panel['id']) continue;

            // If $panel['id'] is a name, convert to panelist ID
            $panelist = \App\Models\Panelist::where('name', $panel['id'])->first();
            if (!$panelist) continue; // skip if not found

            // Avoid duplicate payments
            $exists = $this->honorariumPayments()
                ->where('panelist_id', $panelist->id)
                ->where('role', $panel['role'])
                ->exists();

            if ($exists) continue;

            $spec = \App\Models\PanelistHonorariumSpec::where('role', $panel['role'])
                ->where('defense_type', $defenseType)
                ->first();

            $amount = $spec ? $spec->amount : 0;

            \App\Models\HonorariumPayment::create([
                'defense_request_id' => $this->id,
                'panelist_id'        => $panelist->id,
                'panelist_type'      => 'Panelist',
                'role'               => $panel['role'],
                'amount'             => $amount,
                'status'             => 'Unpaid',
            ]);
        }
    }

    public function getWorkflowHistoryAttribute($value)
    {
        $hist = $value;
        if (is_string($value)) {
            $decoded = json_decode($value,true);
            if (json_last_error() === JSON_ERROR_NONE) $hist = $decoded; else $hist = [];
        }
        if (!is_array($hist)) $hist = [];
        foreach ($hist as &$h) {
            $h['comment']   = $h['comment']   ?? null;
            $h['user_name'] = $h['user_name'] ?? '';
            $h['action']    = $h['action']    ?? '';
            $h['timestamp'] = $h['timestamp'] ?? now()->toIso8601String();
        }
        return $hist;
    }

    public function setWorkflowHistoryAttribute($value)
    {
        $this->attributes['workflow_history'] = is_array($value)
            ? json_encode($value)
            : $value;
    }

    public function scheduledStartAt(): ?Carbon
    {
        if (!$this->scheduled_date || !$this->scheduled_time) return null;
        return Carbon::parse($this->scheduled_date->format('Y-m-d').' '.$this->scheduled_time);
    }

    public function scheduledEndAt(): ?Carbon
    {
        // Prefer explicit end time; fallback: +1 hour from start; ultimate fallback: date end of day
        if ($this->scheduled_date && $this->scheduled_end_time) {
            return Carbon::parse($this->scheduled_date->format('Y-m-d').' '.$this->scheduled_end_time);
        }
        $start = $this->scheduledStartAt();
        if ($start) return (clone $start)->addHour();
        if ($this->scheduled_date) {
            return Carbon::parse($this->scheduled_date->format('Y-m-d').' 23:59:59');
        }
        return null;
    }

    public function attemptAutoComplete(?int $systemUserId = null): bool
    {
        if ($this->workflow_state !== 'scheduled') return false;
        $end = $this->scheduledEndAt();
        if ($end && now()->greaterThan($end)) {
            $from = $this->workflow_state;
            $this->workflow_state = 'completed';
            // Keep status as Approved (do not introduce new status if you rely on existing tabs)
            $this->status = 'Approved';
            $this->last_status_updated_at = now();
            $this->last_status_updated_by = $systemUserId;
            $this->addWorkflowEntry(
                'completed',
                'Auto-completed after scheduled defense end time passed',
                $systemUserId,
                $from,
                'completed'
            );
            $this->save();
            return true;
        }
        return false;
    }

    public function getStudentDisplayNameAttribute(): string
    {
        return $this->user?->name ?? 'Student';
    }

    public function generatedDocuments(){
      return $this->hasMany(GeneratedDocument::class);
    }

    /**
     * Assign a coordinator to this defense request based on the student's program.
     * 
     * @param string $program The student's program to match coordinator
     * @param int|null $assignedBy The user ID who triggered the assignment (system or user)
     * @param bool $isManual Whether this is a manual assignment (true) or auto-assignment (false)
     * @param string|null $notes Optional notes for the assignment audit trail
     * @return self
     */
    public function assignCoordinator(
        string $program,
        ?int $assignedBy = null,
        bool $isManual = false,
        ?string $notes = null
    ): self {
        // PRIORITY 1: Check database for coordinator assignment
        $coordinator = \App\Models\CoordinatorProgramAssignment::getCoordinatorForProgram($program);
        
        // FALLBACK: Use CoordinatorProgramService if no database assignment found
        if (!$coordinator) {
            $coordinatorEmail = \App\Services\CoordinatorProgramService::getCoordinatorByProgram($program);
            
            if (!$coordinatorEmail) {
                Log::warning('No coordinator found for program in database or service', [
                    'defense_request_id' => $this->id,
                    'program' => $program,
                    'student_id' => $this->submitted_by,
                ]);
                return $this;
            }

            // Find the coordinator user by email
            $coordinator = User::where('email', $coordinatorEmail)->first();
        }
        
        if (!$coordinator) {
            Log::warning('Coordinator not found or does not exist', [
                'defense_request_id' => $this->id,
                'program' => $program,
            ]);
            return $this;
        }

        // Set coordinator assignment fields
        $this->coordinator_user_id = $coordinator->id;
        $this->coordinator_assigned_at = now();
        $this->coordinator_assigned_by = $assignedBy ?? Auth::id();
        $this->coordinator_manually_assigned = $isManual;
        $this->coordinator_assignment_notes = $notes;

        // Add to workflow history for audit trail
        $this->addWorkflowEntry(
            'coordinator-assigned',
            $notes ?? ($isManual ? 'Manually assigned by administrator' : 'Auto-assigned based on program'),
            $this->coordinator_assigned_by,
            null,
            null
        );

        Log::info('Coordinator assigned to defense request', [
            'defense_request_id' => $this->id,
            'program' => $program,
            'coordinator_id' => $coordinator->id,
            'coordinator_name' => trim($coordinator->first_name . ' ' . $coordinator->last_name),
            'coordinator_email' => $coordinator->email,
            'assigned_by' => $this->coordinator_assigned_by,
            'is_manual' => $isManual,
        ]);

        $this->save();
        return $this;
    }

    /**
     * Get the assigned coordinator's display name for UI.
     * 
     * @return string|null
     */
    public function getAssignedCoordinatorNameAttribute(): ?string
    {
        if (!$this->coordinatorUser) {
            return null;
        }
        
        return trim($this->coordinatorUser->first_name . ' ' . $this->coordinatorUser->last_name);
    }

    public function getCoordinatorStatusDisplayAttribute()
    {
        // Final states
        if ($this->coordinator_status === 'Approved') return 'Approved';
        if ($this->coordinator_status === 'Rejected') return 'Rejected';

        // Not in coordinator workflow yet
        if (!in_array($this->workflow_state, [
            'coordinator-review', 'coordinator-approved', 'panels-assigned', 'scheduled', 'completed'
        ])) {
            return 'Pending';
        }

        // Check panel assignments
        $hasPanels = $this->defense_chairperson || $this->defense_panelist1 || $this->defense_panelist2 || $this->defense_panelist3 || $this->defense_panelist4;

        // Check schedule
        $hasSchedule = $this->scheduled_date && $this->scheduled_time && $this->scheduled_end_time && $this->defense_venue && $this->defense_mode;

        if (!$hasPanels && !$hasSchedule) {
            return 'Pending';
        }
        if (!$hasPanels && $hasSchedule) {
            return 'No Assigned Panelists';
        }
        if ($hasPanels && !$hasSchedule) {
            return 'Not Scheduled';
        }
        if ($hasPanels && $hasSchedule && $this->workflow_state !== 'coordinator-approved') {
            return 'Needs Signature';
        }
        if ($this->workflow_state === 'coordinator-approved') {
            return 'Approved';
        }
        return 'Pending';
    }

    public function aaVerification()
    {
        return $this->hasOne(\App\Models\AAPaymentVerification::class, 'defense_request_id');
    }
}
