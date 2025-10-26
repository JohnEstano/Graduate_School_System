<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DefenseRequest;
use App\Models\User;
use App\Models\Panelist;
use App\Models\ProgramRecord;
use App\Models\StudentRecord;
use App\Models\PaymentRecord;
use App\Models\HonorariumPayment;
use Illuminate\Support\Facades\DB;

echo "\n";
echo "====================================\n";
echo "   FULL WORKFLOW TEST\n";
echo "====================================\n\n";

// 1. Create a NEW defense request with panelists
echo "Step 1: Creating new defense request with panelists...\n";

$student = User::where('role', 'student')->first();
if (!$student) {
    echo "❌ No student found. Please create a student user first.\n";
    exit(1);
}

$panelists = Panelist::take(3)->get();
if ($panelists->count() < 3) {
    echo "❌ Need at least 3 panelists. Found: " . $panelists->count() . "\n";
    exit(1);
}

echo "   Student: {$student->name} (ID: {$student->id})\n";
echo "   Panelists:\n";
foreach ($panelists as $panelist) {
    echo "     - {$panelist->name} (ID: {$panelist->id})\n";
}

// Create defense request
$defenseRequest = DefenseRequest::create([
    'submitted_by' => $student->id,
    'first_name' => explode(' ', $student->name)[0],
    'last_name' => explode(' ', $student->name)[count(explode(' ', $student->name)) - 1],
    'middle_name' => count(explode(' ', $student->name)) > 2 ? explode(' ', $student->name)[1] : '',
    'school_id' => 'TEST-' . $student->id,
    'program' => 'Master of Science in Computer Science',
    'thesis_title' => 'Test Thesis Title ' . now()->format('Y-m-d H:i:s'),
    'defense_adviser' => 'Dr. Test Adviser',
    'defense_type' => 'Final',
    'defense_mode' => 'online',
    'workflow_state' => 'pending',
    'scheduled_date' => now()->addDays(7),
    'payment_date' => now(),
    'reference_no' => 'OR-' . rand(1000, 9999),
]);

echo "   ✅ Defense Request created (ID: {$defenseRequest->id})\n\n";

// 2. Simulate the complete workflow
echo "Step 2: Simulating workflow approval chain...\n";
$defenseRequest->update(['workflow_state' => 'adviser_approved']);
echo "   ✅ Adviser approved\n";

$defenseRequest->update(['workflow_state' => 'dean_approved']);
echo "   ✅ Dean approved\n";

$defenseRequest->update(['workflow_state' => 'registrar_scheduled']);
echo "   ✅ Registrar scheduled\n\n";

// 3. Create HonorariumPayments (what completeDefense does)
echo "Step 3: Creating HonorariumPayments for panelists...\n";

$roles = ['Panel Chair', 'Panel Member 1', 'Panel Member 2'];
foreach ($panelists as $index => $panelist) {
    HonorariumPayment::create([
        'defense_request_id' => $defenseRequest->id,
        'panelist_id' => $panelist->id,
        'panelist_name' => $panelist->name,
        'role' => $roles[$index],
        'amount' => 12313.00,
        'payment_date' => $defenseRequest->payment_date,
    ]);
    echo "   ✅ {$panelist->name} - {$roles[$index]} - ₱12,313\n";
}
echo "\n";

// 4. Mark as completed (what AA does)
echo "Step 4: AA marks defense as completed...\n";

DB::beginTransaction();
try {
    $defenseRequest->update(['workflow_state' => 'completed']);
    
    // Create AA Payment Verification
    $verification = $defenseRequest->aaVerification()->create([
        'user_id' => $defenseRequest->submitted_by,
        'defense_request_id' => $defenseRequest->id,
        'status' => 'completed',
        'verified_at' => now(),
    ]);
    
    DB::commit();
    echo "   ✅ Defense marked as completed\n";
    echo "   ✅ AA Payment Verification created (ID: {$verification->id}, Status: {$verification->status})\n\n";
    
} catch (Exception $e) {
    DB::rollBack();
    echo "   ❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}

// 5. Trigger the sync explicitly (simulating what completeDefense does now)
echo "Step 5: Triggering sync service...\n";
try {
    $syncService = app(\App\Services\StudentRecordSyncService::class);
    $syncService->syncDefenseToStudentRecord($defenseRequest);
    echo "   ✅ Sync service executed\n\n";
} catch (Exception $e) {
    echo "   ❌ Sync error: " . $e->getMessage() . "\n\n";
}

// 6. VERIFY THE RESULTS
echo "====================================\n";
echo "   VERIFICATION\n";
echo "====================================\n\n";

// Check StudentRecord
$studentRecord = StudentRecord::where('defense_request_id', $defenseRequest->id)->first();
if ($studentRecord) {
    echo "✅ STUDENT RECORD CREATED\n";
    echo "   ID: {$studentRecord->id}\n";
    echo "   Student: {$studentRecord->first_name} {$studentRecord->last_name}\n";
    echo "   Program Record ID: {$studentRecord->program_record_id}\n";
    echo "   Defense Date: {$studentRecord->defense_date}\n";
    echo "   OR Number: {$studentRecord->or_number}\n";
    echo "\n";
} else {
    echo "❌ STUDENT RECORD NOT FOUND!\n\n";
}

// Check ProgramRecord (through student record)
if ($studentRecord && $studentRecord->program_record_id) {
    $programRecord = ProgramRecord::find($studentRecord->program_record_id);
    if ($programRecord) {
        echo "✅ PROGRAM RECORD FOUND\n";
        echo "   ID: {$programRecord->id}\n";
        echo "   Name: {$programRecord->name}\n";
        echo "   Program: {$programRecord->program}\n";
        
        // Check panelists count
        $panelistCount = $programRecord->panelists()->count();
        echo "   Panelists Count: {$panelistCount}\n";
        
        if ($panelistCount > 0) {
            echo "   Panelists:\n";
            foreach ($programRecord->panelists as $p) {
                $role = $p->pivot->role ?? 'No role';
                echo "     - {$p->pfirst_name} {$p->pmiddle_name} {$p->plast_name} ({$role})\n";
            }
        }
        echo "\n";
    } else {
        echo "❌ PROGRAM RECORD NOT FOUND!\n\n";
    }
} else {
    echo "⚠️  No program_record_id in student record\n\n";
    $programRecord = null;
}

// Check PaymentRecords
$paymentRecords = PaymentRecord::where('defense_request_id', $defenseRequest->id)->get();
echo "PAYMENT RECORDS: {$paymentRecords->count()}\n";
if ($paymentRecords->count() > 0) {
    foreach ($paymentRecords as $payment) {
        echo "   ✅ {$payment->role} - ₱" . number_format($payment->amount, 2) . "\n";
    }
    echo "\n";
} else {
    echo "   ❌ No payment records found!\n\n";
}

// Check pivot table
if ($studentRecord && $programRecord) {
    $pivotLinks = DB::table('panelist_student_records')
        ->where('student_id', $studentRecord->id)
        ->get();
    
    echo "PIVOT TABLE LINKS: {$pivotLinks->count()}\n";
    if ($pivotLinks->count() > 0) {
        foreach ($pivotLinks as $link) {
            $panelist = DB::table('panelist_records')->find($link->panelist_id);
            echo "   ✅ Student #{$link->student_id} <-> Panelist #{$link->panelist_id} ({$link->role})\n";
            if ($panelist) {
                echo "      Name: {$panelist->pfirst_name} {$panelist->pmiddle_name} {$panelist->plast_name}\n";
            }
        }
        echo "\n";
    } else {
        echo "   ❌ No pivot links found!\n\n";
    }
}

// Final Summary
echo "====================================\n";
echo "   SUMMARY\n";
echo "====================================\n";
echo "Defense Request ID: {$defenseRequest->id}\n";
echo "Workflow State: {$defenseRequest->workflow_state}\n";
echo "HonorariumPayments: " . $defenseRequest->honorariumPayments()->count() . "\n";
echo "Program Record: " . ($programRecord ? "✅ Created" : "❌ Missing") . "\n";
echo "Student Record: " . ($studentRecord ? "✅ Created" : "❌ Missing") . "\n";
echo "Payment Records: {$paymentRecords->count()}\n";
echo "Pivot Links: " . ($pivotLinks->count() ?? 0) . "\n";
echo "\n";

if ($programRecord && $studentRecord && $paymentRecords->count() > 0 && $pivotLinks->count() > 0) {
    echo "🎉 FULL WORKFLOW TEST: SUCCESS! 🎉\n";
    echo "\nNow check:\n";
    echo "1. /honorarium page - should show Program #{$programRecord->id} with panelists\n";
    echo "2. /student-records page - should show Student #{$studentRecord->id} with payments\n";
} else {
    echo "❌ FULL WORKFLOW TEST: FAILED!\n";
    echo "\nSomething went wrong. Check the logs above.\n";
}

echo "\n";
