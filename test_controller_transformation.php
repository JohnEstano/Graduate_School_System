<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\StudentRecord;

// Test the transformation logic
$programId = 1; // Doctor in Business Management

$students = StudentRecord::where('program_record_id', $programId)
    ->with(['payments.panelist'])
    ->orderBy('last_name', 'asc')
    ->limit(1)
    ->get();

echo "Original students count: " . $students->count() . "\n\n";

// Apply the same transformation as the controller
$transformed = $students->transform(function ($student) {
    $groupedPayments = [];
    
    $originalPayments = $student->payments;
    
    foreach ($originalPayments as $payment) {
        $defenseDate = $student->defense_date ? date('Y-m-d', strtotime($student->defense_date)) : null;
        $key = $defenseDate . '_' . $student->defense_type;
        
        if (!isset($groupedPayments[$key])) {
            $groupedPayments[$key] = [
                'id' => $payment->id,
                'defense_date' => $defenseDate,
                'defense_type' => $student->defense_type,
                'defense_status' => $payment->defense_status,
                'or_number' => $student->or_number,
                'payment_date' => $payment->payment_date ? date('Y-m-d', strtotime($payment->payment_date)) : null,
                'amount' => 0,
                'panelists' => []
            ];
        }
        
        $groupedPayments[$key]['amount'] += floatval($payment->amount);
        
        if ($payment->panelist) {
            $groupedPayments[$key]['panelists'][] = [
                'name' => trim("{$payment->panelist->pfirst_name} {$payment->panelist->pmiddle_name} {$payment->panelist->plast_name}"),
                'role' => $payment->panelist->role,
                'amount' => $payment->amount
            ];
        }
    }
    
    $student->defense_date = $student->defense_date ? date('Y-m-d', strtotime($student->defense_date)) : null;
    
    $studentArray = $student->toArray();
    $studentArray['payments'] = array_values($groupedPayments);
    
    return $studentArray;
});

echo "Transformed students:\n";
foreach ($transformed as $student) {
    echo "\nStudent: {$student['first_name']} {$student['last_name']}\n";
    echo "Payments count: " . count($student['payments']) . "\n";
    
    foreach ($student['payments'] as $idx => $payment) {
        echo "\n  Payment {$idx}:\n";
        echo "    Defense Date: {$payment['defense_date']}\n";
        echo "    Amount: ₱" . number_format($payment['amount'], 2) . "\n";
        echo "    Panelists: " . count($payment['panelists']) . "\n";
        
        foreach ($payment['panelists'] as $panelist) {
            echo "      - {$panelist['name']} ({$panelist['role']}): ₱{$panelist['amount']}\n";
        }
    }
}
