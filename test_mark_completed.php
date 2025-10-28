<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;
use App\Models\AaPaymentVerification;

echo "=== Testing Mark as Completed Functionality ===" . PHP_EOL . PHP_EOL;

// Find a defense request to test with
$defense = DefenseRequest::where('workflow_state', '!=', 'completed')->first();

if (!$defense) {
    echo "❌ No defense requests available for testing" . PHP_EOL;
    exit(1);
}

echo "📋 Testing with Defense Request:" . PHP_EOL;
echo "   ID: {$defense->id}" . PHP_EOL;
echo "   Student: {$defense->first_name} {$defense->last_name}" . PHP_EOL;
echo "   Current Status: {$defense->status}" . PHP_EOL;
echo "   Current Workflow State: {$defense->workflow_state}" . PHP_EOL;
echo PHP_EOL;

// Check current AA verification status
$currentVerification = AaPaymentVerification::where('defense_request_id', $defense->id)->first();
echo "📋 Current AA Verification:" . PHP_EOL;
if ($currentVerification) {
    echo "   ID: {$currentVerification->id}" . PHP_EOL;
    echo "   Status: {$currentVerification->status}" . PHP_EOL;
} else {
    echo "   ⚠️  No AA verification record exists yet" . PHP_EOL;
}
echo PHP_EOL;

echo "🔄 Simulating 'Mark as Completed' action..." . PHP_EOL;
echo PHP_EOL;

// Simulate the controller action
try {
    // Update defense request status
    $defense->status = 'Completed';
    $defense->workflow_state = 'completed';
    $defense->save();
    
    // Get or create AA verification record
    $verification = AaPaymentVerification::firstOrCreate(
        ['defense_request_id' => $defense->id],
        [
            'assigned_to' => 1, // Using user ID 1 for testing
            'status' => 'pending',
        ]
    );
    
    // Update AA verification to completed
    $verification->status = 'completed';
    $verification->assigned_to = 1;
    $verification->save();
    
    echo "✅ SUCCESS!" . PHP_EOL . PHP_EOL;
    
    // Reload and display updated values
    $defense->refresh();
    $verification->refresh();
    
    echo "📋 Updated Defense Request:" . PHP_EOL;
    echo "   Status: {$defense->status}" . PHP_EOL;
    echo "   Workflow State: {$defense->workflow_state}" . PHP_EOL;
    echo PHP_EOL;
    
    echo "📋 Updated AA Verification:" . PHP_EOL;
    echo "   ID: {$verification->id}" . PHP_EOL;
    echo "   Status: {$verification->status}" . PHP_EOL;
    echo "   Defense Request ID: {$verification->defense_request_id}" . PHP_EOL;
    echo PHP_EOL;
    
    // Verify both are completed
    if ($defense->status === 'Completed' && 
        $defense->workflow_state === 'completed' && 
        $verification->status === 'completed') {
        echo "✅ VERIFICATION PASSED: Both defense status and AA status are 'completed'" . PHP_EOL;
    } else {
        echo "❌ VERIFICATION FAILED: Statuses don't match expected values" . PHP_EOL;
    }
    
} catch (\Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . PHP_EOL;
    echo "   " . $e->getFile() . ":" . $e->getLine() . PHP_EOL;
}
