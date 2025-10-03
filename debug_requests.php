<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;
use App\Models\User;

echo "=== DEFENSE REQUEST ANALYSIS ===\n\n";

// 1. Check all defense requests
echo "1. ALL DEFENSE REQUESTS:\n";
$requests = DefenseRequest::all();
if ($requests->count() == 0) {
    echo "   No defense requests found in database.\n";
} else {
    foreach ($requests as $r) {
        echo "   ID: {$r->id} | Student: {$r->first_name} {$r->last_name} | Adviser: {$r->defense_adviser} | Adviser_ID: " . ($r->adviser_user_id ?: 'NULL') . " | State: {$r->workflow_state}\n";
    }
}

echo "\n2. FACULTY USERS:\n";
$faculty = User::where('role', 'Faculty')->get();
foreach ($faculty as $f) {
    echo "   ID: {$f->id} | Name: {$f->first_name} {$f->last_name} | Role: {$f->role}\n";
}

echo "\n3. CURRENT USER (if logged in):\n";
if (\Illuminate\Support\Facades\Auth::check()) {
    $user = \Illuminate\Support\Facades\Auth::user();
    echo "   ID: {$user->id} | Name: {$user->first_name} {$user->last_name} | Role: {$user->role}\n";
} else {
    echo "   No user currently logged in.\n";
}

// 4. Check what an adviser would see
echo "\n4. WHAT ADVISER 'Muslimin Ontong' (ID: 17) WOULD SEE:\n";
$muslimin = User::find(17);
if ($muslimin) {
    $assignedRequests = DefenseRequest::with(['adviserUser','assignedTo'])
        ->where(function($q) use ($muslimin){
            $q->where('adviser_user_id', $muslimin->id)
              ->orWhere('assigned_to_user_id', $muslimin->id);
        })
        ->orderByDesc('created_at')
        ->get();
    
    if ($assignedRequests->count() == 0) {
        echo "   No defense requests assigned to this adviser.\n";
    } else {
        foreach ($assignedRequests as $r) {
            echo "   ID: {$r->id} | Student: {$r->first_name} {$r->last_name} | State: {$r->workflow_state}\n";
        }
    }
} else {
    echo "   Adviser not found.\n";
}

echo "\n=== END ANALYSIS ===\n";
