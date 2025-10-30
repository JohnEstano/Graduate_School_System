<?php

namespace App\Http\Controllers\AA;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AaPaymentVerification;
use App\Models\AaPaymentBatch;
use App\Models\DefenseRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
            'status' => 'required|in:pending,ready_for_finance,in_progress,paid,completed,invalid',
            'remarks' => 'nullable|string',
            'invalid_comment' => 'required_if:status,invalid|string|max:1000',
        ]);

        $verification = AaPaymentVerification::findOrFail($id);

        // Only allow the assigned AA to update
        if ($verification->assigned_to && $verification->assigned_to != Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $verification->status = $request->input('status');
        $verification->remarks = $request->input('remarks');
        
        // Store invalid comment if status is invalid
        if ($request->input('status') === 'invalid') {
            $verification->invalid_comment = $request->input('invalid_comment');
        }
        
        $verification->save();

        return response()->json(['success' => true, 'status' => $verification->status]);
    }

    // Update AA verification status by defense request ID
    public function updateStatusByDefenseRequest(Request $request, $defenseRequestId)
    {
        $request->validate([
            'status' => 'required|in:pending,ready_for_finance,in_progress,paid,completed,invalid',
            'remarks' => 'nullable|string',
            'invalid_comment' => 'required_if:status,invalid|string|max:1000',
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
        
        // Store invalid comment if status is invalid
        if ($request->input('status') === 'invalid') {
            $verification->invalid_comment = $request->input('invalid_comment');
        }
        
        $verification->assigned_to = Auth::id(); // Ensure current user is assigned
        $verification->save();

        // Add workflow history entry
        $hist = $defenseRequest->workflow_history ?? [];
        $statusLabel = match($request->input('status')) {
            'ready_for_finance' => 'Payment Ready for Finance',
            'in_progress' => 'Payment In Progress',
            'paid' => 'Payment Paid',
            'completed' => 'Payment Completed',
            'invalid' => 'Payment Invalid',
            default => 'Payment Status Updated'
        };
        
        $eventData = [
            'event_type' => $statusLabel,
            'user_name' => Auth::user()->name,
            'user_id' => Auth::id(),
            'created_at' => now()->toDateTimeString(),
            'status' => $request->input('status'),
        ];
        
        // Add invalid comment to workflow history if present
        if ($request->input('status') === 'invalid' && $request->input('invalid_comment')) {
            $eventData['comment'] = $request->input('invalid_comment');
        }
        
        $hist[] = $eventData;
        $defenseRequest->workflow_history = $hist;
        $defenseRequest->save();

        // ✅ CRITICAL: When status becomes 'ready_for_finance', create ALL records DIRECTLY
        if ($request->input('status') === 'ready_for_finance' && $oldStatus !== 'ready_for_finance') {
            $this->createHonorariumRecords($defenseRequest);
            $this->createStudentAndPanelistRecords($defenseRequest);
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
        // Calculate program level from program name
        $programLevel = \App\Helpers\ProgramLevel::getLevel($defenseRequest->program);
        
        \Log::info('Creating honorarium records', [
            'defense_id' => $defenseRequest->id,
            'program' => $defenseRequest->program,
            'program_level' => $programLevel,
            'defense_type' => $defenseRequest->defense_type,
        ]);
        
        // Get payment rates
        $paymentRates = \App\Models\PaymentRate::where('program_level', $programLevel)
            ->where('defense_type', $defenseRequest->defense_type)
            ->get()
            ->keyBy('type');
        
        if ($paymentRates->isEmpty()) {
            \Log::error('No payment rates found', [
                'program_level' => $programLevel,
                'defense_type' => $defenseRequest->defense_type,
            ]);
            throw new \Exception("No payment rates found for {$programLevel} - {$defenseRequest->defense_type}");
        }
        
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
        
        // Panel Chair
        $panelChairRate = $paymentRates->get('Panel Chair');
        if ($defenseRequest->defense_chairperson && $panelChairRate) {
            \App\Models\HonorariumPayment::updateOrCreate(
                [
                    'defense_request_id' => $defenseRequest->id,
                    'panelist_name' => $defenseRequest->defense_chairperson,
                    'role' => 'Panel Chair',
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
        
        // Panel Members - each with their own numbered rate (Panel Member 1, 2, 3, 4)
        $panelMembers = [
            ['name' => $defenseRequest->defense_panelist1, 'role' => 'Panel Member 1'],
            ['name' => $defenseRequest->defense_panelist2, 'role' => 'Panel Member 2'],
            ['name' => $defenseRequest->defense_panelist3, 'role' => 'Panel Member 3'],
            ['name' => $defenseRequest->defense_panelist4, 'role' => 'Panel Member 4'],
        ];
        
        foreach ($panelMembers as $member) {
            if (!$member['name']) continue;
            
            // Try to find specific rate (Panel Member 1, 2, etc.) or fall back to Panel Member 1
            $memberRate = $paymentRates->get($member['role']) ?? $paymentRates->get('Panel Member 1') ?? $paymentRates->get('Panel Member');
            
            if (!$memberRate) {
                \Log::warning('No Panel Member rate found', [
                    'role' => $member['role'],
                    'program' => $defenseRequest->program,
                    'program_level' => $programLevel,
                    'defense_type' => $defenseRequest->defense_type
                ]);
                continue;
            }
            
            \App\Models\HonorariumPayment::updateOrCreate(
                [
                    'defense_request_id' => $defenseRequest->id,
                    'panelist_name' => $member['name'],
                    'role' => $member['role'],
                ],
                [
                    'panelist_type' => 'faculty',
                    'amount' => $memberRate->amount,
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
            'adviser_count' => $defenseRequest->defense_adviser ? 1 : 0,
            'panel_chair_count' => $defenseRequest->defense_chairperson ? 1 : 0,
            'panel_members_count' => count(array_filter([
                $defenseRequest->defense_panelist1,
                $defenseRequest->defense_panelist2,
                $defenseRequest->defense_panelist3,
                $defenseRequest->defense_panelist4,
            ])),
        ]);
    }

    /**
     * DIRECTLY create student records and panelist records - NO SYNC SERVICE
     */
    private function createStudentAndPanelistRecords(DefenseRequest $defenseRequest)
    {
        try {
            $programLevel = \App\Helpers\ProgramLevel::getLevel($defenseRequest->program);
            $studentName = trim("{$defenseRequest->first_name} {$defenseRequest->middle_name} {$defenseRequest->last_name}");
            
            \Log::info("🚀 DIRECT CREATE - Starting for Defense #{$defenseRequest->id}");
            
            // 1. GET OR CREATE PROGRAM RECORD
            $programRecord = \App\Models\ProgramRecord::firstOrCreate(
                [
                    'program_name' => $defenseRequest->program,
                    'defense_type' => $defenseRequest->defense_type,
                    'program_category' => strtolower($programLevel) === 'doctorate' ? 'Doctorate' : 'Masters',
                ],
                ['created_at' => now(), 'updated_at' => now()]
            );
            
            \Log::info("✅ Program Record: #{$programRecord->id} - {$programRecord->program_name}");
            
            // 2. CREATE STUDENT RECORD
            $studentRecord = \App\Models\StudentRecord::updateOrCreate(
                ['defense_request_id' => $defenseRequest->id],
                [
                    'program_record_id' => $programRecord->id,
                    'student_name' => $studentName,
                    'defense_date' => $defenseRequest->scheduled_date,
                    'thesis_title' => $defenseRequest->thesis_title ?? 'N/A',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
            
            \Log::info("✅ Student Record: #{$studentRecord->id} - {$studentRecord->student_name}");
            
            // 3. GET ALL HONORARIUM PAYMENTS (excluding Adviser)
            $honorariumPayments = \App\Models\HonorariumPayment::where('defense_request_id', $defenseRequest->id)
                ->get();
            
            \Log::info("📋 Found {$honorariumPayments->count()} honorarium payments");
            
            // 4. CREATE PANELIST RECORDS + PAYMENT RECORDS + PIVOT
            foreach ($honorariumPayments as $honorarium) {
                $role = $honorarium->role;
                $panelistName = $honorarium->panelist_name;
                
                // SKIP ADVISERS
                if (strtolower($role) === 'adviser' || str_contains(strtolower($role), 'advis')) {
                    \Log::info("⏭️  SKIPPING Adviser: {$panelistName}");
                    continue;
                }
                
                // CREATE PANELIST RECORD
                $panelistRecord = \App\Models\PanelistRecord::firstOrCreate(
                    [
                        'program_record_id' => $programRecord->id,
                        'panelist_name' => $panelistName,
                        'role' => $role,
                    ],
                    ['created_at' => now(), 'updated_at' => now()]
                );
                
                \Log::info("✅ Panelist Record: #{$panelistRecord->id} - {$panelistRecord->panelist_name} ({$role})");
                
                // CREATE PAYMENT RECORD
                $paymentRecord = \App\Models\PaymentRecord::updateOrCreate(
                    [
                        'panelist_record_id' => $panelistRecord->id,
                        'student_record_id' => $studentRecord->id,
                    ],
                    [
                        'defense_date' => $defenseRequest->scheduled_date,
                        'amount' => $honorarium->amount,
                        'role' => $role,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
                
                \Log::info("✅ Payment Record: #{$paymentRecord->id} - ₱{$paymentRecord->amount}");
                
                // CREATE PIVOT LINK
                \DB::table('panelist_student_records')->updateOrInsert(
                    [
                        'panelist_record_id' => $panelistRecord->id,
                        'student_record_id' => $studentRecord->id,
                    ],
                    [
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
                
                \Log::info("✅ Pivot Link Created");
            }
            
            \Log::info("🎉 DIRECT CREATE COMPLETE for Defense #{$defenseRequest->id}");
            \Log::info("📍 Check records at:");
            \Log::info("   - /honorarium/individual-record/{$programRecord->id}");
            \Log::info("   - /student-records/program/{$programRecord->id}");
            
        } catch (\Exception $e) {
            \Log::error("❌ DIRECT CREATE FAILED: " . $e->getMessage());
            \Log::error("Stack trace: " . $e->getTraceAsString());
            throw $e;
        }
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
            'status' => 'required|in:pending,ready_for_finance,in_progress,paid,completed,invalid',
            'invalid_comment' => 'required_if:status,invalid|string|max:1000',
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
                
                // Store invalid comment if status is invalid
                if ($request->status === 'invalid') {
                    $verification->invalid_comment = $request->input('invalid_comment');
                }
                
                $verification->save();

                // Add workflow history entry
                $defenseRequest = DefenseRequest::find($defenseRequestId);
                if ($defenseRequest) {
                    $hist = $defenseRequest->workflow_history ?? [];
                    $statusLabel = match($request->status) {
                        'ready_for_finance' => 'Payment Ready for Finance',
                        'in_progress' => 'Payment In Progress',
                        'paid' => 'Payment Paid',
                        'completed' => 'Payment Completed',
                        'invalid' => 'Payment Invalid',
                        default => 'Payment Status Updated'
                    };
                    
                    $eventData = [
                        'event_type' => $statusLabel,
                        'user_name' => Auth::user()->name,
                        'user_id' => Auth::id(),
                        'created_at' => now()->toDateTimeString(),
                        'status' => $request->status,
                    ];
                    
                    // Add invalid comment to workflow history if present
                    if ($request->status === 'invalid' && $request->input('invalid_comment')) {
                        $eventData['comment'] = $request->input('invalid_comment');
                    }
                    
                    $hist[] = $eventData;
                    $defenseRequest->workflow_history = $hist;
                    $defenseRequest->save();

                    // If changing to ready_for_finance, create honorarium records
                    if ($request->status === 'ready_for_finance' && $oldStatus !== 'ready_for_finance') {
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
