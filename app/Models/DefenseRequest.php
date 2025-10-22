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
            Log::info('Creating honorarium payments for defense', [
                'defense_id' => $this->id,
                'program' => $this->program,
                'defense_type' => $this->defense_type
            ]);

            $programLevel = ProgramLevel::getLevel($this->program);
            
            Log::info('Program level determined', [
                'program' => $this->program,
                'program_level' => $programLevel
            ]);

            // Define panelist fields with their roles
            $panelistFields = [
                ['field' => 'defense_adviser', 'role' => 'Adviser', 'rate_lookup' => 'Adviser'],
                ['field' => 'defense_chairperson', 'role' => 'Panel Chair', 'rate_lookup' => 'Panel Chair'],
                ['field' => 'defense_panelist1', 'role' => 'Panel Member 1', 'rate_lookup' => 'Panel Member'],
                ['field' => 'defense_panelist2', 'role' => 'Panel Member 2', 'rate_lookup' => 'Panel Member'],
                ['field' => 'defense_panelist3', 'role' => 'Panel Member 3', 'rate_lookup' => 'Panel Member'],
                ['field' => 'defense_panelist4', 'role' => 'Panel Member 4', 'rate_lookup' => 'Panel Member'],
            ];

            $paymentsCreated = 0;

            foreach ($panelistFields as $config) {
                $fieldName = $config['field'];
                $role = $config['role'];
                $rateLookup = $config['rate_lookup'];
                $panelistName = $this->$fieldName;

                if (empty($panelistName)) {
                    Log::info("Skipping empty field: {$fieldName}");
                    continue;
                }

                Log::info('Processing panelist', [
                    'field' => $fieldName,
                    'name' => $panelistName,
                    'role_to_store' => $role,
                    'rate_lookup_type' => $rateLookup
                ]);

                // Find panelist by name - SIMPLIFIED since table only has 'name' column
                $panelist = Panelist::where('name', 'LIKE', "%{$panelistName}%")->first();

                if (!$panelist) {
                    Log::warning('Panelist not found in database', [
                        'name' => $panelistName,
                        'field' => $fieldName
                    ]);
                    continue;
                }

                Log::info('Panelist found', [
                    'panelist_id' => $panelist->id,
                    'name' => $panelist->name
                ]);

                // Get payment rate using the lookup type
                $rate = PaymentRate::where('program_level', $programLevel)
                    ->where('defense_type', $this->defense_type)
                    ->where('type', $rateLookup)
                    ->first();

                if (!$rate) {
                    Log::warning('Payment rate not found', [
                        'program_level' => $programLevel,
                        'defense_type' => $this->defense_type,
                        'rate_lookup_type' => $rateLookup,
                        'available_rates' => PaymentRate::where('program_level', $programLevel)
                            ->where('defense_type', $this->defense_type)
                            ->pluck('type')->toArray()
                    ]);
                    continue;
                }

                Log::info('Payment rate found', [
                    'program_level' => $programLevel,
                    'defense_type' => $this->defense_type,
                    'rate_type' => $rateLookup,
                    'amount' => $rate->amount
                ]);

                // Check if payment already exists
                $existingPayment = HonorariumPayment::where('defense_request_id', $this->id)
                    ->where('panelist_id', $panelist->id)
                    ->where('role', $role)
                    ->first();

                if ($existingPayment) {
                    Log::info('Payment already exists, skipping', [
                        'payment_id' => $existingPayment->id
                    ]);
                    continue;
                }

                // Create honorarium payment
                $payment = HonorariumPayment::create([
                    'defense_request_id' => $this->id,
                    'panelist_id' => $panelist->id,
                    'panelist_type' => 'Panelist',
                    'role' => $role,
                    'amount' => $rate->amount,
                    'payment_date' => null,
                    'status' => 'Unpaid',
                ]);

                $paymentsCreated++;

                Log::info('Honorarium payment created', [
                    'payment_id' => $payment->id,
                    'panelist' => $panelist->name,
                    'role' => $role,
                    'amount' => $rate->amount
                ]);
            }

            Log::info('Honorarium payments creation completed', [
                'defense_id' => $this->id,
                'payments_created' => $paymentsCreated
            ]);

            return $paymentsCreated;

        } catch (\Exception $e) {
            Log::error('Failed to create honorarium payments', [
                'defense_id' => $this->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
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
