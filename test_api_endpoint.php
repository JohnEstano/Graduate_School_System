<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PaymentRate;

echo "=== TESTING API ENDPOINT DATA STRUCTURE ===\n\n";

$rates = PaymentRate::all()->map(function ($r) {
    return [
        'program_level' => $r->program_level,
        'type' => $r->type,
        'defense_type' => $r->defense_type,
        'amount' => (float) $r->amount,
    ];
})->values();

$response = [
    'rates' => $rates,
];

echo "JSON Response Structure:\n";
echo json_encode($response, JSON_PRETTY_PRINT) . "\n\n";

echo "=== CHECKING SPECIFIC RATE LOOKUPS ===\n\n";

// Simulate what the frontend would do
$paymentRates = $rates->toArray();

echo "Total rates available: " . count($paymentRates) . "\n\n";

// Test case 1: Panel Member for Masteral Proposal
echo "Test 1: Looking for Panel Member rate\n";
echo "  Program Level: Masteral\n";
echo "  Defense Type: Proposal\n";
echo "  Role: Panel Member\n\n";

$normalizeDefenseType = function($dt) {
    return strtolower(preg_replace('/[^a-z]/i', '', $dt));
};

$targetDefenseType = $normalizeDefenseType('Proposal');
$found = null;

foreach ($paymentRates as $r) {
    $matchesProgram = $r['program_level'] === 'Masteral';
    $matchesType = $r['type'] === 'Panel Member';
    $matchesDefense = $normalizeDefenseType($r['defense_type']) === $targetDefenseType;
    
    echo "  Checking: Program={$r['program_level']}, Type={$r['type']}, Defense={$r['defense_type']}\n";
    echo "    Matches Program: " . ($matchesProgram ? 'YES' : 'NO') . "\n";
    echo "    Matches Type: " . ($matchesType ? 'YES' : 'NO') . "\n";
    echo "    Matches Defense: " . ($matchesDefense ? 'YES' : 'NO') . "\n";
    
    if ($matchesProgram && $matchesType && $matchesDefense) {
        $found = $r;
        echo "    ✓ MATCH FOUND!\n";
        break;
    }
    echo "\n";
}

if ($found) {
    echo "\nResult: FOUND - Amount: " . number_format($found['amount'], 2) . "\n";
} else {
    echo "\nResult: NOT FOUND\n";
    echo "\nAll 'Panel Member' rates:\n";
    foreach ($paymentRates as $r) {
        if (stripos($r['type'], 'Panel Member') !== false) {
            echo "  - Program: {$r['program_level']}, Defense: {$r['defense_type']}, Amount: {$r['amount']}\n";
        }
    }
}

echo "\n\n=== DEFENSE TYPE NORMALIZATION TEST ===\n\n";

$testDefenseTypes = ['Proposal', 'Pre-final', 'Final', 'proposal', 'PROPOSAL', 'Pre-Final'];

foreach ($testDefenseTypes as $dt) {
    $normalized = $normalizeDefenseType($dt);
    echo "'{$dt}' -> '{$normalized}'\n";
}

echo "\n=== DONE ===\n";
