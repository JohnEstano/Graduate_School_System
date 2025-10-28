<?php

namespace App\Observers;

use App\Models\AaPaymentVerification;
use App\Services\StudentRecordSyncService;
use Illuminate\Support\Facades\Log;

class AaPaymentVerificationObserver
{
    protected $syncService;

    public function __construct(StudentRecordSyncService $syncService)
    {
        $this->syncService = $syncService;
    }

    /**
     * Handle the AaPaymentVerification "updated" event.
     * Triggers HonorariumPayment creation and sync when status changes to 'ready_for_finance'
     */
    public function updated(AaPaymentVerification $verification)
    {
        // Check if status changed to 'ready_for_finance'
        if ($verification->isDirty('status') && $verification->status === 'ready_for_finance') {
            
            Log::info('AaPaymentVerificationObserver: Status changed to ready_for_finance', [
                'verification_id' => $verification->id,
                'defense_request_id' => $verification->defense_request_id,
                'new_status' => $verification->status
            ]);
            
            // Load the defense request
            $defenseRequest = $verification->defenseRequest;
            
            if (!$defenseRequest) {
                Log::error('AaPaymentVerificationObserver: Defense request not found', [
                    'defense_request_id' => $verification->defense_request_id
                ]);
                return;
            }
            
            try {
                // Step 1: Create HonorariumPayments
                $this->createHonorariumPayments($defenseRequest);
                
                // Step 2: Sync to student/panelist records
                $this->syncService->syncDefenseToStudentRecord($defenseRequest);
                
                Log::info('AaPaymentVerificationObserver: Payments created and sync completed successfully');
            } catch (\Exception $e) {
                Log::error('AaPaymentVerificationObserver: Failed to create payments or sync', [
                    'verification_id' => $verification->id,
                    'defense_request_id' => $verification->defense_request_id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }
    }

    /**
     * Create HonorariumPayments for all panel members and adviser
     */
    protected function createHonorariumPayments($defenseRequest)
    {
        Log::info('Creating honorarium payments', [
            'defense_id' => $defenseRequest->id,
            'program' => $defenseRequest->program,
            'defense_type' => $defenseRequest->defense_type
        ]);

        // Get program level
        $programLevel = \App\Helpers\ProgramLevel::getLevel($defenseRequest->program);

        // Create payments for each committee member
        $members = [
            ['role' => 'Adviser', 'name' => $defenseRequest->defense_adviser],
            ['role' => 'Panel Chair', 'name' => $defenseRequest->defense_chairperson],
            ['role' => 'Panel Member 1', 'name' => $defenseRequest->defense_panelist1],
            ['role' => 'Panel Member 2', 'name' => $defenseRequest->defense_panelist2],
            ['role' => 'Panel Member 3', 'name' => $defenseRequest->defense_panelist3],
            ['role' => 'Panel Member 4', 'name' => $defenseRequest->defense_panelist4],
        ];

        $paymentsCreated = 0;
        foreach ($members as $member) {
            if (empty($member['name'])) {
                continue;
            }

            // Check if payment already exists
            $exists = \App\Models\HonorariumPayment::where('defense_request_id', $defenseRequest->id)
                ->where('panelist_name', $member['name'])
                ->where('role', $member['role'])
                ->exists();

            if ($exists) {
                Log::info('Payment already exists, skipping', [
                    'role' => $member['role'],
                    'name' => $member['name']
                ]);
                continue;
            }

            // Map role to payment rate type
            if ($member['role'] === 'Adviser') {
                $rateType = 'Adviser';
            } elseif ($member['role'] === 'Panel Chair') {
                $rateType = 'Panel Chair';
            } elseif (str_contains($member['role'], 'Panel Member')) {
                // Panel Member 1, Panel Member 2, etc. -> Panel Member
                $rateType = 'Panel Member';
            } else {
                // Default fallback
                $rateType = $member['role'];
            }

            // Get rate for this role
            $rate = \App\Models\PaymentRate::where('program_level', $programLevel)
                ->where('defense_type', $defenseRequest->defense_type)
                ->where('type', $rateType)
                ->first();

            if (!$rate) {
                Log::warning('No payment rate found', [
                    'program_level' => $programLevel,
                    'defense_type' => $defenseRequest->defense_type,
                    'role' => $member['role']
                ]);
                continue;
            }

            // Try to find panelist by name
            $panelist = \App\Models\Panelist::where('name', $member['name'])->first();

            // Create honorarium payment
            $payment = \App\Models\HonorariumPayment::create([
                'defense_request_id' => $defenseRequest->id,
                'panelist_id' => $panelist?->id,
                'panelist_name' => $member['name'],
                'role' => $member['role'],
                'amount' => $rate->amount,
                'payment_status' => 'pending',
                'payment_date' => $defenseRequest->payment_date,
                'defense_date' => $defenseRequest->scheduled_date,
                'student_name' => trim($defenseRequest->first_name . ' ' . $defenseRequest->last_name),
                'program' => $defenseRequest->program,
                'defense_type' => $defenseRequest->defense_type,
            ]);

            Log::info('Payment created', [
                'payment_id' => $payment->id,
                'role' => $member['role'],
                'amount' => $rate->amount
            ]);

            $paymentsCreated++;
        }

        Log::info('Honorarium payments creation completed', [
            'defense_id' => $defenseRequest->id,
            'payments_created' => $paymentsCreated
        ]);
    }

    /**
     * Handle the AaPaymentVerification "created" event.
     * Triggers payments and sync if created with 'ready_for_finance' status
     */
    public function created(AaPaymentVerification $verification)
    {
        // If created with status 'ready_for_finance', trigger payments and sync immediately
        if ($verification->status === 'ready_for_finance') {
            
            Log::info('AaPaymentVerificationObserver: Created with ready_for_finance status', [
                'verification_id' => $verification->id,
                'defense_request_id' => $verification->defense_request_id,
                'status' => $verification->status
            ]);
            
            $defenseRequest = $verification->defenseRequest;
            
            if (!$defenseRequest) {
                Log::error('AaPaymentVerificationObserver: Defense request not found', [
                    'defense_request_id' => $verification->defense_request_id
                ]);
                return;
            }
            
            try {
                // Step 1: Create HonorariumPayments
                $this->createHonorariumPayments($defenseRequest);
                
                // Step 2: Sync to student/panelist records
                $this->syncService->syncDefenseToStudentRecord($defenseRequest);
                
                Log::info('AaPaymentVerificationObserver: Payments created and sync completed successfully');
            } catch (\Exception $e) {
                Log::error('AaPaymentVerificationObserver: Failed to create payments or sync', [
                    'verification_id' => $verification->id,
                    'defense_request_id' => $verification->defense_request_id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }
    }
}
