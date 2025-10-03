<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

// Bootstrap the application
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    echo "=== Defense Requests Debug ===\n";
    
    $defenseRequests = App\Models\DefenseRequest::all();
    echo "Total Defense Requests: " . $defenseRequests->count() . "\n\n";
    
    if ($defenseRequests->count() > 0) {
        foreach ($defenseRequests as $request) {
            echo "ID: {$request->id}\n";
            echo "Student: {$request->first_name} {$request->last_name}\n";
            echo "Adviser Name: {$request->defense_adviser}\n";
            echo "Adviser User ID: " . ($request->adviser_user_id ?? 'NULL') . "\n";
            echo "Assigned To: " . ($request->assigned_to_user_id ?? 'NULL') . "\n";
            echo "Workflow State: {$request->workflow_state}\n";
            echo "Created: {$request->created_at}\n";
            echo "---\n";
        }
    }
    
    echo "\n=== Faculty Users ===\n";
    $faculty = App\Models\User::where('role', 'Faculty')->get(['id', 'first_name', 'last_name', 'role']);
    echo "Total Faculty: " . $faculty->count() . "\n\n";
    
    foreach ($faculty as $user) {
        echo "ID: {$user->id} - {$user->first_name} {$user->last_name}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
