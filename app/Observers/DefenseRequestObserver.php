<?php

namespace App\Observers;

use App\Models\DefenseRequest;
use App\Services\StudentRecordSyncService;
use Illuminate\Support\Facades\Log;

class DefenseRequestObserver
{
    protected $syncService;

    public function __construct(StudentRecordSyncService $syncService)
    {
        $this->syncService = $syncService;
    }

    /**
     * Handle the DefenseRequest "updated" event.
     * Note: Primary sync now happens via AaPaymentVerification status = 'ready_for_finance'
     * This is kept for backward compatibility
     */
    public function updated(DefenseRequest $defenseRequest)
    {
        // Check if workflow_state changed to 'completed'
        if ($defenseRequest->isDirty('workflow_state') && 
            $defenseRequest->workflow_state === 'completed') {
            
            Log::info('DefenseRequestObserver: Defense marked as completed', [
                'defense_id' => $defenseRequest->id,
                'note' => 'Sync should happen via AA status ready_for_finance'
            ]);
            
            // Check if AA verification exists and is ready_for_finance
            $aaVerification = \App\Models\AaPaymentVerification::where('defense_request_id', $defenseRequest->id)->first();
            
            if ($aaVerification && $aaVerification->status === 'ready_for_finance') {
                Log::info('DefenseRequestObserver: AA already ready_for_finance, triggering sync', [
                    'defense_id' => $defenseRequest->id
                ]);
                
                try {
                    $this->syncService->syncDefenseToStudentRecord($defenseRequest);
                } catch (\Exception $e) {
                    Log::error('DefenseRequestObserver: Failed to sync student record', [
                        'defense_id' => $defenseRequest->id,
                        'error' => $e->getMessage()
                    ]);
                }
            } else {
                Log::info('DefenseRequestObserver: Waiting for AA status ready_for_finance', [
                    'defense_id' => $defenseRequest->id,
                    'aa_status' => $aaVerification ? $aaVerification->status : 'no AA verification'
                ]);
            }
        }
    }
}