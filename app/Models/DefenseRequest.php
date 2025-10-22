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
        try {
            // Prevent duplicate payments
            if ($this->honorariumPayments()->exists()) {
                Log::info('Honorarium payments already exist for defense', ['defense_id' => $this->id]);
                return;
            }

            // Get program level to fetch correct rates
            $programLevel = ProgramLevel::getLevel($this->program);
            
            Log::info('Creating honorarium payments', [
                'defense_id' => $this->id,
                'program' => $this->program,
                'program_level' => $programLevel,
                'defense_type' => $this->defense_type
            ]);

            $paymentsCreated = [];

            // 1️⃣ CREATE HONORARIUM FOR ADVISER
            if ($this->adviser_user_id) {
                try {
                    $adviser = User::find($this->adviser_user_id);
                    
                    if ($adviser) {
                        // Get adviser rate
                        $adviserRate = PaymentRate::where('program_level', $programLevel)
                            ->where('defense_type', $this->defense_type)
                            ->where('type', 'Adviser')
                            ->first();

                        if (!$adviserRate) {
                            Log::warning('No adviser rate found', [
                                'program_level' => $programLevel,
                                'defense_type' => $this->defense_type
                            ]);
                        }

                        // Find or create panelist record for adviser
                        $adviserPanelist = Panelist::firstOrCreate(
                            [
                                'name' => trim($adviser->first_name . ' ' . $adviser->last_name),
                                'email' => $adviser->email,
                            ],
                            [
                                'role' => 'Adviser',
                                'status' => 'Active',
                            ]
                        );

                        $adviserPayment = HonorariumPayment::create([
                            'defense_request_id' => $this->id,
                            'panelist_id' => $adviserPanelist->id,
                            'panelist_type' => 'Panelist',
                            'role' => 'Adviser',
                            'amount' => $adviserRate ? $adviserRate->amount : 0,
                            'payment_date' => null,
                            'status' => 'Unpaid',
                        ]);

                        $paymentsCreated[] = [
                            'role' => 'Adviser',
                            'name' => $adviserPanelist->name,
                            'amount' => $adviserPayment->amount
                        ];

                        Log::info('Adviser honorarium payment created', [
                            'defense_id' => $this->id,
                            'adviser_name' => $adviserPanelist->name,
                            'amount' => $adviserPayment->amount
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to create adviser honorarium', [
                        'defense_id' => $this->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // 2️⃣ CREATE HONORARIUM FOR PANEL CHAIR
            if ($this->defense_chairperson) {
                try {
                    $chair = Panelist::where('name', $this->defense_chairperson)->first();
                    
                    if ($chair) {
                        // Get panel chair rate
                        $chairRate = PaymentRate::where('program_level', $programLevel)
                            ->where('defense_type', $this->defense_type)
                            ->where('type', 'Panel Chair')
                            ->first();

                        if (!$chairRate) {
                            Log::warning('No panel chair rate found', [
                                'program_level' => $programLevel,
                                'defense_type' => $this->defense_type
                            ]);
                        }

                        $chairPayment = HonorariumPayment::create([
                            'defense_request_id' => $this->id,
                            'panelist_id' => $chair->id,
                            'panelist_type' => 'Panelist',
                            'role' => 'Panel Chair',
                            'amount' => $chairRate ? $chairRate->amount : 0,
                            'payment_date' => null,
                            'status' => 'Unpaid',
                        ]);

                        $paymentsCreated[] = [
                            'role' => 'Panel Chair',
                            'name' => $chair->name,
                            'amount' => $chairPayment->amount
                        ];

                        Log::info('Panel Chair honorarium payment created', [
                            'defense_id' => $this->id,
                            'chair_name' => $chair->name,
                            'amount' => $chairPayment->amount
                        ]);
                    } else {
                        Log::warning('Panel chair not found', [
                            'defense_id' => $this->id,
                            'chair_name' => $this->defense_chairperson
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to create chair honorarium', [
                        'defense_id' => $this->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // 3️⃣ CREATE HONORARIUM FOR ALL PANEL MEMBERS
            $panelistFields = [
                ['name' => $this->defense_panelist1, 'type' => 'Panel Member 1'],
                ['name' => $this->defense_panelist2, 'type' => 'Panel Member 2'],
                ['name' => $this->defense_panelist3, 'type' => 'Panel Member 3'],
                ['name' => $this->defense_panelist4, 'type' => 'Panel Member 4'],
            ];

            foreach ($panelistFields as $panelistData) {
                if (!$panelistData['name']) continue;

                try {
                    $panelist = Panelist::where('name', $panelistData['name'])->first();
                    
                    if ($panelist) {
                        // Get panel member rate
                        $memberRate = PaymentRate::where('program_level', $programLevel)
                            ->where('defense_type', $this->defense_type)
                            ->where('type', $panelistData['type'])
                            ->first();

                        if (!$memberRate) {
                            Log::warning('No panel member rate found', [
                                'program_level' => $programLevel,
                                'defense_type' => $this->defense_type,
                                'type' => $panelistData['type']
                            ]);
                        }

                        $memberPayment = HonorariumPayment::create([
                            'defense_request_id' => $this->id,
                            'panelist_id' => $panelist->id,
                            'panelist_type' => 'Panelist',
                            'role' => 'Panel Member',
                            'amount' => $memberRate ? $memberRate->amount : 0,
                            'payment_date' => null,
                            'status' => 'Unpaid',
                        ]);

                        $paymentsCreated[] = [
                            'role' => 'Panel Member',
                            'name' => $panelist->name,
                            'amount' => $memberPayment->amount
                        ];

                        Log::info('Panel Member honorarium payment created', [
                            'defense_id' => $this->id,
                            'member_name' => $panelist->name,
                            'amount' => $memberPayment->amount
                        ]);
                    } else {
                        Log::warning('Panel member not found', [
                            'defense_id' => $this->id,
                            'member_name' => $panelistData['name']
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to create member honorarium', [
                        'defense_id' => $this->id,
                        'panelist_name' => $panelistData['name'],
                        'error' => $e->getMessage()
                    ]);
                }
            }

            Log::info('All honorarium payments created successfully', [
                'defense_id' => $this->id,
                'total_payments' => count($paymentsCreated),
                'breakdown' => $paymentsCreated
            ]);

        } catch (\Exception $e) {
            Log::error('Critical error in createHonorariumPayments', [
                'defense_id' => $this->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Get the AA payment verification record for this defense request
     */
    public function aaVerification()
    {
        return $this->hasOne(\App\Models\AaPaymentVerification::class, 'defense_request_id');
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
