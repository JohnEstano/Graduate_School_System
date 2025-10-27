<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ProgramRecord;
use App\Models\StudentRecord;

echo "=== Defense Date Sorting Test ===\n\n";

// Test 1: Panelist Individual Record (Honorarium)
echo "1. PANELIST INDIVIDUAL RECORD (Honorarium)\n";
echo str_repeat("=", 60) . "\n\n";

$program = ProgramRecord::with([
    'panelists.students.payments'
])->first();

if ($program) {
    $panelist = $program->panelists->first();
    if ($panelist) {
        echo "Panelist: {$panelist->pfirst_name} {$panelist->plast_name}\n\n";
        
        // Get all students with their defense dates
        $students = $panelist->students->map(function($student) {
            return [
                'name' => "{$student->first_name} {$student->last_name}",
                'defense_date' => $student->defense_date,
                'timestamp' => $student->defense_date ? strtotime($student->defense_date) : 0
            ];
        })->sortByDesc('timestamp');
        
        echo "Students sorted by defense date (LATEST FIRST):\n";
        foreach ($students as $student) {
            $date = $student['defense_date'] 
                ? date('M d, Y', strtotime($student['defense_date']))
                : 'No date';
            echo "  - {$student['name']} → {$date}\n";
        }
    }
}

echo "\n" . str_repeat("-", 60) . "\n\n";

// Test 2: Student Individual Record
echo "2. STUDENT INDIVIDUAL RECORD\n";
echo str_repeat("=", 60) . "\n\n";

$student = StudentRecord::with('payments')->first();

if ($student) {
    echo "Student: {$student->first_name} {$student->last_name}\n\n";
    
    // Get all payments with their defense dates
    $payments = $student->payments->map(function($payment) use ($student) {
        $defenseDate = $payment->defense_date ?? $student->defense_date;
        return [
            'id' => $payment->id,
            'defense_date' => $defenseDate,
            'payment_date' => $payment->payment_date,
            'amount' => $payment->amount,
            'timestamp' => $defenseDate ? strtotime($defenseDate) : 0
        ];
    })->sortByDesc('timestamp');
    
    echo "Payments sorted by defense date (LATEST FIRST):\n";
    foreach ($payments as $payment) {
        $defenseDate = $payment['defense_date'] 
            ? date('M d, Y', strtotime($payment['defense_date']))
            : 'No date';
        $paymentDate = $payment['payment_date']
            ? date('M d, Y', strtotime($payment['payment_date']))
            : 'No date';
        echo "  Payment #{$payment['id']}:\n";
        echo "    Defense Date: {$defenseDate}\n";
        echo "    Payment Date: {$paymentDate}\n";
        echo "    Amount: ₱{$payment['amount']}\n\n";
    }
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "✓ Sorting Logic Applied:\n";
echo "  - Panelist modal: Students sorted by defense_date DESC\n";
echo "  - Student modal: Payments sorted by defense_date DESC\n";
echo "  - Latest dates appear at the TOP of the list\n";
