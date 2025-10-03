<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "=== FIXING STUDENT USER DATA ===\n\n";

$students = User::where('role', 'Student')->get();

foreach ($students as $student) {
    $updated = false;
    $updates = [];
    
    if (!$student->school_id) {
        $updates['school_id'] = '2025-' . str_pad($student->id, 6, '0', STR_PAD_LEFT);
        $updated = true;
    }
    
    if (!$student->program) {
        $updates['program'] = 'Master of Science in Computer Science';
        $updated = true;
    }
    
    if ($updated) {
        $student->update($updates);
        echo "Updated student: {$student->first_name} {$student->last_name}\n";
        $schoolId = isset($updates['school_id']) ? $updates['school_id'] : $student->school_id;
        $program = isset($updates['program']) ? $updates['program'] : $student->program;
        echo "  - School ID: {$schoolId}\n";
        echo "  - Program: {$program}\n\n";
    } else {
        echo "Student {$student->first_name} {$student->last_name} already has complete data\n";
    }
}

echo "=== DONE ===\n";
