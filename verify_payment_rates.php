<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentRate;

echo "\n=== PAYMENT RATES VERIFICATION ===\n\n";

$defenseTypes = ['Proposal', 'Pre-final', 'Final'];
$programLevels = ['Masteral', 'Doctorate'];

foreach ($programLevels as $level) {
    echo "📚 {$level} Program:\n";
    echo str_repeat('-', 50) . "\n";
    
    foreach ($defenseTypes as $defense) {
        $rates = PaymentRate::where('program_level', $level)
            ->where('defense_type', $defense)
            ->orderBy('type')
            ->get();
        
        echo "\n  🎓 {$defense} Defense ({$rates->count()} rates):\n";
        foreach ($rates as $rate) {
            echo "     • " . str_pad($rate->type, 20) . " ₱" . number_format($rate->amount, 2) . "\n";
        }
    }
    echo "\n" . str_repeat('=', 50) . "\n\n";
}

echo "✅ Total Records: " . PaymentRate::count() . "\n\n";
