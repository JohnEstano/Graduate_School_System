<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\StudentRecord;
use App\Models\PaymentRecord;

// Check Cristina Cruz (ID: 202454043)
$student = StudentRecord::where('student_id', '202454043')
    ->with(['payments.panelist'])
    ->first();

if (!$student) {
    echo "Student not found!\n";
    exit;
}

echo "Student: {$student->first_name} {$student->last_name}\n";
echo "Student ID: {$student->student_id}\n";
echo "Defense Date (raw): {$student->defense_date}\n";
echo "Defense Type: {$student->defense_type}\n";
echo "OR Number: {$student->or_number}\n\n";

echo "Payments found: " . $student->payments->count() . "\n\n";

// Group payments like the controller does
$groupedPayments = [];

foreach ($student->payments as $payment) {
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

echo "Grouped Payments:\n";
foreach ($groupedPayments as $key => $payment) {
    echo "\nPayment Group: {$key}\n";
    echo "  Defense Date: {$payment['defense_date']}\n";
    echo "  Defense Type: {$payment['defense_type']}\n";
    echo "  Defense Status: {$payment['defense_status']}\n";
    echo "  OR Number: {$payment['or_number']}\n";
    echo "  Payment Date: {$payment['payment_date']}\n";
    echo "  Total Amount: ₱" . number_format($payment['amount'], 2) . "\n";
    echo "  Panelists (" . count($payment['panelists']) . "):\n";
    
    foreach ($payment['panelists'] as $panelist) {
        echo "    - {$panelist['name']} ({$panelist['role']}): ₱{$panelist['amount']}\n";
    }
}
