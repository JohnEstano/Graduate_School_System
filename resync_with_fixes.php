<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Clearing and Resyncing Data ===\n\n";

// Clear existing synced data (order matters due to foreign keys)
echo "Clearing existing data...\n";
\Illuminate\Support\Facades\DB::table('panelist_student_records')->delete();
\App\Models\PaymentRecord::query()->delete();
\App\Models\StudentRecord::query()->delete();
\App\Models\PanelistRecord::query()->delete();

echo "✅ Cleared pivot, payment, student, and panelist records\n\n";

// Resync with new logic
$syncService = new \App\Services\StudentRecordSyncService();

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
    }
    
    echo "\n";
}

echo "\n=== Final Count ===\n";
echo "Program Records: " . \App\Models\ProgramRecord::count() . "\n";
echo "Student Records: " . \App\Models\StudentRecord::count() . "\n";
echo "Panelist Records: " . \App\Models\PanelistRecord::count() . "\n";
echo "Payment Records: " . \App\Models\PaymentRecord::count() . "\n";
echo "Pivot Records: " . \Illuminate\Support\Facades\DB::table('panelist_student_records')->count() . "\n";

echo "\n=== Verification ===\n";
$students = \App\Models\StudentRecord::all();
foreach ($students as $student) {
    echo "Student: {$student->first_name} {$student->last_name}\n";
    echo "  Program Record ID: {$student->program_record_id}\n";
    echo "  Payments: " . $student->payments()->count() . "\n";
    echo "  Panelists: " . $student->panelists()->count() . "\n";
    
    $panelists = $student->panelists;
    foreach ($panelists as $panelist) {
        $role = $panelist->pivot->role ?? 'NO ROLE';
        echo "    - {$panelist->pfirst_name} ({$role})\n";
    }
    echo "\n";
}
