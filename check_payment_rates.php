<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Payment Rates Check ===\n\n";

$defenseTypes = ['Proposal', 'Prefinal', 'Final'];

foreach ($defenseTypes as $type) {
    echo "\n{$type} Defense Rates:\n";
    echo str_repeat("-", 50) . "\n";
    
    $rates = \App\Models\PaymentRate::where('defense_type', $type)->get();
    
    if ($rates->count() === 0) {
        echo "  ❌ NO RATES FOUND!\n";
    } else {
        foreach ($rates as $rate) {
            echo "  {$rate->program_level} - {$rate->type}: ₱{$rate->amount}\n";
        }
        $total = $rates->sum('amount');
        echo "  Total: ₱{$total}\n";
    }
}

echo "\n\n=== Checking Case Sensitivity ===\n\n";
$allRates = \App\Models\PaymentRate::all();
$uniqueDefenseTypes = $allRates->pluck('defense_type')->unique()->sort();

echo "Defense types in database:\n";
foreach ($uniqueDefenseTypes as $type) {
    echo "  - '{$type}'\n";
}
