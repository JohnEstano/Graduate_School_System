<?php

/**
 * Test script to verify AA workflow fixes
 * 
 * Run with: php test_aa_workflow.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DefenseRequest;
use App\Models\AaPaymentVerification;
use App\Models\HonorariumPayment;
use App\Models\StudentRecord;
use App\Models\PanelistRecord;
use App\Models\PaymentRecord;
use App\Helpers\ProgramLevel;

echo "🧪 Testing AA Workflow Fixes\n";
echo "================================\n\n";

// Test 1: Check if a defense request has proper data structure
echo "Test 1: Defense Request Data Structure\n";
echo "---------------------------------------\n";
$defenseRequest = DefenseRequest::with('aaVerification')
    ->whereNotNull('coordinator_user_id')
    ->where('coordinator_status', 'Approved')
    ->first();

if ($defenseRequest) {
    echo "✅ Found defense request: #{$defenseRequest->id}\n";
    echo "   Program: {$defenseRequest->program}\n";
    
    $programLevel = ProgramLevel::getLevel($defenseRequest->program);
    echo "   Program Level: {$programLevel}\n";
    
    echo "   Coordinator ID: {$defenseRequest->coordinator_user_id}\n";
    if ($defenseRequest->coordinator_user_id) {
        $coordinator = \App\Models\User::find($defenseRequest->coordinator_user_id);
        if ($coordinator) {
            $coordName = trim($coordinator->first_name . ' ' . ($coordinator->middle_name ? strtoupper($coordinator->middle_name[0]) . '. ' : '') . $coordinator->last_name);
            echo "   Coordinator Name: {$coordName}\n";
        }
    }
    
    echo "   AA Status: " . ($defenseRequest->aaVerification ? $defenseRequest->aaVerification->status : 'No verification record') . "\n";
    
    // Test payment rates
    $rates = \App\Models\PaymentRate::where('program_level', $programLevel)
        ->where('defense_type', $defenseRequest->defense_type)
        ->get();
    
    echo "   Payment Rates Found: {$rates->count()}\n";
    foreach ($rates as $rate) {
        echo "     - {$rate->type}: ₱" . number_format($rate->amount, 2) . "\n";
    }
    
    $expectedTotal = $rates->sum('amount');
    echo "   Expected Total: ₱" . number_format($expectedTotal, 2) . "\n";
} else {
    echo "❌ No approved defense requests found\n";
}

echo "\n";

// Test 2: Check HonorariumPayments creation
echo "Test 2: Honorarium Payments\n";
echo "----------------------------\n";
if ($defenseRequest) {
    $honorariumCount = HonorariumPayment::where('defense_request_id', $defenseRequest->id)->count();
    echo "Honorarium payments for request #{$defenseRequest->id}: {$honorariumCount}\n";
    
    if ($honorariumCount > 0) {
        $payments = HonorariumPayment::where('defense_request_id', $defenseRequest->id)->get();
        foreach ($payments as $payment) {
            echo "  ✅ {$payment->role}: {$payment->panelist_name} - ₱" . number_format($payment->amount, 2) . "\n";
        }
    } else {
        echo "  ⚠️  No honorarium payments found. They should be created when AA status = 'ready_for_finance'\n";
    }
}

echo "\n";

// Test 3: Check Student and Panelist Records
echo "Test 3: Student & Panelist Records\n";
echo "----------------------------------\n";
if ($defenseRequest && $defenseRequest->school_id) {
    $studentRecord = StudentRecord::where('student_id', $defenseRequest->school_id)->first();
    
    if ($studentRecord) {
        echo "✅ Student Record Found: #{$studentRecord->id}\n";
        echo "   Name: {$studentRecord->first_name} {$studentRecord->last_name}\n";
        echo "   Defense Date: {$studentRecord->defense_date}\n";
        echo "   Defense Type: {$studentRecord->defense_type}\n";
        
        $paymentRecords = PaymentRecord::where('student_record_id', $studentRecord->id)
            ->where('defense_request_id', $defenseRequest->id)
            ->count();
        echo "   Payment Records: {$paymentRecords}\n";
        
        $panelistCount = $studentRecord->panelists()->count();
        echo "   Linked Panelists: {$panelistCount}\n";
    } else {
        echo "⚠️  No student record found. Should be created when AA status = 'ready_for_finance'\n";
    }
}

echo "\n";

// Test 4: Verify Panel Member Count by Program Level
echo "Test 4: Panel Member Count\n";
echo "--------------------------\n";
if ($defenseRequest) {
    $programLevel = ProgramLevel::getLevel($defenseRequest->program);
    $panelCount = 0;
    
    if ($defenseRequest->defense_chairperson) $panelCount++;
    if ($defenseRequest->defense_panelist1) $panelCount++;
    if ($defenseRequest->defense_panelist2) $panelCount++;
    if ($defenseRequest->defense_panelist3) $panelCount++;
    if ($defenseRequest->defense_panelist4) $panelCount++;
    
    echo "Program Level: {$programLevel}\n";
    echo "Panel Members Assigned: {$panelCount}\n";
    
    $expectedCount = ($programLevel === 'Doctorate') ? 5 : 4;
    echo "Expected Count: {$expectedCount} (Chair + " . ($expectedCount - 1) . " members)\n";
    
    if ($panelCount === $expectedCount) {
        echo "✅ Correct panel member count\n";
    } else {
        echo "⚠️  Panel count mismatch\n";
    }
}

echo "\n";

// Test 5: AA Verification Status Flow
echo "Test 5: AA Verification Status Flow\n";
echo "------------------------------------\n";
$statuses = ['pending', 'ready_for_finance', 'in_progress', 'paid', 'completed'];
echo "Valid AA statuses: " . implode(', ', $statuses) . "\n";

$verificationCount = AaPaymentVerification::count();
echo "Total AA Verifications: {$verificationCount}\n";

$statusCounts = AaPaymentVerification::selectRaw('status, COUNT(*) as count')
    ->groupBy('status')
    ->get()
    ->pluck('count', 'status');

foreach ($statuses as $status) {
    $count = $statusCounts->get($status, 0);
    echo "  {$status}: {$count}\n";
}

echo "\n";
echo "================================\n";
echo "✅ All tests completed!\n";
echo "\nNext Steps:\n";
echo "1. Visit a defense request in AA details page\n";
echo "2. Verify coordinator name is shown\n";
echo "3. Check if receivables are calculated\n";
echo "4. Update AA status to 'ready_for_finance'\n";
echo "5. Verify honorarium payments and records are created\n";
echo "6. Check student records and panelist individual records pages\n";
