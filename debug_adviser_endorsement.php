<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\DefenseRequest;

// Get defense request ID from command line
$requestId = $argv[1] ?? 1;

echo "=== Debug Adviser Endorsement for Defense Request #{$requestId} ===\n\n";

$defenseRequest = DefenseRequest::find($requestId);
if (!$defenseRequest) {
    echo "Defense request not found!\n";
    exit(1);
}

echo "Defense Request:\n";
echo "  ID: {$defenseRequest->id}\n";
echo "  Student: {$defenseRequest->first_name} {$defenseRequest->last_name}\n";
echo "  Thesis: {$defenseRequest->thesis_title}\n";
echo "  AI Detection Certificate: " . ($defenseRequest->ai_detection_certificate ?? 'NOT UPLOADED') . "\n";
echo "  Endorsement Form: " . ($defenseRequest->endorsement_form ?? 'NOT UPLOADED') . "\n";
echo "  Adviser Status: {$defenseRequest->adviser_status}\n";
echo "  Coordinator ID: " . ($defenseRequest->coordinator_user_id ?? 'NULL') . "\n";
echo "  User ID (Student): " . ($defenseRequest->user_id ?? 'NULL') . "\n";
echo "  Adviser User ID: " . ($defenseRequest->adviser_user_id ?? 'NULL') . "\n\n";

// Check if the defense request has an adviser_user_id
if ($defenseRequest->adviser_user_id) {
    $adviser = User::find($defenseRequest->adviser_user_id);
    if ($adviser) {
        echo "Adviser for this Defense Request:\n";
        echo "  ID: {$adviser->id}\n";
        echo "  Name: {$adviser->first_name} {$adviser->last_name}\n";
        echo "  Email: {$adviser->email}\n";
        echo "  Role: {$adviser->role}\n";
        
        // Check coordinator relationship for this adviser
        $coordinators = $adviser->coordinators()->get();
        echo "  Coordinators Count: " . $coordinators->count() . "\n";
        
        if ($coordinators->isEmpty()) {
            echo "  *** NO COORDINATORS LINKED TO THIS ADVISER ***\n";
            echo "  This is likely why endorsement is failing!\n";
            
            // Try to find a coordinator in the same program
            echo "\n  Looking for coordinators in program: {$defenseRequest->program}\n";
            $possibleCoordinators = User::where('role', 'Coordinator')
                ->where('program', $defenseRequest->program)
                ->get();
                
            echo "  Found " . $possibleCoordinators->count() . " coordinator(s) in this program:\n";
            foreach ($possibleCoordinators as $coord) {
                echo "    - {$coord->first_name} {$coord->last_name} (ID: {$coord->id})\n";
            }
            
            echo "\n  SOLUTION: Link this adviser to a coordinator using the pivot table.\n";
            echo "  Run this SQL:\n";
            echo "  INSERT INTO adviser_coordinator (adviser_id, coordinator_id) VALUES ({$adviser->id}, <coordinator_id>);\n";
        } else {
            echo "  Coordinators:\n";
            foreach ($coordinators as $coord) {
                echo "    - {$coord->first_name} {$coord->last_name} (ID: {$coord->id}, Email: {$coord->email})\n";
            }
        }
    } else {
        echo "Adviser ID {$defenseRequest->adviser_user_id} not found in users table!\n";
    }
} else {
    echo "No adviser_user_id set on this defense request!\n";
}

// Check if there's a student user
if ($defenseRequest->user_id) {
    $student = User::find($defenseRequest->user_id);
    if ($student) {
        echo "Student User:\n";
        echo "  ID: {$student->id}\n";
        echo "  Name: {$student->first_name} {$student->last_name}\n";
        echo "  Role: {$student->role}\n";
        
        // Check if student has advisers
        $advisers = $student->advisers()->get();
        echo "  Advisers Count: " . $advisers->count() . "\n";
        
        foreach ($advisers as $adviser) {
            echo "\n  Adviser #{$adviser->id}:\n";
            echo "    Name: {$adviser->first_name} {$adviser->last_name}\n";
            echo "    Email: {$adviser->email}\n";
            echo "    Role: {$adviser->role}\n";
            
            // Check coordinator relationship for this adviser
            $coordinators = $adviser->coordinators()->get();
            echo "    Coordinators Count: " . $coordinators->count() . "\n";
            
            if ($coordinators->isEmpty()) {
                echo "    *** NO COORDINATORS LINKED TO THIS ADVISER ***\n";
                echo "    This is likely why endorsement is failing!\n";
                
                // Try to find a coordinator in the same program
                echo "\n    Looking for coordinators in program: {$defenseRequest->program}\n";
                $possibleCoordinators = User::where('role', 'Coordinator')
                    ->where('program', $defenseRequest->program)
                    ->get();
                    
                echo "    Found " . $possibleCoordinators->count() . " coordinator(s) in this program:\n";
                foreach ($possibleCoordinators as $coord) {
                    echo "      - {$coord->first_name} {$coord->last_name} (ID: {$coord->id})\n";
                }
            } else {
                echo "    Coordinators:\n";
                foreach ($coordinators as $coord) {
                    echo "      - {$coord->first_name} {$coord->last_name} (ID: {$coord->id}, Email: {$coord->email})\n";
                }
            }
        }
    }
}

echo "\n=== End Debug ===\n";
