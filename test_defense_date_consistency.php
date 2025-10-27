<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ProgramRecord;

echo "=== Defense Date Consistency Check ===\n\n";

// Get a sample program with panelists
$program = ProgramRecord::with([
    'panelists.students.payments'
])->first();

if (!$program) {
    echo "No programs found.\n";
    exit;
}

echo "Program: {$program->name}\n\n";

foreach ($program->panelists as $panelist) {
    echo "Panelist: {$panelist->pfirst_name} {$panelist->plast_name}\n";
    
    // Get defense date from first student (as done in controller)
    $panelistDefenseDate = $panelist->students->first()?->defense_date;
    echo "  Panelist defense_date (from first student): " . ($panelistDefenseDate ?? 'NULL') . "\n";
    
    foreach ($panelist->students as $student) {
        echo "\n  Student: {$student->first_name} {$student->last_name}\n";
        echo "    Student defense_date: " . ($student->defense_date ?? 'NULL') . "\n";
        
        foreach ($student->payments->where('panelist_record_id', $panelist->id) as $payment) {
            echo "    Payment #{$payment->id}:\n";
            echo "      Payment date: " . ($payment->payment_date ?? 'NULL') . "\n";
            echo "      Amount: {$payment->amount}\n";
        }
    }
    
    echo "\n  --- Comparison ---\n";
    echo "  Panelist table shows: " . ($panelistDefenseDate ?? 'NULL') . "\n";
    echo "  Modal should show (from student): " . ($panelist->students->first()?->defense_date ?? 'NULL') . "\n";
    echo "  Match: " . (($panelistDefenseDate === $panelist->students->first()?->defense_date) ? 'YES' : 'NO') . "\n";
    echo "\n" . str_repeat("-", 50) . "\n\n";
}
