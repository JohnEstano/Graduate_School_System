<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║     FINAL END-TO-END VERIFICATION TEST                      ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

$allPassed = true;

// TEST 1: Data Integrity
echo "TEST 1: Data Integrity\n";
echo str_repeat("─", 60) . "\n";

$programs = \App\Models\ProgramRecord::count();
$students = \App\Models\StudentRecord::count();
$panelists = \App\Models\PanelistRecord::count();
$payments = \App\Models\PaymentRecord::count();
$pivots = DB::table('panelist_student_records')->count();

echo "Record Counts:\n";
echo "  Programs: {$programs} " . ($programs == 2 ? "✅" : "❌") . "\n";
echo "  Students: {$students} " . ($students == 2 ? "✅" : "❌") . "\n";
echo "  Panelists: {$panelists} " . ($panelists == 7 ? "✅" : "❌") . "\n";
echo "  Payments: {$payments} " . ($payments == 8 ? "✅" : "❌") . "\n";
echo "  Pivot: {$pivots} " . ($pivots == 7 ? "✅" : "❌") . "\n";

$test1 = ($programs == 2 && $students == 2 && $panelists == 7 && $payments == 8 && $pivots == 7);
echo "\nResult: " . ($test1 ? "✅ PASS" : "❌ FAIL") . "\n\n";
$allPassed = $allPassed && $test1;

// TEST 2: Student-Program Linking
echo "TEST 2: Student-Program Linking\n";
echo str_repeat("─", 60) . "\n";

$studentsWithProgram = \App\Models\StudentRecord::whereNotNull('program_record_id')->count();
echo "Students with program_record_id: {$studentsWithProgram}/2 ";
echo ($studentsWithProgram == 2 ? "✅" : "❌") . "\n";

$test2 = ($studentsWithProgram == 2);
echo "Result: " . ($test2 ? "✅ PASS" : "❌ FAIL") . "\n\n";
$allPassed = $allPassed && $test2;

// TEST 3: Pivot Table Roles
echo "TEST 3: Pivot Table Roles\n";
echo str_repeat("─", 60) . "\n";

$pivotsWithRole = DB::table('panelist_student_records')->whereNotNull('role')->where('role', '!=', '')->count();
echo "Pivot records with roles: {$pivotsWithRole}/7 ";
echo ($pivotsWithRole == 7 ? "✅" : "❌") . "\n";

$test3 = ($pivotsWithRole == 7);
echo "Result: " . ($test3 ? "✅ PASS" : "❌ FAIL") . "\n\n";
$allPassed = $allPassed && $test3;

// TEST 4: Honorarium Controller Data
echo "TEST 4: Honorarium Controller Data Simulation\n";
echo str_repeat("─", 60) . "\n";

$program = \App\Models\ProgramRecord::with([
    'panelists.students.payments',
    'panelists.payments'
])->first();

if ($program) {
    $panelistCount = $program->panelists->count();
    echo "Program '{$program->name}' has {$panelistCount} panelists ";
    echo ($panelistCount > 0 ? "✅" : "❌") . "\n";
    
    $hasStudents = false;
    $hasPayments = false;
    $hasRoles = false;
    
    foreach ($program->panelists as $panelist) {
        if ($panelist->students->count() > 0) {
            $hasStudents = true;
            
            foreach ($panelist->students as $student) {
                if (!empty($student->pivot->role)) {
                    $hasRoles = true;
                }
                
                $payments = $student->payments->where('panelist_record_id', $panelist->id);
                if ($payments->count() > 0) {
                    $hasPayments = true;
                }
            }
        }
    }
    
    echo "Panelists have students: " . ($hasStudents ? "✅" : "❌") . "\n";
    echo "Students have payments: " . ($hasPayments ? "✅" : "❌") . "\n";
    echo "Pivot has roles: " . ($hasRoles ? "✅" : "❌") . "\n";
    
    $test4 = ($panelistCount > 0 && $hasStudents && $hasPayments && $hasRoles);
} else {
    echo "❌ No program found\n";
    $test4 = false;
}

echo "Result: " . ($test4 ? "✅ PASS" : "❌ FAIL") . "\n\n";
$allPassed = $allPassed && $test4;

// TEST 5: Student Records Controller Data
echo "TEST 5: Student Records Controller Data Simulation\n";
echo str_repeat("─", 60) . "\n";

$students = \App\Models\StudentRecord::with(['payments.panelist', 'panelists'])->get();
$allStudentsHaveProgram = true;
$allStudentsHavePayments = true;
$allStudentsHavePanelists = true;

foreach ($students as $student) {
    if (!$student->program_record_id) {
        $allStudentsHaveProgram = false;
    }
    if ($student->payments->count() == 0) {
        $allStudentsHavePayments = false;
    }
    if ($student->panelists->count() == 0) {
        $allStudentsHavePanelists = false;
    }
}

echo "All students linked to programs: " . ($allStudentsHaveProgram ? "✅" : "❌") . "\n";
echo "All students have payments: " . ($allStudentsHavePayments ? "✅" : "❌") . "\n";
echo "All students have panelists: " . ($allStudentsHavePanelists ? "✅" : "❌") . "\n";

$test5 = ($allStudentsHaveProgram && $allStudentsHavePayments && $allStudentsHavePanelists);
echo "Result: " . ($test5 ? "✅ PASS" : "❌ FAIL") . "\n\n";
$allPassed = $allPassed && $test5;

// TEST 6: AA Observer Registration
echo "TEST 6: AA Observer Registration\n";
echo str_repeat("─", 60) . "\n";

$observerRegistered = class_exists('\App\Observers\AaPaymentVerificationObserver');
echo "Observer class exists: " . ($observerRegistered ? "✅" : "❌") . "\n";

$test6 = $observerRegistered;
echo "Result: " . ($test6 ? "✅ PASS" : "❌ FAIL") . "\n\n";
$allPassed = $allPassed && $test6;

// FINAL RESULT
echo "\n";
echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║                    FINAL RESULT                              ║\n";
echo "╠══════════════════════════════════════════════════════════════╣\n";
echo "║                                                              ║\n";

if ($allPassed) {
    echo "║         ✅ ALL TESTS PASSED - SYSTEM READY! ✅              ║\n";
} else {
    echo "║         ❌ SOME TESTS FAILED - CHECK ABOVE ❌              ║\n";
}

echo "║                                                              ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n";

// Detailed Output
echo "\n📊 DETAILED DATA SUMMARY:\n";
echo str_repeat("═", 60) . "\n\n";

foreach (\App\Models\ProgramRecord::with(['studentRecords', 'panelists'])->get() as $program) {
    echo "📁 {$program->name}\n";
    echo "   Students: {$program->studentRecords->count()}\n";
    echo "   Panelists: {$program->panelists->count()}\n";
    
    foreach ($program->studentRecords as $student) {
        echo "\n   👨‍🎓 {$student->first_name} {$student->last_name}\n";
        echo "      Payments: {$student->payments->count()}\n";
        echo "      Panelists: {$student->panelists->count()}\n";
        
        foreach ($student->panelists as $panelist) {
            $role = $panelist->pivot->role ?? 'No Role';
            echo "        - {$panelist->pfirst_name} ({$role})\n";
        }
    }
    echo "\n";
}

echo "\n✅ Verification complete!\n";
