<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProgramRecord;

echo "=== TESTING PANELIST DATA FETCHING ===\n\n";

// Get first program record
$program = ProgramRecord::with([
    'panelists.students.payments',
    'panelists.payments'
])->first();

if ($program) {
    echo "Program: {$program->name} ({$program->program})\n";
    echo "Program ID: {$program->id}\n\n";
    
    echo "Number of Panelists: " . $program->panelists->count() . "\n\n";
    
    if ($program->panelists->count() > 0) {
        foreach ($program->panelists as $panelist) {
            echo "Panelist ID: {$panelist->id}\n";
            echo "Name: {$panelist->pfirst_name} {$panelist->pmiddle_name} {$panelist->plast_name}\n";
            echo "Role: {$panelist->role}\n";
            echo "Students: {$panelist->students->count()}\n";
            
            foreach ($panelist->students as $student) {
                echo "  - Student: {$student->first_name} {$student->last_name}\n";
                echo "    Payments: {$student->payments->count()}\n";
                
                foreach ($student->payments as $payment) {
                    echo "      * Amount: ₱{$payment->amount} on {$payment->payment_date}\n";
                }
            }
            echo "\n";
        }
    } else {
        echo "No panelists found for this program.\n";
        echo "\nChecking if any panelist_records exist in database...\n";
        $totalPanelists = \App\Models\PanelistRecord::count();
        echo "Total panelist_records in database: {$totalPanelists}\n";
        
        if ($totalPanelists > 0) {
            echo "\nSample panelist records:\n";
            $samples = \App\Models\PanelistRecord::with('program')->limit(5)->get();
            foreach ($samples as $p) {
                echo "  - ID: {$p->id}, Name: {$p->pfirst_name} {$p->plast_name}, Program: " . 
                     ($p->program ? $p->program->name : 'N/A') . "\n";
            }
        }
    }
} else {
    echo "No program records found!\n";
}

echo "\n=== END ===\n";
