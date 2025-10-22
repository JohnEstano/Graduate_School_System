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
     */
    public function updated(DefenseRequest $defenseRequest)
    {
        // Check if workflow_state changed to 'completed'
        if ($defenseRequest->isDirty('workflow_state') && 
            $defenseRequest->workflow_state === 'completed') {
            
            Log::info('DefenseRequestObserver: Defense marked as completed, triggering sync', [
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
        }
    }
}