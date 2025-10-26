<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Controller Data Loading ===\n\n";

// Test 1: Honorarium Index
echo "1. HONORARIUM INDEX (Programs List)\n";
$programs = \App\Models\ProgramRecord::orderBy('date_edited', 'desc')->get();
echo "Found {$programs->count()} programs:\n";
foreach ($programs as $program) {
    echo "  - ID: {$program->id}, Name: {$program->name}\n";
    echo "    Panelists: " . $program->panelists()->count() . "\n";
    echo "    Students: " . $program->studentRecords()->count() . "\n";
}

echo "\n2. HONORARIUM SHOW (Program #1 Details)\n";
$program = \App\Models\ProgramRecord::with([
    'panelists.students.payments',
    'panelists.payments'
])->find(1);

if ($program) {
    echo "Program: {$program->name}\n";
    echo "Panelists: {$program->panelists->count()}\n";
    
    foreach ($program->panelists as $panelist) {
        echo "\n  Panelist: {$panelist->pfirst_name} {$panelist->plast_name}\n";
        echo "    Role: {$panelist->role}\n";
        echo "    Students assigned: {$panelist->students->count()}\n";
        
        foreach ($panelist->students as $student) {
            $pivotRole = $student->pivot->role ?? 'No role';
            echo "      - Student: {$student->first_name} {$student->last_name} (Role: {$pivotRole})\n";
            
            $payments = $student->payments->where('panelist_record_id', $panelist->id);
            echo "        Payments for this panelist: {$payments->count()}\n";
            foreach ($payments as $payment) {
                echo "          Payment #{$payment->id}: ₱{$payment->amount}\n";
            }
        }
    }
}

echo "\n\n3. STUDENT RECORDS INDEX\n";
$programs = \App\Models\ProgramRecord::orderBy('date_edited', 'desc')->get();
echo "Found {$programs->count()} programs with students:\n";
foreach ($programs as $program) {
    $studentCount = \App\Models\StudentRecord::where('program_record_id', $program->id)->count();
    echo "  - {$program->name}: {$studentCount} students\n";
}

echo "\n4. STUDENT RECORDS SHOW (Program #2 Students)\n";
$students = \App\Models\StudentRecord::where('program_record_id', 2)
    ->with(['payments.panelist', 'panelists'])
    ->get();

echo "Found {$students->count()} students:\n";
foreach ($students as $student) {
    echo "\n  Student: {$student->first_name} {$student->last_name}\n";
    echo "    Student ID: {$student->student_id}\n";
    echo "    Program Record ID: {$student->program_record_id}\n";
    echo "    Payments: {$student->payments->count()}\n";
    echo "    Panelists: {$student->panelists->count()}\n";
    
    foreach ($student->panelists as $panelist) {
        $role = $panelist->pivot->role ?? 'No role';
        echo "      - {$panelist->pfirst_name} {$panelist->plast_name} ({$role})\n";
    }
    
    if ($student->payments->count() > 0) {
        echo "    Payment breakdown:\n";
        foreach ($student->payments as $payment) {
            $panelistName = $payment->panelist ? "{$payment->panelist->pfirst_name} {$payment->panelist->plast_name}" : 'Unknown';
            echo "      - ₱{$payment->amount} to {$panelistName}\n";
        }
    }
}

echo "\n\n✅ All data loading tests completed!\n";
