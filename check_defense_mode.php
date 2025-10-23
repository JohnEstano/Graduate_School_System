<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\StudentRecord;

$student = StudentRecord::first();

echo "Student Record Columns:\n";
echo implode(', ', array_keys($student->toArray()));
echo "\n\nSample values:\n";
echo "defense_mode: " . ($student->defense_mode ?? 'NOT FOUND') . "\n";
echo "defense_type: " . ($student->defense_type ?? 'NOT FOUND') . "\n";
