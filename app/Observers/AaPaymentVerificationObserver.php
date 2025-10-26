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
     */
    public function updated(AaPaymentVerification $verification)
    {
        // Check if status changed to 'ready_for_finance'
        if ($verification->isDirty('status') && 
            $verification->status === 'ready_for_finance') {
            
            Log::info('AaPaymentVerificationObserver: Status changed to ready_for_finance, triggering sync', [
                'verification_id' => $verification->id,
                'defense_request_id' => $verification->defense_request_id
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
                $this->syncService->syncDefenseToStudentRecord($defenseRequest);
                Log::info('AaPaymentVerificationObserver: Sync completed successfully');
            } catch (\Exception $e) {
                Log::error('AaPaymentVerificationObserver: Failed to sync student record', [
                    'verification_id' => $verification->id,
                    'defense_request_id' => $verification->defense_request_id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }
    }

    /**
     * Handle the AaPaymentVerification "created" event.
     */
    public function created(AaPaymentVerification $verification)
    {
        // If created with status 'ready_for_finance', trigger sync immediately
        if ($verification->status === 'ready_for_finance') {
            
            Log::info('AaPaymentVerificationObserver: Created with ready_for_finance status, triggering sync', [
                'verification_id' => $verification->id,
                'defense_request_id' => $verification->defense_request_id
            ]);
            
            $defenseRequest = $verification->defenseRequest;
            
            if (!$defenseRequest) {
                Log::error('AaPaymentVerificationObserver: Defense request not found', [
                    'defense_request_id' => $verification->defense_request_id
                ]);
                return;
            }
            
            try {
                $this->syncService->syncDefenseToStudentRecord($defenseRequest);
                Log::info('AaPaymentVerificationObserver: Sync completed successfully');
            } catch (\Exception $e) {
                Log::error('AaPaymentVerificationObserver: Failed to sync student record', [
                    'verification_id' => $verification->id,
                    'defense_request_id' => $verification->defense_request_id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }
    }
}
