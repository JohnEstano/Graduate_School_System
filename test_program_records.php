<?php

// Quick test to check program_records data
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$records = \App\Models\ProgramRecord::all();

echo "Total Program Records: " . $records->count() . "\n\n";

if ($records->count() > 0) {
    echo "Sample records:\n";
    foreach ($records->take(5) as $record) {
        echo "- ID: {$record->id}, Name: {$record->name}, Program: {$record->program}\n";
    }
} else {
    echo "No program records found in the database.\n";
    echo "Please add program records to the database first.\n";
}
