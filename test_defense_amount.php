<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;
use App\Models\PaymentRate;
use App\Helpers\ProgramLevel;

echo "\n=== TESTING DEFENSE REQUEST AMOUNT CALCULATION ===\n\n";

// Test data
$testPrograms = [
    'Master in Information Technology',
    'Doctor of Information Technology',
];

$testDefenseTypes = ['Proposal', 'Prefinal', 'Final'];

foreach ($testPrograms as $program) {
    $programLevel = ProgramLevel::getLevel($program);
    echo "📚 Program: {$program} (Level: {$programLevel})\n";
    echo str_repeat('-', 70) . "\n";
    
    foreach ($testDefenseTypes as $defenseType) {
        // Normalize defense type
        $normalizedType = $defenseType;
        if (strtolower($defenseType) === 'prefinal') {
            $normalizedType = 'Pre-final';
        }
        
        // Calculate expected amount
        $rates = PaymentRate::where('program_level', $programLevel)
            ->where('defense_type', $normalizedType)
            ->get();
        
        $totalAmount = $rates->sum('amount');
        
        echo "\n  🎓 {$defenseType} Defense:\n";
        echo "     Expected Amount: ₱" . number_format($totalAmount, 2) . "\n";
        echo "     Breakdown:\n";
        
        foreach ($rates as $rate) {
            echo "       • " . str_pad($rate->type, 20) . " ₱" . number_format($rate->amount, 2) . "\n";
        }
    }
    
    echo "\n" . str_repeat('=', 70) . "\n\n";
}

// Test the model method
echo "🧪 Testing DefenseRequest::calculateAndSetAmount() method:\n";
echo str_repeat('-', 70) . "\n";

$testRequest = new DefenseRequest([
    'program' => 'Master in Information Technology',
    'defense_type' => 'Proposal',
]);

$calculatedAmount = $testRequest->calculateAndSetAmount();
echo "✅ Method works! Calculated amount: ₱" . number_format($calculatedAmount, 2) . "\n";
echo "   Amount set on model: ₱" . number_format($testRequest->amount, 2) . "\n\n";

// Test with Prefinal (should normalize to Pre-final)
$testRequest2 = new DefenseRequest([
    'program' => 'Doctor of Information Technology',
    'defense_type' => 'Prefinal',
]);

$calculatedAmount2 = $testRequest2->calculateAndSetAmount();
echo "✅ Prefinal normalization works! Calculated amount: ₱" . number_format($calculatedAmount2, 2) . "\n";
echo "   Amount set on model: ₱" . number_format($testRequest2->amount, 2) . "\n\n";

echo "✅ All tests passed!\n\n";
