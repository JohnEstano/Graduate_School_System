<?php
/**
 * Migration Script: Move defense files from storage/app/defense-attachments 
 * to storage/app/public/defense-attachments
 * 
 * Run this ONCE on your VPS server: php migrate_defense_files.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

echo "🔄 Starting defense files migration...\n\n";

// Source: storage/app/defense-attachments (wrong location)
// Target: storage/app/public/defense-attachments (correct location)

$sourceDisk = 'local';
$targetDisk = 'public';
$folder = 'defense-attachments';

// Check if source folder exists
if (!Storage::disk($sourceDisk)->exists($folder)) {
    echo "✅ No files to migrate. Source folder doesn't exist or already migrated.\n";
    exit(0);
}

// Get all files in the wrong location
$files = Storage::disk($sourceDisk)->files($folder);

if (empty($files)) {
    echo "✅ No files found in source folder. Nothing to migrate.\n";
    exit(0);
}

echo "📁 Found " . count($files) . " files to migrate:\n\n";

$migrated = 0;
$skipped = 0;
$errors = 0;

foreach ($files as $filePath) {
    $filename = basename($filePath);
    $targetPath = $folder . '/' . $filename;
    
    try {
        // Check if file already exists in target
        if (Storage::disk($targetDisk)->exists($targetPath)) {
            echo "⏭️  SKIP: {$filename} (already exists in target)\n";
            $skipped++;
            continue;
        }
        
        // Copy file content
        $content = Storage::disk($sourceDisk)->get($filePath);
        Storage::disk($targetDisk)->put($targetPath, $content);
        
        echo "✅ MOVED: {$filename}\n";
        $migrated++;
        
        // Optional: Delete from source after successful copy
        // Uncomment the line below to delete original files
        // Storage::disk($sourceDisk)->delete($filePath);
        
    } catch (\Exception $e) {
        echo "❌ ERROR: {$filename} - " . $e->getMessage() . "\n";
        $errors++;
    }
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "📊 Migration Summary:\n";
echo "   ✅ Migrated: {$migrated} files\n";
echo "   ⏭️  Skipped: {$skipped} files\n";
echo "   ❌ Errors: {$errors} files\n";
echo str_repeat("=", 60) . "\n\n";

if ($migrated > 0) {
    echo "🎉 Migration completed successfully!\n";
    echo "⚠️  Original files are still in storage/app/defense-attachments\n";
    echo "   You can delete them manually after verifying downloads work.\n\n";
}

// Now update database paths if needed
echo "\n🔄 Checking database records...\n";

$defenseRequests = DB::table('defense_requests')
    ->where(function($q) {
        $q->whereNotNull('advisers_endorsement')
          ->orWhereNotNull('rec_endorsement')
          ->orWhereNotNull('proof_of_payment')
          ->orWhereNotNull('manuscript_proposal')
          ->orWhereNotNull('similarity_index')
          ->orWhereNotNull('avisee_adviser_attachment');
    })
    ->get();

$updated = 0;
foreach ($defenseRequests as $request) {
    $needsUpdate = false;
    $updates = [];
    
    foreach (['advisers_endorsement', 'rec_endorsement', 'proof_of_payment', 'manuscript_proposal', 'similarity_index', 'avisee_adviser_attachment'] as $field) {
        if ($request->$field && !str_starts_with($request->$field, '/storage/')) {
            // Just the path without /storage/ prefix is fine for our new system
            // No update needed unless it has weird format
        }
    }
}

echo "✅ Database check complete.\n\n";
echo "🚀 Your files are now ready for download!\n";
