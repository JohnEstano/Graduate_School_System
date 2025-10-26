<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Manual Sync Test ===\n\n";

$syncService = new \App\Services\StudentRecordSyncService();

// Get completed defense requests
$completedDefenses = \App\Models\DefenseRequest::where('workflow_state', 'completed')->get();

echo "Found {$completedDefenses->count()} completed defense requests\n\n";

foreach ($completedDefenses as $defense) {
    echo "Syncing Defense Request #{$defense->id}...\n";
    echo "  Student: {$defense->first_name} {$defense->last_name}\n";
    echo "  Program: {$defense->program}\n";
    
    try {
        $syncService->syncDefenseToStudentRecord($defense);
        echo "  ✅ Sync successful!\n";
    } catch (\Exception $e) {
        echo "  ❌ Sync failed: {$e->getMessage()}\n";
        echo "  Stack trace: {$e->getTraceAsString()}\n";
    }
    
    echo "\n";
}

echo "\n=== After Sync Check ===\n";
echo "Program Records: " . \App\Models\ProgramRecord::count() . "\n";
echo "Student Records: " . \App\Models\StudentRecord::count() . "\n";
echo "Panelist Records: " . \App\Models\PanelistRecord::count() . "\n";
echo "Payment Records: " . \App\Models\PaymentRecord::count() . "\n";
echo "Pivot Records: " . \Illuminate\Support\Facades\DB::table('panelist_student_records')->count() . "\n";
