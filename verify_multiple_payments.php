<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProgramRecord;
use App\Models\PanelistRecord;

echo "=== VERIFYING MULTIPLE PAYMENTS PER PANELIST ===\n\n";

// Get first program
$program = ProgramRecord::first();
echo "Program: {$program->name}\n\n";

// Get panelists with their students and payments
$panelists = PanelistRecord::where('program_record_id', $program->id)
    ->with(['students.payments'])
    ->get();

foreach ($panelists as $panelist) {
    $totalStudents = $panelist->students->count();
    $totalPayments = $panelist->students->sum(function($student) use ($panelist) {
        return $student->payments->where('panelist_record_id', $panelist->id)->count();
    });
    
    echo "Panelist: {$panelist->pfirst_name} {$panelist->plast_name}\n";
    echo "Role: {$panelist->role}\n";
    echo "Students: {$totalStudents}\n";
    echo "Total Payments: {$totalPayments}\n";
    
    // Show breakdown
    foreach ($panelist->students as $student) {
        $payments = $student->payments->where('panelist_record_id', $panelist->id);
        if ($payments->count() > 0) {
            echo "  → Student: {$student->first_name} {$student->last_name}\n";
            echo "    Defense: {$student->defense_type} | Amount: ₱" . 
                 number_format($payments->first()->amount, 2) . "\n";
        }
    }
    echo "\n";
}

echo "\n=== STATISTICS ===\n";
echo "Total Panelists in Program: " . $panelists->count() . "\n";

$avgPaymentsPerPanelist = $panelists->avg(function($p) {
    return $p->students->sum(function($s) use ($p) {
        return $s->payments->where('panelist_record_id', $p->id)->count();
    });
});

echo "Average Payments per Panelist: " . round($avgPaymentsPerPanelist, 1) . "\n";

// Find panelist with most payments
$maxPanelist = null;
$maxPayments = 0;

foreach ($panelists as $p) {
    $count = $p->students->sum(function($s) use ($p) {
        return $s->payments->where('panelist_record_id', $p->id)->count();
    });
    if ($count > $maxPayments) {
        $maxPayments = $count;
        $maxPanelist = $p;
    }
}

if ($maxPanelist) {
    echo "\nPanelist with Most Payments:\n";
    echo "Name: {$maxPanelist->pfirst_name} {$maxPanelist->plast_name}\n";
    echo "Role: {$maxPanelist->role}\n";
    echo "Number of Payments: {$maxPayments}\n";
}

echo "\n=== END ===\n";
