<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefenseRequest;
use App\Models\AaPaymentVerification;
use App\Models\HonorariumPayment;
use App\Models\StudentRecord;
use App\Models\ProgramRecord;
use App\Models\PanelistRecord;
use App\Models\PaymentRecord;

echo "=== DEBUGGING SYNC STATUS ===\n\n";

// Get latest defense requests
$defenses = DefenseRequest::latest()->take(5)->get();

foreach ($defenses as $defense) {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "Defense Request ID: {$defense->id}\n";
    echo "Student: {$defense->first_name} {$defense->last_name}\n";
    echo "Program: {$defense->program}\n";
    echo "Defense Type: {$defense->defense_type}\n";
    echo "Workflow State: {$defense->workflow_state}\n";
    echo "School ID: {$defense->school_id}\n";
    
    // Check AA Verification
    $aaVerification = AaPaymentVerification::where('defense_request_id', $defense->id)->first();
    if ($aaVerification) {
        echo "✅ AA Verification Status: {$aaVerification->status}\n";
    } else {
        echo "❌ No AA Verification found\n";
    }
    
    // Check Honorarium Payments
    $honorariumCount = HonorariumPayment::where('defense_request_id', $defense->id)->count();
    echo "Honorarium Payments Created: {$honorariumCount}\n";
    
    if ($honorariumCount > 0) {
        $honorariums = HonorariumPayment::where('defense_request_id', $defense->id)->get();
        foreach ($honorariums as $h) {
            echo "  - {$h->panelist_name} ({$h->role}): ₱{$h->amount}\n";
        }
    }
    
    // Check Student Record
    $studentRecord = StudentRecord::where('defense_request_id', $defense->id)->first();
    if ($studentRecord) {
        echo "✅ Student Record Created (ID: {$studentRecord->id})\n";
        echo "   Program Record ID: {$studentRecord->program_record_id}\n";
        
        // Check Program Record
        $programRecord = ProgramRecord::find($studentRecord->program_record_id);
        if ($programRecord) {
            echo "   ✅ Program: {$programRecord->name} (Category: {$programRecord->category})\n";
        }
        
        // Check Payment Records
        $paymentCount = PaymentRecord::where('student_record_id', $studentRecord->id)->count();
        echo "   Payment Records: {$paymentCount}\n";
        
        if ($paymentCount > 0) {
            $payments = PaymentRecord::with('panelist')->where('student_record_id', $studentRecord->id)->get();
            foreach ($payments as $p) {
                $name = $p->panelist ? "{$p->panelist->pfirst_name} {$p->panelist->plast_name}" : 'Unknown';
                echo "     - {$name} ({$p->role}): ₱{$p->amount}\n";
            }
        }
        
        // Check Panelist Records for this program
        $panelistCount = PanelistRecord::where('program_record_id', $studentRecord->program_record_id)->count();
        echo "   Panelist Records in Program: {$panelistCount}\n";
        
    } else {
        echo "❌ No Student Record found\n";
    }
    
    echo "\n";
}

// Show all program records
echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "ALL PROGRAM RECORDS:\n";
$programs = ProgramRecord::orderBy('date_edited', 'desc')->get();
foreach ($programs as $prog) {
    $studentCount = StudentRecord::where('program_record_id', $prog->id)->count();
    $panelistCount = PanelistRecord::where('program_record_id', $prog->id)->count();
    echo "  - {$prog->name} (ID: {$prog->id})\n";
    echo "    Category: {$prog->category}\n";
    echo "    Students: {$studentCount}, Panelists: {$panelistCount}\n";
}

echo "\n✅ Debug complete\n";
