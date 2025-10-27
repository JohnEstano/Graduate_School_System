<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ProgramRecord;

echo "=== Latest Defense Date Display Test ===\n\n";

// Get a sample program with panelists
$program = ProgramRecord::with([
    'panelists.students.payments'
])->first();

if (!$program) {
    echo "No programs found.\n";
    exit;
}

echo "Program: {$program->name}\n\n";

foreach ($program->panelists->take(3) as $panelist) {
    echo "Panelist: {$panelist->pfirst_name} {$panelist->plast_name}\n";
    
    $defenseDates = [];
    foreach ($panelist->students as $student) {
        if ($student->defense_date) {
            $defenseDates[] = $student->defense_date;
            echo "  - Student: {$student->first_name} {$student->last_name} → Defense: {$student->defense_date}\n";
        }
    }
    
    if (!empty($defenseDates)) {
        $latestDate = max($defenseDates);
        echo "\n  ✓ Latest Defense Date to show in table: {$latestDate}\n";
        echo "  ✓ Formatted: " . date('M d, Y', strtotime($latestDate)) . "\n";
    } else {
        echo "\n  ✗ No defense dates found\n";
    }
    
    echo "\n" . str_repeat("-", 60) . "\n\n";
}

// Test date range filtering
echo "\n=== Date Range Filtering Test ===\n\n";

$testPanelist = $program->panelists->first();
if ($testPanelist) {
    echo "Testing panelist: {$testPanelist->pfirst_name} {$testPanelist->plast_name}\n\n";
    
    $allDates = $testPanelist->students->pluck('defense_date')->filter()->sort()->values();
    echo "All defense dates: " . $allDates->implode(', ') . "\n\n";
    
    // Test various date ranges
    $testRanges = [
        ['from' => '2025-05-01', 'to' => '2025-05-31', 'label' => 'May 2025'],
        ['from' => '2025-07-01', 'to' => '2025-07-31', 'label' => 'July 2025'],
        ['from' => '2025-08-01', 'to' => '2025-08-31', 'label' => 'August 2025'],
        ['from' => '2025-05-01', 'to' => '2025-10-31', 'label' => 'May-October 2025'],
    ];
    
    foreach ($testRanges as $range) {
        $from = new DateTime($range['from']);
        $to = new DateTime($range['to']);
        
        $hasMatch = false;
        foreach ($testPanelist->students as $student) {
            if ($student->defense_date) {
                $defenseDate = new DateTime($student->defense_date);
                if ($defenseDate >= $from && $defenseDate <= $to) {
                    $hasMatch = true;
                    break;
                }
            }
        }
        
        $status = $hasMatch ? "✓ SHOW" : "✗ HIDE";
        echo "Range: {$range['label']} ({$range['from']} to {$range['to']}) → {$status}\n";
    }
}
