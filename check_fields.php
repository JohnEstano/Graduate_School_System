<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\StudentRecord;

$student = StudentRecord::with('payments')->first();

echo "Student fields:\n";
print_r(array_keys($student->toArray()));

echo "\n\nPayment fields:\n";
if ($student->payments->first()) {
    print_r(array_keys($student->payments->first()->toArray()));
}

echo "\n\nSample student data:\n";
echo "rec_fee: " . ($student->rec_fee ?? 'NULL') . "\n";
echo "school_share: " . ($student->school_share ?? 'NULL') . "\n";
echo "total_amount: " . ($student->total_amount ?? 'NULL') . "\n";
