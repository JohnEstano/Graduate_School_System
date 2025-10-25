<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentRate;

echo "Payment Rates in Database:\n";
echo str_repeat("=", 100) . "\n\n";

$programLevels = ['Masteral', 'Doctorate'];
$defenseTypes = ['Proposal', 'Pre-final', 'Final'];

foreach ($programLevels as $level) {
    echo "\n" . strtoupper($level) . " PROGRAM\n";
    echo str_repeat("-", 100) . "\n";
    
    foreach ($defenseTypes as $defenseType) {
        echo "\n  {$defenseType} Defense:\n";
        
        $rates = PaymentRate::where('program_level', $level)
            ->where('defense_type', $defenseType)
            ->orderByRaw("FIELD(type, 'Adviser', 'Panel Chair', 'Panel Member 1', 'Panel Member 2', 'Panel Member 3', 'Panel Member 4', 'REC Fee', 'School Share')")
            ->get();
        
        foreach ($rates as $rate) {
            $amount = $rate->amount > 0 ? '₱' . number_format($rate->amount, 2) : '--';
            echo sprintf("    %-20s : %s\n", $rate->type, $amount);
        }
    }
    echo "\n";
}

echo "\nTotal records: " . PaymentRate::count() . "\n";
echo "\nThese rates can now be edited at: /dean/payment-rates\n";
