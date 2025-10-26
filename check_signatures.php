<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking User Signatures ===\n\n";

$signatures = App\Models\UserSignature::with('user')->get();

if ($signatures->isEmpty()) {
    echo "No signatures found in database.\n";
} else {
    foreach ($signatures as $sig) {
        $user = $sig->user;
        echo "User ID: {$sig->user_id}\n";
        echo "Name: " . ($user ? "{$user->first_name} {$user->last_name}" : "N/A") . "\n";
        echo "Role: " . ($user ? $user->role : "N/A") . "\n";
        echo "Active: " . ($sig->active ? "Yes" : "No") . "\n";
        echo "Image Path: {$sig->image_path}\n";
        
        $fullPath = storage_path('app/public/' . $sig->image_path);
        echo "Full Path: {$fullPath}\n";
        echo "File Exists: " . (file_exists($fullPath) ? "Yes" : "No") . "\n";
        echo "---\n";
    }
}

echo "\n=== Checking Defense Requests with Advisers ===\n\n";

$requests = App\Models\DefenseRequest::whereNotNull('adviser_user_id')
    ->orderBy('id', 'desc')
    ->limit(5)
    ->get();

foreach ($requests as $req) {
    echo "Request ID: {$req->id}\n";
    echo "Student: {$req->first_name} {$req->last_name}\n";
    echo "Adviser User ID: {$req->adviser_user_id}\n";
    echo "Coordinator User ID: " . ($req->coordinator_user_id ?? 'NULL') . "\n";
    
    $adviserSig = App\Models\UserSignature::where('user_id', $req->adviser_user_id)
        ->where('active', true)
        ->first();
    echo "Adviser has signature: " . ($adviserSig ? "Yes" : "No") . "\n";
    
    if ($adviserSig) {
        echo "Adviser signature path: {$adviserSig->image_path}\n";
    }
    
    echo "---\n";
}
