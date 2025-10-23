<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\StudentRecord;
use App\Models\PaymentRecord;
use App\Models\PanelistRecord;

echo "Testing Student Payment Records with Panelist Breakdown\n";
echo "========================================================\n\n";

// Get a student with payments
$student = StudentRecord::with(['payments.panelist'])
    ->whereHas('payments')
    ->first();

if (!$student) {
    echo "No students with payments found!\n";
    exit;
}

echo "Student: {$student->first_name} {$student->last_name}\n";
echo "Student ID: {$student->student_id}\n";
echo "Defense Date: {$student->defense_date}\n";
echo "Defense Type: {$student->defense_type}\n";
echo "OR Number: {$student->or_number}\n\n";

echo "Payment Records:\n";
echo "================\n";

$totalPaid = 0;

foreach ($student->payments as $payment) {
    echo "\nPayment ID: {$payment->id}\n";
    echo "  Amount: ₱" . number_format($payment->amount, 2) . "\n";
    echo "  Payment Date: {$payment->payment_date}\n";
    echo "  Defense Status: {$payment->defense_status}\n";
    
    if ($payment->panelist) {
        $panelistName = trim("{$payment->panelist->pfirst_name} {$payment->panelist->pmiddle_name} {$payment->panelist->plast_name}");
        echo "  Panelist: {$panelistName}\n";
        echo "  Role: {$payment->panelist->role}\n";
    } else {
        echo "  Panelist: NOT FOUND\n";
    }
    
    $totalPaid += floatval($payment->amount);
}

echo "\n\nTotal Amount Paid: ₱" . number_format($totalPaid, 2) . "\n";

// Show breakdown grouped by defense
echo "\n\nGrouped Payment Breakdown:\n";
echo "===========================\n";

$groupedPayments = [];

foreach ($student->payments as $payment) {
    $key = $student->defense_date . '_' . $student->defense_type;
    
    if (!isset($groupedPayments[$key])) {
        $groupedPayments[$key] = [
            'defense_date' => $student->defense_date,
            'defense_type' => $student->defense_type,
            'total' => 0,
            'panelists' => []
        ];
    }
    
    $groupedPayments[$key]['total'] += floatval($payment->amount);
    
    if ($payment->panelist) {
        $panelistName = trim("{$payment->panelist->pfirst_name} {$payment->panelist->pmiddle_name} {$payment->panelist->plast_name}");
        $groupedPayments[$key]['panelists'][] = [
            'name' => $panelistName,
            'role' => $payment->panelist->role,
            'amount' => $payment->amount
        ];
    }
}

foreach ($groupedPayments as $defense) {
    echo "\nDefense: {$defense['defense_type']} on {$defense['defense_date']}\n";
    echo "Total Payment: ₱" . number_format($defense['total'], 2) . "\n";
    echo "Breakdown:\n";
    
    foreach ($defense['panelists'] as $panelist) {
        echo "  - {$panelist['name']} ({$panelist['role']}): ₱" . number_format($panelist['amount'], 2) . "\n";
    }
}
