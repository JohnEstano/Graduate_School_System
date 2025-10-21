<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;
use App\Models\User;
use Illuminate\Support\Facades\Log;

echo "Testing Defense Request Creation...\n";

// Check if faculty users exist
$facultyUsers = User::where('role', 'Faculty')->get();
echo "Faculty users found: " . $facultyUsers->count() . "\n";
foreach ($facultyUsers as $faculty) {
    echo "- ID: {$faculty->id}, Name: {$faculty->first_name} {$faculty->last_name}\n";
}

// Test creating a defense request
try {
    $defenseRequest = DefenseRequest::create([
        'first_name' => 'Test',
        'middle_name' => 'Student',
        'last_name' => 'User',
        'school_id' => '2021-123456',
        'program' => 'Master of Science in Computer Science',
        'thesis_title' => 'Test Thesis Title',
        'defense_type' => 'Proposal',
        'defense_adviser' => 'Muslimin B. Ontong',
        'reference_no' => 'TEST-2025-001',
        'submitted_by' => 1, // Assuming user ID 1 exists
        'status' => 'Pending',
        'priority' => 'Medium',
        'workflow_state' => 'adviser-review',
    ]);
    
    echo "\nDefense request created successfully!\n";
    echo "ID: {$defenseRequest->id}\n";
    echo "Student: {$defenseRequest->first_name} {$defenseRequest->last_name}\n";
    echo "Adviser: {$defenseRequest->defense_adviser}\n";
    echo "Workflow State: {$defenseRequest->workflow_state}\n";
    
    // Try to find adviser
    $adviserName = 'Muslimin B. Ontong';
    echo "\nLooking for adviser: {$adviserName}\n";
    
    $adviserUser = User::where(function($query) use ($adviserName) {
        $query->whereRaw('CONCAT(first_name, " ", last_name) = ?', [$adviserName])
              ->orWhereRaw('CONCAT(last_name, ", ", first_name) = ?', [$adviserName]);
        
        $nameParts = preg_split('/\s+/', $adviserName);
        if (count($nameParts) >= 2) {
            $firstName = $nameParts[0];
            $lastName = end($nameParts);
            
            $query->orWhere(function($q) use ($firstName, $lastName) {
                $q->where('first_name', 'LIKE', '%' . $firstName . '%')
                  ->where('last_name', 'LIKE', '%' . $lastName . '%');
            });
        }
    })
    ->where('role', 'Faculty')
    ->first();
    
    if ($adviserUser) {
        echo "Found adviser user: ID {$adviserUser->id}, Name: {$adviserUser->first_name} {$adviserUser->last_name}\n";
        
        $defenseRequest->adviser_user_id = $adviserUser->id;
        $defenseRequest->assigned_to_user_id = $adviserUser->id;
        $defenseRequest->save();
        echo "Updated defense request with adviser user ID\n";
    } else {
        echo "Adviser user not found\n";
    }
    
} catch (\Exception $e) {
    echo "Error creating defense request: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

// Check defense requests
echo "\nAll defense requests:\n";
$requests = DefenseRequest::all();
foreach ($requests as $request) {
    echo "- ID: {$request->id}, Student: {$request->first_name} {$request->last_name}, Adviser: {$request->defense_adviser}, State: {$request->workflow_state}\n";
}
