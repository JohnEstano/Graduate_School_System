<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\StudentRecord;

$student = StudentRecord::with('programRecord')->where('student_id', '202454043')->first();

echo "Student: {$student->first_name} {$student->last_name}\n";
echo "Program Code: {$student->program}\n";
echo "Program Full Name: {$student->programRecord->name}\n";
echo "Category: {$student->programRecord->category}\n";
echo "Defense Type: {$student->defense_type}\n";

echo "\nIs Doctorate: " . (str_starts_with($student->program, 'DBM') ? 'YES' : 'NO') . "\n";
