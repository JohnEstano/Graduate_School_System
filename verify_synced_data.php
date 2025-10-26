<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Verification of Synced Data ===\n\n";

// Check Program Records
echo "PROGRAM RECORDS:\n";
$programs = \App\Models\ProgramRecord::all();
foreach ($programs as $program) {
    echo "  ID: {$program->id} - {$program->name}\n";
    echo "    Panelists: " . $program->panelists()->count() . "\n";
    echo "    Students: " . $program->studentRecords()->count() . "\n";
}

echo "\n\nSTUDENT RECORDS:\n";
$students = \App\Models\StudentRecord::all();
foreach ($students as $student) {
    echo "  ID: {$student->id} - {$student->first_name} {$student->last_name}\n";
    echo "    Program Record ID: {$student->program_record_id}\n";
    echo "    Student ID: {$student->student_id}\n";
    echo "    Payments: " . $student->payments()->count() . "\n";
    echo "    Panelists: " . $student->panelists()->count() . "\n";
}

echo "\n\nPANELIST RECORDS:\n";
$panelists = \App\Models\PanelistRecord::all();
foreach ($panelists as $panelist) {
    echo "  ID: {$panelist->id} - {$panelist->pfirst_name} {$panelist->plast_name}\n";
    echo "    Program Record ID: {$panelist->program_record_id}\n";
    echo "    Role: {$panelist->role}\n";
    echo "    Students: " . $panelist->students()->count() . "\n";
    echo "    Payments: " . $panelist->payments()->count() . "\n";
}

echo "\n\nPAYMENT RECORDS:\n";
$payments = \App\Models\PaymentRecord::all();
foreach ($payments as $payment) {
    echo "  ID: {$payment->id} - Amount: {$payment->amount}\n";
    echo "    Student: " . $payment->studentRecord->first_name . " " . $payment->studentRecord->last_name . "\n";
    echo "    Panelist: " . $payment->panelistRecord->pfirst_name . " " . $payment->panelistRecord->plast_name . "\n";
    echo "    Defense Request ID: {$payment->defense_request_id}\n";
}

echo "\n\nPIVOT TABLE:\n";
$pivots = \Illuminate\Support\Facades\DB::table('panelist_student_records')->get();
foreach ($pivots as $pivot) {
    $student = \App\Models\StudentRecord::find($pivot->student_id);
    $panelist = \App\Models\PanelistRecord::find($pivot->panelist_id);
    echo "  Panelist #{$pivot->panelist_id} ({$panelist->pfirst_name}) <-> Student #{$pivot->student_id} ({$student->first_name}) - Role: {$pivot->role}\n";
}
