<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentRate;

echo "=== Pre-final Payment Rates Check ===" . PHP_EOL . PHP_EOL;

$prefinalRates = PaymentRate::where('defense_type', 'Pre-final')->get();

if ($prefinalRates->isEmpty()) {
    echo "❌ NO Pre-final rates found!" . PHP_EOL;
} else {
    echo "✓ Found {$prefinalRates->count()} Pre-final rates:" . PHP_EOL;
    foreach ($prefinalRates as $rate) {
        echo "  - {$rate->program_level} - {$rate->type} - ₱{$rate->amount}" . PHP_EOL;
    }
}

echo PHP_EOL . "=== All Defense Types in Database ===" . PHP_EOL;
$allTypes = PaymentRate::select('defense_type')->distinct()->pluck('defense_type');
foreach ($allTypes as $type) {
    echo "  - '{$type}'" . PHP_EOL;
}

echo PHP_EOL . "=== Payment Date Migration Check ===" . PHP_EOL;
try {
    $defenseRequest = \App\Models\DefenseRequest::first();
    if ($defenseRequest) {
        echo "✓ DefenseRequest model can access payment_date field" . PHP_EOL;
        echo "  Current payment_date value: " . ($defenseRequest->payment_date ?? 'NULL') . PHP_EOL;
    } else {
        echo "  No defense requests found to test" . PHP_EOL;
    }
} catch (\Exception $e) {
    echo "❌ Error accessing payment_date: {$e->getMessage()}" . PHP_EOL;
}

echo PHP_EOL . "✅ All checks completed!" . PHP_EOL;
