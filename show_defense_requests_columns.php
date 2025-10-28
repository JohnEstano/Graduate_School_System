<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$columns = DB::select("SHOW COLUMNS FROM defense_requests");

echo "=== defense_requests table columns ===\n\n";

foreach ($columns as $col) {
    $field = $col->Field ?? '';
    $type = $col->Type ?? '';
    echo str_pad($field, 35) . " | $type\n";
}

echo "\n=== Checking for adviser-related columns ===\n";
$adviserColumns = array_filter($columns, function($col) {
    return stripos($col->Field, 'adviser') !== false;
});

if (count($adviserColumns) > 0) {
    echo "Found adviser-related columns:\n";
    foreach ($adviserColumns as $col) {
        echo "  - {$col->Field}\n";
    }
} else {
    echo "NO adviser-related columns found!\n";
}
