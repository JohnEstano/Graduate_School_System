<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;
use App\Models\AaPaymentVerification;
use App\Models\HonorariumPayment;
use App\Models\StudentRecord;
use App\Models\PanelistRecord;
use App\Models\PaymentRecord;
use App\Models\ProgramRecord;

echo "\n";
echo "╔═══════════════════════════════════════════════════════════════════╗" . PHP_EOL;
echo "║          SYNC ISSUE DIAGNOSTIC TOOL                               ║" . PHP_EOL;
echo "╚═══════════════════════════════════════════════════════════════════╝" . PHP_EOL;
echo "\n";

// Get a completed defense request
$defenseRequest = DefenseRequest::where('workflow_state', 'completed')->first();

if (!$defenseRequest) {
    echo "❌ No completed defense requests found!" . PHP_EOL;
    echo "Please complete a defense request first." . PHP_EOL;
    exit;
}

echo "📋 Analyzing Defense Request ID: {$defenseRequest->id}" . PHP_EOL;
echo "   Student: {$defenseRequest->first_name} {$defenseRequest->last_name}" . PHP_EOL;
echo "   Program: {$defenseRequest->program}" . PHP_EOL;
echo "   Defense Type: {$defenseRequest->defense_type}" . PHP_EOL;
echo "   Workflow State: {$defenseRequest->workflow_state}" . PHP_EOL;
echo "\n";

// Check AA Payment Verification
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" . PHP_EOL;
echo "1️⃣  AA PAYMENT VERIFICATION STATUS" . PHP_EOL;
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" . PHP_EOL;

$aaVerification = AaPaymentVerification::where('defense_request_id', $defenseRequest->id)->first();

if ($aaVerification) {
    echo "   ✅ AA Verification exists" . PHP_EOL;
    echo "   Status: {$aaVerification->status}" . PHP_EOL;
    echo "   Assigned to: User #{$aaVerification->assigned_to}" . PHP_EOL;
    
    if ($aaVerification->status !== 'ready_for_finance') {
        echo "   ⚠️  STATUS IS NOT 'ready_for_finance'!" . PHP_EOL;
        echo "   Current: '{$aaVerification->status}'" . PHP_EOL;
        echo "   Expected: 'ready_for_finance'" . PHP_EOL;
    } else {
        echo "   ✅ Status is correct: ready_for_finance" . PHP_EOL;
    }
} else {
    echo "   ❌ NO AA Verification record found!" . PHP_EOL;
    echo "   This is the problem - AA must mark as 'ready_for_finance'" . PHP_EOL;
}
echo "\n";

// Check Honorarium Payments
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" . PHP_EOL;
echo "2️⃣  HONORARIUM PAYMENTS (Source Data)" . PHP_EOL;
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" . PHP_EOL;

$honorariumPayments = HonorariumPayment::where('defense_request_id', $defenseRequest->id)
    ->with('panelist')
    ->get();

echo "   Found {$honorariumPayments->count()} honorarium payment(s)" . PHP_EOL;

if ($honorariumPayments->isEmpty()) {
    echo "   ❌ NO HONORARIUM PAYMENTS FOUND!" . PHP_EOL;
    echo "   Panelists must be assigned and payments calculated before sync!" . PHP_EOL;
} else {
    foreach ($honorariumPayments as $payment) {
        echo "   • ID #{$payment->id}" . PHP_EOL;
        echo "     Panelist: " . ($payment->panelist ? $payment->panelist->name : 'NULL') . PHP_EOL;
        echo "     Role: {$payment->role}" . PHP_EOL;
        echo "     Amount: ₱" . number_format($payment->amount, 2) . PHP_EOL;
        echo "     Payment Date: " . ($payment->payment_date ?? 'NULL') . PHP_EOL;
    }
}
echo "\n";

// Check Program Record
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" . PHP_EOL;
echo "3️⃣  PROGRAM RECORD" . PHP_EOL;
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" . PHP_EOL;

$programRecord = ProgramRecord::where('name', $defenseRequest->program)->first();

if ($programRecord) {
    echo "   ✅ Program record exists (ID: {$programRecord->id})" . PHP_EOL;
    echo "   Name: {$programRecord->name}" . PHP_EOL;
    echo "   Category: " . ($programRecord->category ?? 'NULL') . PHP_EOL;
    
    // Check panelists linked to this program
    $programPanelists = PanelistRecord::where('program_record_id', $programRecord->id)->get();
    echo "   Linked Panelists: {$programPanelists->count()}" . PHP_EOL;
    
    if ($programPanelists->isEmpty()) {
        echo "   ❌ NO PANELISTS linked to this program!" . PHP_EOL;
    }
} else {
    echo "   ❌ Program record does NOT exist!" . PHP_EOL;
}
echo "\n";

// Check Student Record
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" . PHP_EOL;
echo "4️⃣  STUDENT RECORD" . PHP_EOL;
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" . PHP_EOL;

$studentRecord = StudentRecord::where('student_id', $defenseRequest->school_id)->first();

if ($studentRecord) {
    echo "   ✅ Student record exists (ID: {$studentRecord->id})" . PHP_EOL;
    echo "   Name: {$studentRecord->first_name} {$studentRecord->last_name}" . PHP_EOL;
    echo "   Program Record ID: " . ($studentRecord->program_record_id ?? 'NULL') . PHP_EOL;
    echo "   Defense Date: " . ($studentRecord->defense_date ?? 'NULL') . PHP_EOL;
    echo "   Defense Type: " . ($studentRecord->defense_type ?? 'NULL') . PHP_EOL;
    echo "   OR Number: " . ($studentRecord->or_number ?? 'NULL') . PHP_EOL;
    echo "   Payment Date: " . ($studentRecord->payment_date ?? 'NULL') . PHP_EOL;
    
    if (!$studentRecord->program_record_id) {
        echo "   ⚠️  Student is NOT linked to program!" . PHP_EOL;
    }
    
    // Check payment records
    $paymentRecords = PaymentRecord::where('student_record_id', $studentRecord->id)->get();
    echo "   Payment Records: {$paymentRecords->count()}" . PHP_EOL;
    
    if ($paymentRecords->isEmpty()) {
        echo "   ❌ NO PAYMENT RECORDS!" . PHP_EOL;
    } else {
        foreach ($paymentRecords as $pr) {
            echo "     • Payment ID #{$pr->id}: ₱" . number_format((float)$pr->amount, 2) . PHP_EOL;
            echo "       Panelist ID: " . ($pr->panelist_record_id ?? 'NULL') . PHP_EOL;
        }
    }
    
    // Check pivot table
    $pivotPanelists = DB::table('panelist_student_records')
        ->where('student_record_id', $studentRecord->id)
        ->get();
    echo "   Pivot Table Links: {$pivotPanelists->count()}" . PHP_EOL;
    
    if ($pivotPanelists->isEmpty()) {
        echo "   ❌ NO PANELIST-STUDENT LINKS in pivot table!" . PHP_EOL;
    } else {
        foreach ($pivotPanelists as $pivot) {
            echo "     • Panelist ID #{$pivot->panelist_record_id}, Role: " . ($pivot->role ?? 'NULL') . PHP_EOL;
        }
    }
} else {
    echo "   ❌ Student record does NOT exist!" . PHP_EOL;
}
echo "\n";

// Check Panelist Records
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" . PHP_EOL;
echo "5️⃣  PANELIST RECORDS" . PHP_EOL;
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" . PHP_EOL;

$panelistRecords = PanelistRecord::all();
echo "   Total Panelist Records in DB: {$panelistRecords->count()}" . PHP_EOL;

if ($programRecord) {
    $programPanelists = PanelistRecord::where('program_record_id', $programRecord->id)->get();
    echo "   Panelists for this program: {$programPanelists->count()}" . PHP_EOL;
    
    if ($programPanelists->isNotEmpty()) {
        foreach ($programPanelists as $pr) {
            echo "     • ID #{$pr->id}: {$pr->pfirst_name} {$pr->plast_name}" . PHP_EOL;
            echo "       Role: {$pr->role}" . PHP_EOL;
            echo "       Program ID: {$pr->program_record_id}" . PHP_EOL;
        }
    }
}
echo "\n";

// Summary
echo "╔═══════════════════════════════════════════════════════════════════╗" . PHP_EOL;
echo "║                         DIAGNOSIS SUMMARY                          ║" . PHP_EOL;
echo "╚═══════════════════════════════════════════════════════════════════╝" . PHP_EOL;
echo "\n";

$issues = [];

if (!$aaVerification) {
    $issues[] = "AA Verification record missing";
} elseif ($aaVerification->status !== 'ready_for_finance') {
    $issues[] = "AA status is '{$aaVerification->status}' instead of 'ready_for_finance'";
}

if ($honorariumPayments->isEmpty()) {
    $issues[] = "No honorarium payments found";
}

if (!$programRecord) {
    $issues[] = "Program record missing";
}

if (!$studentRecord) {
    $issues[] = "Student record missing";
} else {
    if (!$studentRecord->program_record_id) {
        $issues[] = "Student not linked to program";
    }
    
    $paymentRecords = PaymentRecord::where('student_record_id', $studentRecord->id)->get();
    if ($paymentRecords->isEmpty()) {
        $issues[] = "No payment records for student";
    }
    
    $pivotPanelists = DB::table('panelist_student_records')
        ->where('student_record_id', $studentRecord->id)
        ->get();
    if ($pivotPanelists->isEmpty()) {
        $issues[] = "No panelist-student links in pivot table";
    }
}

if (empty($issues)) {
    echo "✅ ALL SYSTEMS OPERATIONAL!" . PHP_EOL;
    echo "Everything looks good. If you're still having issues, check the logs." . PHP_EOL;
} else {
    echo "❌ ISSUES FOUND:" . PHP_EOL;
    foreach ($issues as $i => $issue) {
        echo "   " . ($i + 1) . ". {$issue}" . PHP_EOL;
    }
    echo "\n";
    echo "RECOMMENDED ACTION:" . PHP_EOL;
    echo "Run this command to manually trigger sync:" . PHP_EOL;
    echo "php artisan tinker" . PHP_EOL;
    echo "\$sync = app(\\App\\Services\\StudentRecordSyncService::class);" . PHP_EOL;
    echo "\$defense = \\App\\Models\\DefenseRequest::find({$defenseRequest->id});" . PHP_EOL;
    echo "\$sync->syncDefenseToStudentRecord(\$defense);" . PHP_EOL;
}

echo "\n";
