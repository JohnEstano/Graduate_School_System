<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ProgramRecord;
use Illuminate\Support\Facades\DB;

echo "\n";
echo "UPDATING PROGRAM CATEGORIES\n";
echo str_repeat("=", 100) . "\n\n";

// Load the original program data
$programData = include __DIR__ . '/database/static/program_data.php';

echo "Loaded " . count($programData) . " programs from program_data.php\n\n";

DB::beginTransaction();

try {
    $updated = 0;
    $notFound = [];
    
    foreach ($programData as $data) {
        $program = ProgramRecord::where('program', $data['program'])->first();
        
        if ($program) {
            $program->category = $data['category'];
            $program->save();
            $updated++;
            echo "✓ Updated: {$data['program']} → {$data['category']}\n";
        } else {
            $notFound[] = $data['program'];
            echo "✗ Not found: {$data['program']}\n";
        }
    }
    
    DB::commit();
    
    echo "\n" . str_repeat("=", 100) . "\n";
    echo "✅ Successfully updated {$updated} programs\n";
    
    if (count($notFound) > 0) {
        echo "⚠️  Could not find " . count($notFound) . " programs: " . implode(', ', $notFound) . "\n";
    }
    
    echo "\nCategory Distribution:\n";
    echo str_repeat("-", 100) . "\n";
    $categories = ProgramRecord::selectRaw('category, COUNT(*) as count')
        ->groupBy('category')
        ->get();
    
    foreach ($categories as $cat) {
        echo sprintf("%-20s: %d programs\n", $cat->category ?: '(null)', $cat->count);
    }
    
} catch (\Exception $e) {
    DB::rollBack();
    echo "\n❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";
