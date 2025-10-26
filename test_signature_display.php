<?php
require __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\UserSignature;
use Illuminate\Support\Facades\Storage;

echo "=== Testing Signature Display ===\n\n";

// Get all active signatures
$signatures = UserSignature::where('active', true)->get();

echo "Found " . $signatures->count() . " active signature(s)\n\n";

foreach ($signatures as $sig) {
    echo "Signature ID: {$sig->id}\n";
    echo "User ID: {$sig->user_id}\n";
    echo "Image Path (DB): {$sig->image_path}\n";
    
    $fullPath = Storage::disk('public')->path($sig->image_path);
    echo "Full Path: {$fullPath}\n";
    echo "File Exists: " . (file_exists($fullPath) ? 'YES' : 'NO') . "\n";
    
    if (file_exists($fullPath)) {
        echo "File Size: " . filesize($fullPath) . " bytes\n";
        $imageInfo = getimagesize($fullPath);
        if ($imageInfo) {
            echo "Image Dimensions: {$imageInfo[0]} x {$imageInfo[1]}\n";
            echo "Image Type: " . image_type_to_mime_type($imageInfo[2]) . "\n";
        }
    }
    
    echo "Natural Width: {$sig->natural_width}\n";
    echo "Natural Height: {$sig->natural_height}\n";
    echo "\n---\n\n";
}

// Test Defense Requests
echo "=== Testing Defense Request Signature Mapping ===\n\n";

$request = \App\Models\DefenseRequest::with(['adviserUser', 'coordinator'])->first();

if ($request) {
    echo "Defense Request ID: {$request->id}\n";
    echo "Adviser User ID: " . ($request->adviser_user_id ?? 'NULL') . "\n";
    echo "Coordinator User ID: " . ($request->coordinator_user_id ?? 'NULL') . "\n";
    
    if ($request->adviserUser) {
        echo "Adviser Name: {$request->adviserUser->first_name} {$request->adviserUser->last_name}\n";
        $adviserSig = UserSignature::where('user_id', $request->adviser_user_id)->where('active', true)->first();
        echo "Adviser Signature: " . ($adviserSig ? "Found (ID: {$adviserSig->id})" : "NOT FOUND") . "\n";
    }
    
    if ($request->coordinator) {
        echo "Coordinator Name: {$request->coordinator->first_name} {$request->coordinator->last_name}\n";
        $coordSig = UserSignature::where('user_id', $request->coordinator_user_id)->where('active', true)->first();
        echo "Coordinator Signature: " . ($coordSig ? "Found (ID: {$coordSig->id})" : "NOT FOUND") . "\n";
    }
} else {
    echo "No defense requests found\n";
}

echo "\n=== Test Complete ===\n";
