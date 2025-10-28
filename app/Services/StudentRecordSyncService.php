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
     * ✅ CREATES SEPARATE STUDENT RECORD PER DEFENSE (not updating existing)
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

            Log::info('✅ Program record created/found', [
                'id' => $programRecord->id,
                'name' => $programRecord->name,
                'category' => $programRecord->category
            ]);

            // ✅ CREATE NEW STUDENT RECORD FOR EACH DEFENSE (not update)
            // This ensures each defense has its own separate record
            $studentRecord = StudentRecord::create([
                'student_id' => $defenseRequest->school_id,
                'first_name' => $defenseRequest->first_name,
                'middle_name' => $defenseRequest->middle_name,
                'last_name' => $defenseRequest->last_name,
                'program' => $defenseRequest->program,
                'program_record_id' => $programRecord->id,
                'school_year' => PaymentRecord::getCurrentSchoolYear(),
                'defense_date' => $defenseRequest->scheduled_date,
                'defense_type' => $defenseRequest->defense_type,
                'defense_request_id' => $defenseRequest->id,
                'or_number' => $defenseRequest->reference_no,
                'payment_date' => $defenseRequest->payment_date,
            ]);

            Log::info('Student record created', ['id' => $studentRecord->id]);

            // Get honorarium payments (includes ALL members: adviser, chair, and panel members)
            $honorariumPayments = HonorariumPayment::where('defense_request_id', $defenseRequest->id)
                ->with('panelist')
                ->get();

            Log::info('✅ Found honorarium payments', [
                'count' => $honorariumPayments->count(),
                'defense_id' => $defenseRequest->id,
                'payments' => $honorariumPayments->map(fn($p) => [
                    'id' => $p->id,
                    'name' => $p->panelist_name,
                    'role' => $p->role,
                    'amount' => $p->amount
                ])
            ]);

            // Process each payment and create records
            foreach ($honorariumPayments as $honorariumPayment) {
                if (!$honorariumPayment->panelist_name && !$honorariumPayment->panelist) {
                    Log::warning('Skipping payment - no panelist info', ['payment_id' => $honorariumPayment->id]);
                    continue;
                }

                $role = $honorariumPayment->role;
                $isAdviser = $role && (strtolower($role) === 'adviser' || str_contains(strtolower($role), 'advis'));

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

                // ✅ Create/find panelist record for ALL roles (including Advisers)
                // Advisers will be filtered out in HonorariumSummaryController
                $panelistRecord = PanelistRecord::firstOrCreate(
                    [
                        'pfirst_name' => $firstName,
                        'plast_name' => $lastName,
                        'program_record_id' => $programRecord->id,
                        'received_date' => $honorariumPayment->payment_date ?? $defenseRequest->payment_date ?? now(),
                    ],
                    [
                        'pmiddle_name' => $middleName,
                        'role' => $honorariumPayment->role,
                    ]
                );

                Log::info('✅ Panelist record created/found', [
                    'id' => $panelistRecord->id,
                    'name' => "{$firstName} {$middleName} {$lastName}",
                    'role' => $honorariumPayment->role,
                    'program_record_id' => $programRecord->id,
                    'is_adviser' => $isAdviser
                ]);

                // ✅ Create payment record with role (for ALL including Advisers)
                $paymentRecord = PaymentRecord::create([
                    'student_record_id' => $studentRecord->id,
                    'panelist_record_id' => $panelistRecord->id,
                    'defense_request_id' => $defenseRequest->id,
                    'school_year' => PaymentRecord::getCurrentSchoolYear(),
                    'payment_date' => $honorariumPayment->payment_date ?? $defenseRequest->payment_date ?? now(),
                    'defense_status' => 'completed',
                    'amount' => $honorariumPayment->amount,
                    'role' => $honorariumPayment->role, // ✅ Store role here
                ]);

                Log::info('✅ Payment record created', [
                    'id' => $paymentRecord->id,
                    'amount' => $paymentRecord->amount,
                    'role' => $honorariumPayment->role,
                    'panelist_id' => $panelistRecord->id,
                    'student_id' => $studentRecord->id,
                    'is_adviser' => $isAdviser
                ]);

                // ✅ Link panelist to student with role in pivot table (for ALL including Advisers)
                $studentRecord->panelists()->attach($panelistRecord->id, [
                    'role' => $honorariumPayment->role
                ]);

                Log::info('✅ Panelist linked to student via pivot table', [
                    'student_id' => $studentRecord->id,
                    'panelist_id' => $panelistRecord->id,
                    'role' => $honorariumPayment->role,
                    'is_adviser' => $isAdviser
                ]);
            }

            // Update program's date_edited after all records are synced
            $programRecord->update(['date_edited' => now()]);

            DB::commit();
            
            Log::info('🎉 Sync completed successfully', [
                'defense_id' => $defenseRequest->id,
                'student_record_id' => $studentRecord->id,
                'program_record_id' => $programRecord->id,
                'total_payments_created' => $honorariumPayments->count()
            ]);

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