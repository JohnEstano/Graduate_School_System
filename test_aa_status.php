<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DefenseRequest;
use App\Models\AaPaymentVerification;
use App\Models\HonorariumPayment;

echo "=== AA STATUS UPDATE VERIFICATION ===\n\n";

// Get a sample defense request
$defenseRequest = DefenseRequest::whereNotNull('scheduled_date')
    ->whereNotNull('defense_chairperson')
    ->whereNotNull('defense_panelist1')
    ->first();

if (!$defenseRequest) {
    echo "❌ No suitable defense request found for testing\n";
    exit(1);
}

echo "✓ Found Defense Request ID: {$defenseRequest->id}\n";
echo "  Student: {$defenseRequest->first_name} {$defenseRequest->last_name}\n";
echo "  Program: {$defenseRequest->program}\n";
echo "  Defense Type: {$defenseRequest->defense_type}\n";
echo "  Program Level: {$defenseRequest->program_level}\n\n";

// Check AA verification record
$aaVerification = AaPaymentVerification::where('defense_request_id', $defenseRequest->id)->first();

if ($aaVerification) {
    echo "✓ AA Verification Record Exists\n";
    echo "  ID: {$aaVerification->id}\n";
    echo "  Status: {$aaVerification->status}\n";
    echo "  Assigned To: User ID {$aaVerification->assigned_to}\n";
} else {
    echo "⚠ No AA Verification Record (will be created on first status update)\n";
}

echo "\n";

// Check honorarium records
$honorariums = HonorariumPayment::where('defense_request_id', $defenseRequest->id)->get();

if ($honorariums->count() > 0) {
    echo "✓ Honorarium Records Found: {$honorariums->count()}\n";
    echo str_repeat("-", 80) . "\n";
    printf("%-25s %-20s %-15s %-15s\n", "Panelist Name", "Role", "Amount", "Status");
    echo str_repeat("-", 80) . "\n";
    
    foreach ($honorariums as $h) {
        printf("%-25s %-20s ₱%-14s %-15s\n", 
            substr($h->panelist_name, 0, 24),
            $h->role,
            number_format($h->amount, 2),
            $h->payment_status
        );
    }
} else {
    echo "⚠ No Honorarium Records (will be created when status = 'ready_for_finance')\n";
}

echo "\n\n=== ROUTE VERIFICATION ===\n\n";

$routes = \Route::getRoutes();
$aaRoute = collect($routes)->first(function($route) {
    return str_contains($route->uri(), 'aa-verification') && 
           $route->methods()[0] === 'POST';
});

if ($aaRoute) {
    echo "✓ AA Verification Route Registered\n";
    echo "  URI: " . $aaRoute->uri() . "\n";
    echo "  Methods: " . implode(', ', $aaRoute->methods()) . "\n";
    echo "  Action: " . $aaRoute->getActionName() . "\n";
} else {
    echo "❌ AA Verification Route NOT Found\n";
}

echo "\n\n=== PAYMENT RATES CHECK ===\n\n";

$rates = \App\Models\PaymentRate::where('program_level', $defenseRequest->program_level)
    ->where('defense_type', $defenseRequest->defense_type)
    ->get();

if ($rates->count() > 0) {
    echo "✓ Payment Rates Found for this defense: {$rates->count()}\n";
    echo str_repeat("-", 60) . "\n";
    printf("%-20s %-20s %-15s\n", "Type", "Defense Type", "Amount");
    echo str_repeat("-", 60) . "\n";
    
    foreach ($rates as $rate) {
        printf("%-20s %-20s ₱%-14s\n", 
            $rate->type,
            $rate->defense_type,
            number_format($rate->amount, 2)
        );
    }
} else {
    echo "❌ No Payment Rates Found\n";
    echo "  Program Level: {$defenseRequest->program_level}\n";
    echo "  Defense Type: {$defenseRequest->defense_type}\n";
}

echo "\n\n=== TEST SUMMARY ===\n\n";

$checks = [
    'Defense Request Available' => $defenseRequest !== null,
    'Route Registered' => $aaRoute !== null,
    'Payment Rates Available' => $rates->count() > 0,
];

$allPassed = true;
foreach ($checks as $check => $passed) {
    echo ($passed ? '✓' : '❌') . " {$check}\n";
    if (!$passed) $allPassed = false;
}

echo "\n";
echo $allPassed ? "✅ All checks passed!\n" : "⚠ Some checks failed. Please review above.\n";
echo "\n=== DONE ===\n";
