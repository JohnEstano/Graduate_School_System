<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;

echo "\n=== UPDATING EXISTING DEFENSE REQUESTS WITH AMOUNTS ===\n\n";

// Find all defense requests without an amount
$requestsWithoutAmount = DefenseRequest::whereNull('amount')
    ->orWhere('amount', 0)
    ->get();

echo "Found {$requestsWithoutAmount->count()} defense requests without amounts.\n\n";

if ($requestsWithoutAmount->isEmpty()) {
    echo "✅ All defense requests already have amounts set!\n\n";
    exit(0);
}

$updated = 0;
$errors = 0;

foreach ($requestsWithoutAmount as $request) {
    try {
        $amount = $request->calculateAndSetAmount();
        $request->save();
        
        echo "✅ Defense Request #{$request->id}: {$request->first_name} {$request->last_name}\n";
        echo "   Program: {$request->program}\n";
        echo "   Defense Type: {$request->defense_type}\n";
        echo "   Amount Set: ₱" . number_format($amount, 2) . "\n\n";
        
        $updated++;
    } catch (\Exception $e) {
        echo "❌ Failed to update Defense Request #{$request->id}: {$e->getMessage()}\n\n";
        $errors++;
    }
}

echo str_repeat('=', 70) . "\n";
echo "✅ Successfully updated: {$updated}\n";
if ($errors > 0) {
    echo "❌ Errors: {$errors}\n";
}
echo "\n";
