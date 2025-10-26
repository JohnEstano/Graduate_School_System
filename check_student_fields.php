<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Student Record Fields ===\n\n";

$students = \App\Models\StudentRecord::all();

foreach ($students as $student) {
    echo "Student: {$student->first_name} {$student->last_name}\n";
    echo "  student_id: {$student->student_id}\n";
    echo "  defense_date: " . ($student->defense_date ?? 'NULL') . "\n";
    echo "  defense_type: " . ($student->defense_type ?? 'NULL') . "\n";
    echo "  or_number: " . ($student->or_number ?? 'NULL') . "\n";
    echo "  defense_request_id: " . ($student->defense_request_id ?? 'NULL') . "\n";
    
    if ($student->defense_request_id) {
        $defense = \App\Models\DefenseRequest::find($student->defense_request_id);
        if ($defense) {
            echo "\n  Defense Request Info:\n";
            echo "    scheduled_date: " . ($defense->scheduled_date ?? 'NULL') . "\n";
            echo "    defense_type: " . ($defense->defense_type ?? 'NULL') . "\n";
            echo "    reference_no: " . ($defense->reference_no ?? 'NULL') . "\n";
        }
    }
    echo "\n";
}
