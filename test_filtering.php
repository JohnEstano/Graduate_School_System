<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

echo "=== TESTING ADVISER DASHBOARD FILTERING ===\n\n";

// Get Muslimin (ID: 17)
$adviser = User::find(17);
if (!$adviser) {
    echo "Adviser not found!\n";
    exit;
}

echo "Testing for adviser: {$adviser->first_name} {$adviser->last_name} (ID: {$adviser->id})\n\n";

// Test the filtering logic from DefenseRequirementController
$requests = DefenseRequest::with(['adviserUser','assignedTo'])
    ->where(function($q) use ($adviser){
        // Match by adviser_user_id (exact match) - this is the primary way
        $q->where('adviser_user_id',$adviser->id)
          // OR match by assigned_to_user_id (workflow assignment)
          ->orWhere('assigned_to_user_id',$adviser->id);
    })
    ->orderByDesc('created_at')
    ->get();

echo "Requests found: " . $requests->count() . "\n";
foreach ($requests as $request) {
    echo "- ID: {$request->id} | Student: {$request->first_name} {$request->last_name} | Adviser: {$request->defense_adviser} | State: {$request->workflow_state} | Adviser User ID: {$request->adviser_user_id} | Assigned To: {$request->assigned_to_user_id}\n";
}

echo "\n=== ALL DEFENSE REQUESTS ===\n";
$allRequests = DefenseRequest::all();
foreach ($allRequests as $request) {
    echo "- ID: {$request->id} | Student: {$request->first_name} {$request->last_name} | Adviser: {$request->defense_adviser} | State: {$request->workflow_state} | Adviser User ID: " . ($request->adviser_user_id ?: 'NULL') . " | Assigned To: " . ($request->assigned_to_user_id ?: 'NULL') . "\n";
}

echo "\n=== END TEST ===\n";
