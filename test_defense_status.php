<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\PaymentRecord;

echo "=== Testing Defense Status Values ===\n\n";

$payments = PaymentRecord::with('studentRecord')->take(15)->get();

foreach ($payments as $payment) {
    echo "Student: {$payment->studentRecord->first_name} {$payment->studentRecord->last_name}\n";
    echo "Defense Type: {$payment->studentRecord->defense_type}\n";
    echo "Defense Date: {$payment->studentRecord->defense_date}\n";
    echo "Defense Status: {$payment->defense_status}\n";
    echo "Amount: ₱" . number_format($payment->amount, 2) . "\n";
    echo str_repeat("-", 50) . "\n";
}

echo "\n=== Defense Status Distribution ===\n";
$completed = PaymentRecord::where('defense_status', 'Completed')->count();
$notCompleted = PaymentRecord::where('defense_status', 'Not Completed')->count();

echo "Completed: {$completed}\n";
echo "Not Completed: {$notCompleted}\n";
echo "Total: " . ($completed + $notCompleted) . "\n";
