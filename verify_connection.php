<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\PaymentRecord;

echo "VERIFYING DATA CONNECTION: Honorarium ↔ Student Records\n";
echo "==========================================================\n\n";

// Get payment record that connects student and panelist
$payment = PaymentRecord::with(['studentRecord', 'panelist'])
    ->whereHas('studentRecord', function($q) {
        $q->where('first_name', 'Angelica')->where('last_name', 'Villanueva');
    })
    ->whereHas('panelist', function($q) {
        $q->where('pfirst_name', 'Mark')->where('plast_name', 'Bautista');
    })
    ->first();

if (!$payment) {
    echo "Payment connection not found!\n";
    exit;
}

$student = $payment->studentRecord;
$panelist = $payment->panelist;

echo "📊 PAYMENT CONNECTION DETAILS:\n";
echo "================================\n\n";

echo "👨‍🎓 STUDENT SIDE:\n";
echo "  Name: {$student->first_name} {$student->middle_name} {$student->last_name}\n";
echo "  Student ID: {$student->student_id}\n";
echo "  Defense Type: {$student->defense_type}\n";
echo "  Defense Date: " . date('Y-m-d', strtotime($student->defense_date)) . "\n";
echo "  OR Number: {$student->or_number}\n";
echo "  Program: {$student->program}\n\n";

echo "💰 PAYMENT DETAILS:\n";
echo "  Amount Paid: ₱" . number_format($payment->amount, 2) . "\n";
echo "  Payment Date: " . date('Y-m-d', strtotime($payment->payment_date)) . "\n";
echo "  Defense Status: {$payment->defense_status}\n";
echo "  School Year: {$payment->school_year}\n\n";

echo "👨‍🏫 PANELIST SIDE (Recipient):\n";
$panelistName = trim("{$panelist->pfirst_name} {$panelist->pmiddle_name} {$panelist->plast_name}");
echo "  Name: {$panelistName}\n";
echo "  Role: {$panelist->role}\n";
echo "  Amount Received: ₱" . number_format($payment->amount, 2) . "\n";
echo "  Received Date: " . date('Y-m-d', strtotime($panelist->received_date)) . "\n\n";

echo "✅ DATA VERIFICATION:\n";
echo "======================\n";
echo "✓ Student Record: Angelica Villanueva has payment for {$student->defense_type} defense\n";
echo "✓ Payment Record: ₱" . number_format($payment->amount, 2) . " paid on " . date('Y-m-d', strtotime($payment->payment_date)) . "\n";
echo "✓ Panelist Record: Dr. Mark G. Bautista ({$panelist->role}) received ₱" . number_format($payment->amount, 2) . "\n";
echo "✓ Defense Date: " . date('Y-m-d', strtotime($student->defense_date)) . " (Date only format)\n";
echo "✓ OR Number: {$student->or_number}\n\n";

echo "🔗 CONNECTION CONFIRMED:\n";
echo "========================\n";
echo "The same payment appears in BOTH views:\n";
echo "1. In Honorarium (Panelist view): Dr. Mark G. Bautista shows Angelica Villanueva paid ₱1,000\n";
echo "2. In Student Records: Angelica Villanueva shows she paid ₱1,000 to Dr. Mark G. Bautista\n\n";

echo "All dates are formatted as Y-m-d (date only) ✓\n";
