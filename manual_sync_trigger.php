<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;
use App\Services\StudentRecordSyncService;

echo "\n";
echo "╔═══════════════════════════════════════════════════════════════════╗" . PHP_EOL;
echo "║          MANUAL SYNC TRIGGER FOR EXISTING DEFENSE                 ║" . PHP_EOL;
echo "╚═══════════════════════════════════════════════════════════════════╝" . PHP_EOL;
echo "\n";

// Get a completed defense request
$defenseRequest = DefenseRequest::where('workflow_state', 'completed')->first();

if (!$defenseRequest) {
    echo "❌ No completed defense requests found!" . PHP_EOL;
    exit;
}

echo "📋 Found Defense Request ID: {$defenseRequest->id}" . PHP_EOL;
echo "   Student: {$defenseRequest->first_name} {$defenseRequest->last_name}" . PHP_EOL;
echo "   Program: {$defenseRequest->program}" . PHP_EOL;
echo "   Defense Type: {$defenseRequest->defense_type}" . PHP_EOL;
echo "\n";

echo "⚙️  Triggering manual sync..." . PHP_EOL;
echo "\n";

try {
    $syncService = app(StudentRecordSyncService::class);
    $syncService->syncDefenseToStudentRecord($defenseRequest);
    
    echo "✅ SYNC COMPLETED SUCCESSFULLY!" . PHP_EOL;
    echo "\n";
    
    // Verify results
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" . PHP_EOL;
    echo "VERIFICATION:" . PHP_EOL;
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" . PHP_EOL;
    
    // Check student record
    $studentRecord = \App\Models\StudentRecord::where('student_id', $defenseRequest->school_id)->first();
    if ($studentRecord) {
        echo "✅ Student Record (ID: {$studentRecord->id})" . PHP_EOL;
        echo "   Program Record ID: " . ($studentRecord->program_record_id ?? 'NULL') . PHP_EOL;
        
        $paymentRecords = \App\Models\PaymentRecord::where('student_record_id', $studentRecord->id)->get();
        echo "   Payment Records: {$paymentRecords->count()}" . PHP_EOL;
        
        foreach ($paymentRecords as $pr) {
            echo "     • Payment #{$pr->id}: ₱" . number_format((float)$pr->amount, 2) . PHP_EOL;
        }
        
        // Check pivot table
        $pivotCount = DB::table('panelist_student_records')
            ->where('student_id', $studentRecord->id)
            ->count();
        echo "   Pivot Links: {$pivotCount}" . PHP_EOL;
    } else {
        echo "❌ Student Record NOT created!" . PHP_EOL;
    }
    
    // Check program record
    $programRecord = \App\Models\ProgramRecord::where('name', $defenseRequest->program)->first();
    if ($programRecord) {
        echo "✅ Program Record (ID: {$programRecord->id})" . PHP_EOL;
        
        $panelists = \App\Models\PanelistRecord::where('program_record_id', $programRecord->id)->get();
        echo "   Panelists: {$panelists->count()}" . PHP_EOL;
        
        foreach ($panelists as $p) {
            echo "     • {$p->pfirst_name} {$p->pmiddle_name} {$p->plast_name} ({$p->role})" . PHP_EOL;
        }
    } else {
        echo "❌ Program Record NOT created!" . PHP_EOL;
    }
    
    echo "\n";
    echo "🎉 Sync verification complete! Check /honorarium and /student-records pages." . PHP_EOL;
    
} catch (\Exception $e) {
    echo "❌ SYNC FAILED!" . PHP_EOL;
    echo "Error: {$e->getMessage()}" . PHP_EOL;
    echo "\n";
    echo "Stack trace:" . PHP_EOL;
    echo $e->getTraceAsString() . PHP_EOL;
}

echo "\n";
