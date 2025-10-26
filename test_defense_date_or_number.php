<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║     DEFENSE DATE & OR NUMBER VERIFICATION                   ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

$allPassed = true;

// TEST 1: Student Records have defense_date and or_number
echo "TEST 1: Student Records Field Population\n";
echo str_repeat("─", 60) . "\n";

$students = \App\Models\StudentRecord::all();
$studentsWithDefenseDate = $students->filter(fn($s) => !empty($s->defense_date))->count();
$studentsWithOrNumber = $students->filter(fn($s) => !empty($s->or_number))->count();

echo "Students with defense_date: {$studentsWithDefenseDate}/{$students->count()} ";
echo ($studentsWithDefenseDate == $students->count() ? "✅" : "❌") . "\n";

echo "Students with or_number: {$studentsWithOrNumber}/{$students->count()} ";
echo ($studentsWithOrNumber == $students->count() ? "✅" : "❌") . "\n";

$test1 = ($studentsWithDefenseDate == $students->count() && $studentsWithOrNumber == $students->count());
echo "Result: " . ($test1 ? "✅ PASS" : "❌ FAIL") . "\n\n";
$allPassed = $allPassed && $test1;

// TEST 2: Honorarium Controller Response
echo "TEST 2: Honorarium Controller Data\n";
echo str_repeat("─", 60) . "\n";

$program = \App\Models\ProgramRecord::with([
    'panelists.students.payments',
    'panelists.payments'
])->first();

$hasDefenseDate = false;
$hasOrNumber = false;

foreach ($program->panelists as $panelist) {
    foreach ($panelist->students as $student) {
        if (!empty($student->defense_date)) {
            $hasDefenseDate = true;
        }
        if (!empty($student->or_number)) {
            $hasOrNumber = true;
        }
        
        foreach ($student->payments as $payment) {
            echo "Sample Payment Data:\n";
            echo "  Student: {$student->first_name} {$student->last_name}\n";
            echo "  Defense Date: " . ($student->defense_date ? date('Y-m-d', strtotime($student->defense_date)) : 'MISSING') . "\n";
            echo "  OR Number: " . ($student->or_number ?? 'MISSING') . "\n";
            echo "  Defense Type: {$student->defense_type}\n";
            break 3; // Exit all loops after first sample
        }
    }
}

echo "\nHas defense_date: " . ($hasDefenseDate ? "✅" : "❌") . "\n";
echo "Has or_number: " . ($hasOrNumber ? "✅" : "❌") . "\n";

$test2 = ($hasDefenseDate && $hasOrNumber);
echo "Result: " . ($test2 ? "✅ PASS" : "❌ FAIL") . "\n\n";
$allPassed = $allPassed && $test2;

// TEST 3: React Component Data Structure
echo "TEST 3: React Component Expected Data Structure\n";
echo str_repeat("─", 60) . "\n";

// Simulate what React component receives
$panelist = $program->panelists->first();
if ($panelist && $panelist->students->count() > 0) {
    $student = $panelist->students->first();
    $payment = $student->payments->where('panelist_record_id', $panelist->id)->first();
    
    echo "React Component Props Simulation:\n";
    echo json_encode([
        'student' => [
            'id' => $student->id,
            'first_name' => $student->first_name,
            'last_name' => $student->last_name,
            'defense_date' => $student->defense_date ? date('Y-m-d', strtotime($student->defense_date)) : null,
            'defense_type' => $student->defense_type,
            'or_number' => $student->or_number,
        ],
        'payment' => [
            'id' => $payment->id,
            'defense_date' => $student->defense_date ? date('Y-m-d', strtotime($student->defense_date)) : null,
            'defense_type' => $student->defense_type,
            'or_number' => $student->or_number,
            'amount' => $payment->amount,
        ]
    ], JSON_PRETTY_PRINT);
    
    $test3 = (!empty($student->defense_date) && !empty($student->or_number));
} else {
    echo "No data found\n";
    $test3 = false;
}

echo "\nResult: " . ($test3 ? "✅ PASS" : "❌ FAIL") . "\n\n";
$allPassed = $allPassed && $test3;

// FINAL RESULT
echo "\n";
echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║                    FINAL RESULT                              ║\n";
echo "╠══════════════════════════════════════════════════════════════╣\n";
echo "║                                                              ║\n";

if ($allPassed) {
    echo "║    ✅ ALL TESTS PASSED - DEFENSE DATE & OR NUMBER OK! ✅   ║\n";
} else {
    echo "║         ❌ SOME TESTS FAILED - CHECK ABOVE ❌              ║\n";
}

echo "║                                                              ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n";

// Show all student data
echo "\n📋 COMPLETE STUDENT DATA:\n";
echo str_repeat("═", 60) . "\n\n";

foreach (\App\Models\StudentRecord::all() as $student) {
    echo "👤 {$student->first_name} {$student->last_name}\n";
    echo "   Defense Date: " . ($student->defense_date ? date('Y-m-d H:i:s', strtotime($student->defense_date)) : 'NOT SET') . "\n";
    echo "   Defense Type: " . ($student->defense_type ?? 'NOT SET') . "\n";
    echo "   OR Number: " . ($student->or_number ?? 'NOT SET') . "\n";
    echo "   Defense Request ID: {$student->defense_request_id}\n";
    echo "\n";
}

echo "✅ Verification complete!\n";
