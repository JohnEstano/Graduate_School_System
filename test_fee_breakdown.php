<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\StudentRecord;

// Test with Cristina Cruz (Masteral - Final Defense)
$student = StudentRecord::where('student_id', '202454043')
    ->with(['payments.panelist'])
    ->first();

echo "Student: {$student->first_name} {$student->last_name}\n";
echo "Program: {$student->program}\n";
echo "Defense Type: {$student->defense_type}\n\n";

// Apply transformation
$originalPayments = $student->payments;
$groupedPayments = [];

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

// Add REC FEE and SCHOOL SHARE
foreach ($groupedPayments as &$payment) {
    $panelistTotal = floatval($payment['amount']);
    
    $isMasteral = stripos($student->program, 'Master') !== false || stripos($student->program, 'Masteral') !== false;
    $isDoctorate = stripos($student->program, 'Doctor') !== false || stripos($student->program, 'Doctorate') !== false;
    
    $recFee = 0;
    $schoolShare = 0;
    
    if ($payment['defense_type'] === 'Final') {
        if ($isMasteral) {
            $recFee = 6000.00;
            $schoolShare = 11250.00;
        } elseif ($isDoctorate) {
            $recFee = 7000.00;
            $schoolShare = 0.00;
        }
    }
    
    $payment['panelists'][] = [
        'name' => '-',
        'role' => 'REC FEE',
        'amount' => number_format($recFee, 2, '.', '')
    ];
    
    $payment['panelists'][] = [
        'name' => '-',
        'role' => 'SCHOOL SHARE',
        'amount' => number_format($schoolShare, 2, '.', '')
    ];
    
    $grandTotal = $panelistTotal + $recFee + $schoolShare;
    
    $payment['panelist_total'] = $panelistTotal;
    $payment['rec_fee'] = $recFee;
    $payment['school_share'] = $schoolShare;
    $payment['grand_total'] = $grandTotal;
}

echo "Payment Breakdown:\n";
echo str_repeat("-", 80) . "\n";
printf("%-40s %-20s %15s\n", "Panelist Name", "Role", "Amount");
echo str_repeat("-", 80) . "\n";

foreach ($groupedPayments as $payment) {
    foreach ($payment['panelists'] as $panelist) {
        printf("%-40s %-20s %15s\n", 
            $panelist['name'], 
            $panelist['role'], 
            "₱" . number_format($panelist['amount'], 2)
        );
    }
    echo str_repeat("-", 80) . "\n";
    printf("%-40s %-20s %15s\n", "", "TOTAL", "₱" . number_format($payment['grand_total'], 2));
    echo str_repeat("=", 80) . "\n";
}
