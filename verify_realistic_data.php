<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProgramRecord;
use App\Models\StudentRecord;
use App\Models\PanelistRecord;
use App\Models\PaymentRecord;

echo "=== REALISTIC DATA VERIFICATION ===\n\n";

// Test with first program (DBM - Doctorate)
$program = ProgramRecord::with([
    'panelists.students.payments',
    'panelists.payments'
])->first();

if ($program) {
    echo "Program: {$program->name}\n";
    echo "Program Code: {$program->program}\n";
    echo "Level: Doctorate\n\n";
    
    // Get a sample student
    $student = StudentRecord::where('program_record_id', $program->id)->first();
    
    if ($student) {
        echo "=== SAMPLE STUDENT ===\n";
        echo "Name: {$student->first_name} {$student->middle_name} {$student->last_name}\n";
        echo "Student ID: {$student->student_id}\n";
        echo "Defense Type: {$student->defense_type}\n";
        echo "Defense Date: {$student->defense_date}\n";
        echo "Payment Date: {$student->payment_date}\n";
        echo "OR Number: {$student->or_number}\n\n";
        
        echo "=== PANELISTS & PAYMENTS ===\n";
        $panelists = $student->panelists()->with('payments')->get();
        $totalAmount = 0;
        
        foreach ($panelists as $panelist) {
            echo "\nRole: {$panelist->role}\n";
            echo "Name: {$panelist->pfirst_name} {$panelist->pmiddle_name} {$panelist->plast_name}\n";
            
            $payment = $panelist->payments()
                ->where('student_record_id', $student->id)
                ->first();
                
            if ($payment) {
                echo "Amount: ₱" . number_format($payment->amount, 2) . "\n";
                echo "Payment Date: {$payment->payment_date}\n";
                echo "Defense Status: {$payment->defense_status}\n";
                $totalAmount += $payment->amount;
            }
        }
        
        echo "\n" . str_repeat("=", 50) . "\n";
        echo "TOTAL DEFENSE FEE: ₱" . number_format($totalAmount, 2) . "\n";
        echo str_repeat("=", 50) . "\n";
    }
}

echo "\n\n=== MASTERAL PROGRAM SAMPLE ===\n";

// Test with a Masteral program
$masteralProgram = ProgramRecord::where('program', 'LIKE', 'MAED%')->first();

if ($masteralProgram) {
    echo "Program: {$masteralProgram->name}\n";
    echo "Program Code: {$masteralProgram->program}\n";
    echo "Level: Masteral\n\n";
    
    $masteralStudent = StudentRecord::where('program_record_id', $masteralProgram->id)->first();
    
    if ($masteralStudent) {
        echo "=== SAMPLE STUDENT ===\n";
        echo "Name: {$masteralStudent->first_name} {$masteralStudent->middle_name} {$masteralStudent->last_name}\n";
        echo "Defense Type: {$masteralStudent->defense_type}\n\n";
        
        echo "=== PANELISTS & PAYMENTS ===\n";
        $panelists = $masteralStudent->panelists()->with('payments')->get();
        $totalAmount = 0;
        
        foreach ($panelists as $panelist) {
            $payment = $panelist->payments()
                ->where('student_record_id', $masteralStudent->id)
                ->first();
                
            if ($payment) {
                echo "{$panelist->role}: ₱" . number_format($payment->amount, 2) . "\n";
                $totalAmount += $payment->amount;
            }
        }
        
        echo "\nTOTAL: ₱" . number_format($totalAmount, 2) . "\n";
    }
}

echo "\n\n=== SUMMARY STATISTICS ===\n";
echo "Total Programs: " . ProgramRecord::count() . "\n";
echo "Total Students: " . StudentRecord::count() . "\n";
echo "Total Panelists: " . PanelistRecord::count() . "\n";
echo "Total Payments: " . PaymentRecord::count() . "\n";

$totalRevenue = PaymentRecord::sum('amount');
echo "Total Revenue: ₱" . number_format($totalRevenue, 2) . "\n";

echo "\n=== DEFENSE TYPE BREAKDOWN ===\n";
$defenseTypes = StudentRecord::selectRaw('defense_type, COUNT(*) as count')
    ->groupBy('defense_type')
    ->get();
    
foreach ($defenseTypes as $type) {
    echo "{$type->defense_type}: {$type->count} students\n";
}

echo "\n=== PANELIST ROLE BREAKDOWN ===\n";
$roles = PanelistRecord::selectRaw('role, COUNT(*) as count')
    ->groupBy('role')
    ->get();
    
foreach ($roles as $role) {
    echo "{$role->role}: {$role->count}\n";
}

echo "\n=== END ===\n";
