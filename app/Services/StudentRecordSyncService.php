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
     * Sync a defense request to student records
     * Now triggered by AA Payment Verification status = 'ready_for_finance'
     */
    public function syncDefenseToStudentRecord(DefenseRequest $defenseRequest)
    {
        Log::info('StudentRecordSyncService: Starting sync', [
            'defense_id' => $defenseRequest->id,
            'workflow_state' => $defenseRequest->workflow_state
        ]);

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

            // Create or update student record with program_record_id and all defense info
            $studentRecord = StudentRecord::updateOrCreate(
                ['student_id' => $defenseRequest->school_id],
                [
                    'first_name' => $defenseRequest->first_name,
                    'middle_name' => $defenseRequest->middle_name,
                    'last_name' => $defenseRequest->last_name,
                    'program' => $defenseRequest->program,
                    'program_record_id' => $programRecord->id, // ✅ Link to program
                    'school_year' => PaymentRecord::getCurrentSchoolYear(),
                    'defense_date' => $defenseRequest->scheduled_date, // ✅ Get from scheduled_date
                    'defense_type' => $defenseRequest->defense_type,
                    'defense_request_id' => $defenseRequest->id,
                    'or_number' => $defenseRequest->reference_no, // ✅ Add OR number
                    'payment_date' => $defenseRequest->payment_date, // ✅ Add payment date
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
                if (!$honorariumPayment->panelist_name && !$honorariumPayment->panelist) {
                    Log::warning('Skipping payment - no panelist info', ['payment_id' => $honorariumPayment->id]);
                    continue;
                }

                // Get panelist name (prefer panelist relation, fall back to panelist_name)
                $panelistName = $honorariumPayment->panelist 
                    ? $honorariumPayment->panelist->name 
                    : $honorariumPayment->panelist_name;

                if (!$panelistName) {
                    Log::warning('Skipping payment - no panelist name', ['payment_id' => $honorariumPayment->id]);
                    continue;
                }

                // Parse name into first, middle, last
                $nameParts = explode(' ', trim($panelistName));
                $firstName = $nameParts[0] ?? '';
                $lastName = count($nameParts) > 1 ? $nameParts[count($nameParts) - 1] : '';
                $middleName = count($nameParts) > 2 ? implode(' ', array_slice($nameParts, 1, -1)) : '';

                // Create panelist record with proper name parsing
                $panelistRecord = PanelistRecord::firstOrCreate(
                    [
                        'pfirst_name' => $firstName,
                        'plast_name' => $lastName,
                        'program_record_id' => $programRecord->id,
                    ],
                    [
                        'pmiddle_name' => $middleName,
                        'role' => $honorariumPayment->role,
                        'received_date' => $honorariumPayment->payment_date ?? now(),
                    ]
                );

                Log::info('Panelist record created/found', [
                    'id' => $panelistRecord->id,
                    'name' => "{$firstName} {$middleName} {$lastName}",
                    'role' => $honorariumPayment->role
                ]);

                // Create payment record (or update if exists) to avoid duplicates
                $paymentRecord = PaymentRecord::updateOrCreate(
                    [
                        'student_record_id' => $studentRecord->id,
                        'panelist_record_id' => $panelistRecord->id,
                        'defense_request_id' => $defenseRequest->id,
                    ],
                    [
                        'school_year' => PaymentRecord::getCurrentSchoolYear(),
                        'payment_date' => $honorariumPayment->payment_date ?? $defenseRequest->payment_date ?? now(),
                        'defense_status' => 'completed',
                        'amount' => $honorariumPayment->amount,
                        'role' => $honorariumPayment->role,
                    ]
                );

                Log::info('Payment record created/updated', [
                    'id' => $paymentRecord->id,
                    'amount' => $paymentRecord->amount,
                    'role' => $honorariumPayment->role
                ]);

                // Link panelist to student with role in pivot table
                // Use sync to avoid duplicates, and preserve the role
                $studentRecord->panelists()->syncWithoutDetaching([
                    $panelistRecord->id => ['role' => $honorariumPayment->role]
                ]);

                Log::info('Panelist linked to student via pivot', [
                    'student_id' => $studentRecord->id,
                    'panelist_id' => $panelistRecord->id,
                    'role' => $honorariumPayment->role
                ]);
            }

            // Update program's date_edited after all records are synced
            $programRecord->update(['date_edited' => now()]);

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