<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class DefenseRequest extends Model
{
    protected $fillable = [
        'first_name','middle_name','last_name','school_id','program','thesis_title',
        'defense_type','defense_adviser','advisers_endorsement','rec_endorsement',
        'proof_of_payment','reference_no','defense_chairperson','defense_panelist1',
        'defense_panelist2','defense_panelist3','defense_panelist4','submitted_by',
        'status','priority','workflow_state','workflow_history','adviser_comments',
        'coordinator_comments','adviser_user_id','assigned_to_user_id','panels_assigned_by',
        'schedule_set_by','last_status_updated_by','scheduled_date','scheduled_time',
        'scheduled_end_time','defense_mode','defense_venue','adviser_reviewed_at',
        'adviser_reviewed_by','coordinator_reviewed_at','coordinator_reviewed_by',
        'panels_assigned_at','submitted_at','schedule_set_at','last_status_updated_at'
    ];

    protected $casts = [
        'workflow_history'        => 'array',
        'submitted_at'            => 'datetime',
        'adviser_reviewed_at'     => 'datetime',
        'coordinator_reviewed_at' => 'datetime',
        'panels_assigned_at'      => 'datetime',
        'schedule_set_at'         => 'datetime',
        'last_status_updated_at'  => 'datetime',
        'scheduled_date'          => 'datetime',
        'scheduled_time'          => 'datetime',
        'scheduled_end_time'      => 'datetime',
        'created_at'              => 'datetime',
        'updated_at'              => 'datetime',
    ];

    /* ================= Relationships ================= */
    public function user()                { return $this->belongsTo(User::class,'submitted_by'); }
    public function adviserUser()         { return $this->belongsTo(User::class,'adviser_user_id'); }
    public function assignedTo()          { return $this->belongsTo(User::class,'assigned_to_user_id'); }
    public function panelsAssignedBy()    { return $this->belongsTo(User::class,'panels_assigned_by'); }
    public function scheduleSetBy()       { return $this->belongsTo(User::class,'schedule_set_by'); }
    public function lastStatusUpdater()   { return $this->belongsTo(User::class,'last_status_updated_by'); }
    public function adviserReviewer()     { return $this->belongsTo(User::class,'adviser_reviewed_by'); }
    public function coordinatorReviewer() { return $this->belongsTo(User::class,'coordinator_reviewed_by'); }

    /* ================= Helpers ================= */
    public function scopeForAdviser($q, User $user)
    {
        $lname = strtolower($user->last_name);
        $fname = strtolower($user->first_name);
        return $q->where(function($qq) use ($user,$lname,$fname) {
            $qq->where('adviser_user_id',$user->id)
               ->orWhere('assigned_to_user_id',$user->id)
               ->orWhereRaw('LOWER(defense_adviser) LIKE ?', ["%{$lname}%"])
               ->orWhereRaw('LOWER(defense_adviser) LIKE ?', ["%{$fname}%"]);
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
            default                         => ucfirst($this->workflow_state ?? 'Unknown'),
        };
    }

    public function ensureSubmittedHistory()
    {
        if (!$this->submitted_at) {
            $this->submitted_at = $this->created_at ?: now();
        }
        $hist = $this->workflow_history ?? [];
        $hasSubmitted = collect($hist)->contains(fn($h)=>($h['action']??'')==='submitted');
        if (!$hasSubmitted) {
            $hist[] = [
                'action'=>'submitted',
                'timestamp'=>($this->submitted_at ?: now())->toISOString(),
                'user_id'=>$this->submitted_by,
                'user_name'=>null,
                'from_state'=>null,
                'to_state'=>'submitted'
            ];
            $this->workflow_history = $hist;
        }
        return $this;
    }

    public function addWorkflowEntry($action,$comment=null,$userId=null,$from=null,$to=null)
    {
        $history = $this->workflow_history ?? [];
        $u = $userId ? User::find($userId) : Auth::user();
        $history[] = [
            'action'=>$action,
            'comment'=>$comment,
            'user_id'=>$u?->id,
            'user_name'=>$u?->first_name.' '.$u?->last_name,
            'timestamp'=>now()->toISOString(),
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

        $this->ensureSubmittedHistory();
        $hist = $this->workflow_history ?? [];
        $hasAdv = collect($hist)->contains(fn($h)=>($h['action']??'')==='adviser-approved');
        if ($this->adviser_reviewed_at && !$hasAdv) {
            $hist[] = [
                'action'=>'adviser-approved',
                'timestamp'=>$this->adviser_reviewed_at->toISOString(),
                'user_id'=>$this->adviser_reviewed_by,
                'user_name'=>optional($this->adviserReviewer)->first_name.' '.optional($this->adviserReviewer)->last_name,
                'from_state'=>'submitted',
                'to_state'=>'adviser-approved'
            ];
        }
        $hasCoord = collect($hist)->contains(fn($h)=>($h['action']??'')==='coordinator-approved');
        if (!$hasCoord) {
            $hist[] = [
                'action'=>'coordinator-approved',
                'timestamp'=>$this->coordinator_reviewed_at->toISOString(),
                'user_id'=>$uid,
                'user_name'=>Auth::user()?->first_name.' '.Auth::user()?->last_name,
                'from_state'=>'adviser-approved',
                'to_state'=>'coordinator-approved',
                'comment'=>$comment
            ];
        }
        usort($hist, fn($a,$b)=>strcmp($a['timestamp'],$b['timestamp']));
        $this->workflow_history = $hist;

        $this->save();
        return $this;
    }
}
