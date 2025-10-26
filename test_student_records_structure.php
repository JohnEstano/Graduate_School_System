<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProgramRecord;
use App\Models\StudentRecord;

echo "Testing Student Records Structure\n";
echo "==================================\n\n";

// Get all programs
$programs = ProgramRecord::all();
echo "Total Programs: " . $programs->count() . "\n\n";

// Show first 5 programs with student count
foreach ($programs->take(5) as $program) {
    $studentCount = StudentRecord::where('program_record_id', $program->id)->count();
    echo "Program: {$program->name}\n";
    echo "  Code: {$program->program}\n";
    echo "  Category: {$program->category}\n";
    echo "  Students: {$studentCount}\n";
    echo "  Date: {$program->date_edited}\n\n";
}

// Test specific program
$firstProgram = $programs->first();
if ($firstProgram) {
    echo "\nStudents in '{$firstProgram->name}':\n";
    echo "=====================================\n";
    
    $students = StudentRecord::where('program_record_id', $firstProgram->id)
        ->orderBy('last_name', 'asc')
        ->get();
    
    foreach ($students->take(10) as $student) {
        echo "- {$student->first_name} {$student->last_name} ({$student->student_id})\n";
        echo "  Program: {$student->program} | Section: {$student->course_section}\n";
        echo "  Status: {$student->academic_status}\n\n";
    }
    
    echo "Total students in this program: " . $students->count() . "\n";
}
