<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing AA Status Observer ===\n\n";

// Create a new defense request for testing
$defense = new \App\Models\DefenseRequest();
$defense->school_id = 'TEST123456';
$defense->first_name = 'Test';
$defense->middle_name = 'User';
$defense->last_name = 'Observer';
$defense->program = 'Master in Information Technology';
$defense->defense_type = 'Proposal';
$defense->defense_date = now();
$defense->workflow_state = 'pending';
$defense->save();

echo "Created test defense request #{$defense->id}\n";

// Create honorarium payments
$panelist = \App\Models\Panelist::first();
if (!$panelist) {
    $panelist = \App\Models\Panelist::create([
        'name' => 'Test Panelist',
        'email' => 'test@example.com',
        'designation' => 'Professor',
    ]);
}

$honorarium = \App\Models\HonorariumPayment::create([
    'defense_request_id' => $defense->id,
    'panelist_id' => $panelist->id,
    'panelist_name' => $panelist->name,
    'panelist_type' => 'internal',
    'role' => 'Adviser',
    'amount' => 5000,
    'payment_date' => now(),
    'payment_status' => 'pending',
]);

echo "Created test honorarium payment #{$honorarium->id}\n";

// Check before counts
echo "\nBefore AA status change:\n";
echo "  Student Records: " . \App\Models\StudentRecord::where('student_id', 'TEST123456')->count() . "\n";
echo "  Payment Records: " . \App\Models\PaymentRecord::where('defense_request_id', $defense->id)->count() . "\n";

// Create AA verification with status 'pending'
echo "\nCreating AA verification with status 'pending'...\n";
$verification = \App\Models\AaPaymentVerification::create([
    'defense_request_id' => $defense->id,
    'assigned_to' => \App\Models\User::where('role', 'Administrative Assistant')->first()->id ?? 1,
    'status' => 'pending',
]);

echo "AA verification created #{$verification->id}\n";

// Check counts (should still be 0)
echo "\nAfter creating with 'pending' status:\n";
echo "  Student Records: " . \App\Models\StudentRecord::where('student_id', 'TEST123456')->count() . "\n";
echo "  Payment Records: " . \App\Models\PaymentRecord::where('defense_request_id', $defense->id)->count() . "\n";

// Update status to ready_for_finance (should trigger sync)
echo "\n🔄 Updating AA status to 'ready_for_finance'...\n";
$verification->status = 'ready_for_finance';
$verification->save();

echo "AA status updated!\n";

// Check after counts
echo "\nAfter AA status = 'ready_for_finance':\n";
$studentCount = \App\Models\StudentRecord::where('student_id', 'TEST123456')->count();
$paymentCount = \App\Models\PaymentRecord::where('defense_request_id', $defense->id)->count();
echo "  Student Records: {$studentCount}\n";
echo "  Payment Records: {$paymentCount}\n";

if ($studentCount > 0 && $paymentCount > 0) {
    echo "\n✅ Observer triggered successfully!\n";
    
    $student = \App\Models\StudentRecord::where('student_id', 'TEST123456')->first();
    echo "\nCreated student:\n";
    echo "  Name: {$student->first_name} {$student->last_name}\n";
    echo "  Program Record ID: {$student->program_record_id}\n";
    echo "  Payments: {$student->payments()->count()}\n";
    echo "  Panelists: {$student->panelists()->count()}\n";
} else {
    echo "\n❌ Observer did NOT trigger!\n";
}

// Cleanup
echo "\nCleaning up test data...\n";
\App\Models\PaymentRecord::where('defense_request_id', $defense->id)->delete();
\App\Models\StudentRecord::where('student_id', 'TEST123456')->delete();
\App\Models\PanelistRecord::where('pfirst_name', 'Test Panelist')->delete();
$honorarium->delete();
$verification->delete();
$defense->delete();

echo "Test completed!\n";
