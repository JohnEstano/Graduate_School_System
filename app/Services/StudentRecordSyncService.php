<?php

namespace App\Services;

use App\Models\DefenseRequest;
use App\Models\StudentRecord;
use App\Models\PaymentRecord;
use App\Models\PanelistRecord;
use App\Models\ProgramRecord;
use App\Models\HonorariumPayment;
use App\Helpers\ProgramLevel;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StudentRecordSyncService
{
    /**
     * Sync a completed defense request to student records
     */
    public function syncDefenseToStudentRecord(DefenseRequest $defenseRequest)
    {
        Log::info('StudentRecordSyncService: Starting sync', [
            'defense_id' => $defenseRequest->id,
            'workflow_state' => $defenseRequest->workflow_state
        ]);

        // Only sync if defense is completed
        if ($defenseRequest->workflow_state !== 'completed') {
            Log::warning('StudentRecordSyncService: Defense not completed, skipping sync');
            return;
        }

        DB::beginTransaction();
        try {
            // Create or find program record with ALL required fields
            $programRecord = ProgramRecord::firstOrCreate(
                ['name' => $defenseRequest->program],
                [
                    'program' => $defenseRequest->program,
                    'category' => ProgramLevel::getLevel($defenseRequest->program),
                    'recently_updated' => 0, 
                    'time_last_opened' => now(),
                    'date_edited' => now(),
                ]
            );

            Log::info('Program record created', ['id' => $programRecord->id]);

            // Create or update student record
            $studentRecord = StudentRecord::updateOrCreate(
                ['student_id' => $defenseRequest->school_id],
                [
                    'first_name' => $defenseRequest->first_name,
                    'middle_name' => $defenseRequest->middle_name,
                    'last_name' => $defenseRequest->last_name,
                    'program' => $defenseRequest->program,
                    'school_year' => PaymentRecord::getCurrentSchoolYear(),
                ]
            );

            Log::info('Student record created', ['id' => $studentRecord->id]);

            // Get honorarium payments
            $honorariumPayments = HonorariumPayment::where('defense_request_id', $defenseRequest->id)
                ->with('panelist')
                ->get();

            Log::info('Found honorarium payments', ['count' => $honorariumPayments->count()]);

            // Process each payment
            foreach ($honorariumPayments as $honorariumPayment) {
                if (!$honorariumPayment->panelist) {
                    Log::warning('Skipping payment - no panelist', ['payment_id' => $honorariumPayment->id]);
                    continue;
                }

                // Create panelist record with program_record_id
                $panelistRecord = PanelistRecord::firstOrCreate(
                    [
                        'pfirst_name' => $honorariumPayment->panelist->name,
                        'program_record_id' => $programRecord->id,
                    ],
                    [
                        'pmiddle_name' => '',
                        'plast_name' => '',
                        'role' => $honorariumPayment->role,
                        'received_date' => $honorariumPayment->payment_date ?? now(),
                    ]
                );

                Log::info('Panelist record created', [
                    'id' => $panelistRecord->id,
                    'name' => $panelistRecord->pfirst_name
                ]);

                // Create payment record with school year
                $paymentRecord = PaymentRecord::create([
                    'student_record_id' => $studentRecord->id,
                    'panelist_record_id' => $panelistRecord->id,
                    'school_year' => PaymentRecord::getCurrentSchoolYear(),
                    'payment_date' => $honorariumPayment->payment_date ?? now(),
                    'defense_status' => 'completed',
                    'amount' => $honorariumPayment->amount,
                ]);

                Log::info('Payment record created', [
                    'id' => $paymentRecord->id,
                    'amount' => $paymentRecord->amount
                ]);

                // Link panelist to student
                DB::table('panelist_student_records')->insertOrIgnore([
                    'panelist_id' => $panelistRecord->id,
                    'student_id' => $studentRecord->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();
            Log::info('Sync completed successfully', ['defense_id' => $defenseRequest->id]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sync failed', [
                'defense_id' => $defenseRequest->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}