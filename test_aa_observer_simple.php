<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing AA Observer with Existing Data ===\n\n";

// Get an AA verification
$verification = \App\Models\AaPaymentVerification::first();

if (!$verification) {
    echo "No AA verification found!\n";
    exit;
}

echo "Found AA Verification #{$verification->id}\n";
echo "  Defense Request: #{$verification->defense_request_id}\n";
echo "  Current Status: {$verification->status}\n";

// Change status to pending first
echo "\nChanging status to 'pending'...\n";
$verification->status = 'pending';
$verification->save();

echo "Status changed to 'pending'\n";

// Now change to ready_for_finance (should trigger observer)
echo "\n🔄 Changing status to 'ready_for_finance'...\n";
$verification->status = 'ready_for_finance';
$verification->save();

echo "✅ Status changed to 'ready_for_finance'!\n";
echo "\nObserver should have been triggered. Check logs.\n";

// Change back to completed
echo "\nRestoring status to 'completed'...\n";
$verification->status = 'completed';
$verification->save();

echo "Done!\n";
