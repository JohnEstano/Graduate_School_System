<?php

namespace App\Http\Controllers\AA;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AaPaymentVerification;
use App\Models\AaPaymentBatch;
use App\Models\DefenseRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Response;

class PaymentVerificationController extends Controller
{
    // List all verifications assigned to the current AA
    public function index()
    {
        $verifications = AaPaymentVerification::with('defenseRequest')
            ->where('assigned_to', Auth::id())
            ->get();

        return view('administrative-assistant.payment-verification', compact('verifications'));
    }

    // Update status (verify/reject)
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,ready_for_finance,in_progress,paid,completed',
            'remarks' => 'nullable|string',
        ]);

        $verification = AaPaymentVerification::findOrFail($id);

        // Only allow the assigned AA to update
        if ($verification->assigned_to && $verification->assigned_to != Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $verification->status = $request->input('status');
        $verification->remarks = $request->input('remarks');
        $verification->save();

        return response()->json(['success' => true, 'status' => $verification->status]);
    }

    // Update AA verification status by defense request ID
    public function updateStatusByDefenseRequest(Request $request, $defenseRequestId)
    {
        $request->validate([
            'status' => 'required|in:pending,ready_for_finance,in_progress,paid,completed',
            'remarks' => 'nullable|string',
        ]);

        $defenseRequest = DefenseRequest::findOrFail($defenseRequestId);
        
        // Get or create AA verification record
        $verification = AaPaymentVerification::firstOrCreate(
            ['defense_request_id' => $defenseRequestId],
            [
                'assigned_to' => Auth::id(),
                'status' => 'pending',
            ]
        );

        $oldStatus = $verification->status;
        
        // Update status
        $verification->status = $request->input('status');
        $verification->remarks = $request->input('remarks');
        $verification->assigned_to = Auth::id(); // Ensure current user is assigned
        $verification->save();

        // ✅ CRITICAL: When status becomes 'ready_for_finance', create honorarium records and sync
        if ($request->input('status') === 'ready_for_finance' && $oldStatus !== 'ready_for_finance') {
            $this->createHonorariumRecords($defenseRequest);
            
            // Trigger sync to student_records and panelist_records
            try {
                $syncService = app(\App\Services\StudentRecordSyncService::class);
                $syncService->syncDefenseToStudentRecord($defenseRequest);
                
                \Log::info('✅ AA Workflow: Honorarium and student records created', [
                    'defense_request_id' => $defenseRequestId,
                    'status' => 'ready_for_finance'
                ]);
            } catch (\Exception $e) {
                \Log::error('❌ AA Workflow: Sync failed', [
                    'defense_request_id' => $defenseRequestId,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return response()->json([
            'success' => true, 
            'status' => $verification->status,
            'aa_verification_id' => $verification->id
        ]);
    }
    
    /**
     * Create honorarium payment records for all panelists
     */
    private function createHonorariumRecords(DefenseRequest $defenseRequest)
    {
        // Get payment rates
        $paymentRates = \App\Models\PaymentRate::where('program_level', $defenseRequest->program_level)
            ->where('defense_type', $defenseRequest->defense_type)
            ->get()
            ->keyBy('type');
        
        $studentName = trim("{$defenseRequest->first_name} {$defenseRequest->middle_name} {$defenseRequest->last_name}");
        
        // Create adviser honorarium if exists
        if ($defenseRequest->defense_adviser) {
            $adviserRate = $paymentRates->get('Adviser');
            if ($adviserRate) {
                \App\Models\HonorariumPayment::updateOrCreate(
                    [
                        'defense_request_id' => $defenseRequest->id,
                        'panelist_name' => $defenseRequest->defense_adviser,
                        'role' => 'Adviser',
                    ],
                    [
                        'panelist_type' => 'faculty',
                        'amount' => $adviserRate->amount,
                        'payment_status' => 'pending',
                        'defense_date' => $defenseRequest->scheduled_date,
                        'student_name' => $studentName,
                        'program' => $defenseRequest->program,
                        'defense_type' => $defenseRequest->defense_type,
                    ]
                );
            }
        }
        
        // Panel members (chairperson and panelists 1-4) all get Panel Chair rate
        $panelChairRate = $paymentRates->get('Panel Chair');
        if (!$panelChairRate) {
            \Log::warning('No Panel Chair rate found', [
                'program_level' => $defenseRequest->program_level,
                'defense_type' => $defenseRequest->defense_type
            ]);
            return;
        }
        
        $panelMembers = [
            ['name' => $defenseRequest->defense_chairperson, 'role' => 'Panel Chair'],
            ['name' => $defenseRequest->defense_panelist1, 'role' => 'Panel Member'],
            ['name' => $defenseRequest->defense_panelist2, 'role' => 'Panel Member'],
            ['name' => $defenseRequest->defense_panelist3, 'role' => 'Panel Member'],
            ['name' => $defenseRequest->defense_panelist4, 'role' => 'Panel Member'],
        ];
        
        foreach ($panelMembers as $member) {
            if (!$member['name']) continue;
            
            \App\Models\HonorariumPayment::updateOrCreate(
                [
                    'defense_request_id' => $defenseRequest->id,
                    'panelist_name' => $member['name'],
                    'role' => $member['role'],
                ],
                [
                    'panelist_type' => 'faculty',
                    'amount' => $panelChairRate->amount,
                    'payment_status' => 'pending',
                    'defense_date' => $defenseRequest->scheduled_date,
                    'student_name' => $studentName,
                    'program' => $defenseRequest->program,
                    'defense_type' => $defenseRequest->defense_type,
                ]
            );
        }
        
        \Log::info('✅ Honorarium records created', [
            'defense_request_id' => $defenseRequest->id,
            'total_records' => count($panelMembers) + ($defenseRequest->defense_adviser ? 1 : 0)
        ]);
    }

    // Add to batch
    public function addToBatch(Request $request)
    {
        $batch = AaPaymentBatch::create([
            'name' => $request->input('name'),
            'created_by' => Auth::id(),
            'status' => 'pending',
        ]);

        AaPaymentVerification::whereIn('id', $request->input('verification_ids', []))
            ->update(['batch_id' => $batch->id]);

        return back()->with('success', 'Batch created and requests added.');
    }

    // Export batch to CSV
    public function exportBatch($batchId)
    {
        $batch = AaPaymentBatch::with('verifications.defenseRequest')->findOrFail($batchId);

        $csv = "ID,Defense Request,Status,Remarks\n";
        foreach ($batch->verifications as $v) {
            $csv .= "{$v->id},{$v->defenseRequest->id},{$v->status},\"{$v->remarks}\"\n";
        }

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=batch_{$batch->id}.csv",
        ]);
    }

    // Bulk update status
    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'defense_request_ids' => 'sometimes|array',
            'defense_request_ids.*' => 'integer|exists:defense_requests,id',
            'verification_ids' => 'sometimes|array',
            'verification_ids.*' => 'integer|exists:aa_payment_verifications,id',
            'status' => 'required|in:pending,ready_for_finance,in_progress,paid,completed',
        ]);

        $updated = 0;

        // Handle defense_request_ids (preferred method)
        if ($request->has('defense_request_ids')) {
            foreach ($request->defense_request_ids as $defenseRequestId) {
                $verification = AaPaymentVerification::firstOrCreate(
                    ['defense_request_id' => $defenseRequestId],
                    [
                        'assigned_to' => Auth::id(),
                        'status' => 'pending',
                    ]
                );

                $oldStatus = $verification->status;
                $verification->status = $request->status;
                $verification->assigned_to = Auth::id();
                $verification->save();

                // If changing to ready_for_finance, create honorarium records
                if ($request->status === 'ready_for_finance' && $oldStatus !== 'ready_for_finance') {
                    $defenseRequest = DefenseRequest::find($defenseRequestId);
                    if ($defenseRequest) {
                        $this->createHonorariumRecords($defenseRequest);
                        
                        try {
                            $syncService = app(\App\Services\StudentRecordSyncService::class);
                            $syncService->syncDefenseToStudentRecord($defenseRequest);
                        } catch (\Exception $e) {
                            \Log::error('Bulk AA Workflow: Sync failed', [
                                'defense_request_id' => $defenseRequestId,
                                'error' => $e->getMessage()
                            ]);
                        }
                    }
                }

                $updated++;
            }
        } 
        // Handle verification_ids (legacy method)
        elseif ($request->has('verification_ids')) {
            $updated = AaPaymentVerification::whereIn('id', $request->verification_ids)
                ->update(['status' => $request->status]);
        }

        return response()->json(['success' => true, 'updated_count' => $updated]);
    }
}
