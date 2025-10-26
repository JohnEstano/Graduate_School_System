<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Cleanup and Final Verification ===\n\n";

// 1. Remove duplicate records created by test
echo "1. Removing duplicate records (Students ID > 2)...\n";
$students = \App\Models\StudentRecord::where('id', '>', 2)->get();
foreach ($students as $student) {
    echo "  Deleting student #{$student->id}: {$student->first_name} {$student->last_name}\n";
    $student->delete();
}

$panelists = \App\Models\PanelistRecord::where('id', '>', 7)->get();
foreach ($panelists as $panelist) {
    echo "  Deleting panelist #{$panelist->id}: {$panelist->pfirst_name} {$panelist->plast_name}\n";
    $panelist->delete();
}

$payments = \App\Models\PaymentRecord::where('id', '>', 8)->get();
foreach ($payments as $payment) {
    echo "  Deleting payment #{$payment->id}\n";
    $payment->delete();
}

echo "\n2. Final counts:\n";
echo "  Programs: " . \App\Models\ProgramRecord::count() . "\n";
echo "  Students: " . \App\Models\StudentRecord::count() . "\n";
echo "  Panelists: " . \App\Models\PanelistRecord::count() . "\n";
echo "  Payments: " . \App\Models\PaymentRecord::count() . "\n";

echo "\n3. Checking honorarium payments:\n";
$honorariums = \App\Models\HonorariumPayment::with('panelist')->get();
echo "  Total honorarium payments: {$honorariums->count()}\n";
$withoutPanelist = $honorariums->filter(fn($h) => !$h->panelist);
echo "  Without panelist: {$withoutPanelist->count()}\n";

if ($withoutPanelist->count() > 0) {
    echo "\n  Missing panelist linkages:\n";
    foreach ($withoutPanelist as $h) {
        echo "    - Honorarium #{$h->id}: Defense #{$h->defense_request_id}, Panelist ID: {$h->panelist_id}\n";
    }
}

echo "\n4. Verifying data structure:\n";
$programs = \App\Models\ProgramRecord::with(['studentRecords', 'panelists'])->get();
foreach ($programs as $program) {
    echo "\n  Program: {$program->name}\n";
    echo "    Students: {$program->studentRecords->count()}\n";
    echo "    Panelists: {$program->panelists->count()}\n";
    
    foreach ($program->studentRecords as $student) {
        echo "      - Student: {$student->first_name} {$student->last_name}\n";
        echo "        Payments: {$student->payments()->count()}\n";
        echo "        Panelists: {$student->panelists()->count()}\n";
    }
}

echo "\n✅ Cleanup complete!\n";
