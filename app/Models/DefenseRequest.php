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
        'scheduled_date' => 'datetime',
        'date_of_defense' => 'datetime',
        'submitted_at' => 'datetime',
        'adviser_reviewed_at' => 'datetime',
        'coordinator_reviewed_at' => 'datetime',
        'panels_assigned_at' => 'datetime',
        'schedule_set_at' => 'datetime',
        'adviser_notified_at' => 'datetime',
        'student_notified_at' => 'datetime',
        'panels_notified_at' => 'datetime',
        'last_status_updated_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'workflow_history' => 'array',
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

    /**
     * Create honorarium payments for all assigned panelists
     * This stores the ACTUAL payment amounts at the time of completion
     */
    public function createHonorariumPayments()
    {
        Log::info('Creating honorarium payments', [
            'defense_id' => $this->id,
            'program' => $this->program,
            'defense_type' => $this->defense_type
        ]);

        // Get program level
        $programLevel = ProgramLevel::getLevel($this->program);
        
        Log::info('Program level determined', [
            'defense_id' => $this->id,
            'program' => $this->program,
            'program_level' => $programLevel
        ]);
        
        // Define panelist fields with their roles - MUST MATCH PaymentRate types
        $panelistFields = [
            ['field' => 'defense_chairperson', 'role' => 'Chairperson'], // Matches PaymentRate.type
            ['field' => 'defense_panelist1', 'role' => 'Panel Member'],
            ['field' => 'defense_panelist2', 'role' => 'Panel Member'],
            ['field' => 'defense_panelist3', 'role' => 'Panel Member'],
            ['field' => 'defense_panelist4', 'role' => 'Panel Member'],
        ];

        foreach ($panelistFields as $panelField) {
            $panelistValue = $this->{$panelField['field']};
            if (!$panelistValue) continue;

            // Try to resolve panelist ID
            $panelistId = null;
            $panelistName = $panelistValue;
            
            if (is_numeric($panelistValue)) {
                $panelist = Panelist::find($panelistValue);
                if ($panelist) {
                    $panelistId = $panelist->id;
                    $panelistName = $panelist->name;
                }
            } else {
                // Try to find by name
                $panelist = Panelist::where('name', 'LIKE', '%' . $panelistValue . '%')->first();
                if ($panelist) {
                    $panelistId = $panelist->id;
                    $panelistName = $panelist->name;
                } else {
                    // Create panelist if not found
                    $panelist = Panelist::create([
                        'name' => $panelistValue,
                        'email' => strtolower(str_replace(' ', '.', $panelistValue)) . '@example.com',
                        'status' => 'Assigned'
                    ]);
                    $panelistId = $panelist->id;
                    $panelistName = $panelist->name;
                    Log::info('Created new panelist', [
                        'id' => $panelistId,
                        'name' => $panelistName
                    ]);
                }
            }

            if (!$panelistId) {
                Log::warning("Could not resolve panelist", [
                    'defense_id' => $this->id,
                    'panelist_value' => $panelistValue
                ]);
                continue;
            }

            // Check if payment already exists
            $exists = HonorariumPayment::where('defense_request_id', $this->id)
                ->where('panelist_id', $panelistId)
                ->where('role', $panelField['role'])
                ->exists();
                
            if ($exists) {
                Log::info('Payment already exists, skipping', [
                    'defense_id' => $this->id,
                    'panelist_id' => $panelistId,
                    'role' => $panelField['role']
                ]);
                continue;
            }

            // Get payment rate - THIS IS THE KEY: Store the amount NOW
            $paymentRate = PaymentRate::where('program_level', $programLevel)
                ->where('defense_type', $this->defense_type)
                ->where('type', $panelField['role']) // MUST MATCH: "Chairperson" or "Panel Member"
                ->first();
                
            $amount = 0;
            if ($paymentRate) {
                $amount = floatval($paymentRate->amount);
                Log::info('Payment rate found', [
                    'defense_id' => $this->id,
                    'program_level' => $programLevel,
                    'defense_type' => $this->defense_type,
                    'role' => $panelField['role'],
                    'amount' => $amount
                ]);
            } else {
                Log::warning('No payment rate found', [
                    'defense_id' => $this->id,
                    'program_level' => $programLevel,
                    'defense_type' => $this->defense_type,
                    'role' => $panelField['role']
                ]);
            }

            // Create payment record with ACTUAL amount
            HonorariumPayment::create([
                'defense_request_id' => $this->id,
                'panelist_id' => $panelistId,
                'panelist_type' => 'Panelist',
                'role' => $panelField['role'],
                'amount' => $amount, // STORED AMOUNT - not calculated later
                'payment_date' => now()->format('Y-m-d'),
                'status' => 'Unpaid',
            ]);

            Log::info('Honorarium payment created', [
                'defense_id' => $this->id,
                'panelist_id' => $panelistId,
                'panelist_name' => $panelistName,
                'role' => $panelField['role'],
                'amount' => $amount
            ]);
        }
    }

    public function addWorkflowEntry($action, $comment = null, $userId = null, $from = null, $to = null)
    {
        $hist = is_array($this->workflow_history) ? $this->workflow_history : [];
        $hist[] = [
            'action' => $action,
            'comment' => $comment,
            'timestamp' => now()->toISOString(),
            'user_id' => $userId,
            'user_name' => $userId ? User::find($userId)?->name : null,
            'from_state' => $from,
            'to_state' => $to
        ];
        $this->workflow_history = $hist;
    }

    public function ensureSubmittedHistory()
    {
        // Implementation here
    }

    public function getWorkflowStateDisplayAttribute()
    {
        // Implementation here
    }
}
