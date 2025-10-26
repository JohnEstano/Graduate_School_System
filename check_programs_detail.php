<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ProgramRecord;

echo "\n";
echo "CHECKING PROGRAM RECORDS\n";
echo str_repeat("=", 100) . "\n\n";

$programs = ProgramRecord::orderBy('id')->get();

echo "Total Programs: {$programs->count()}\n\n";

echo "First 10 Programs:\n";
echo str_repeat("-", 100) . "\n";
printf("%-3s | %-15s | %-60s | %-15s\n", "ID", "Code", "Name", "Category");
echo str_repeat("-", 100) . "\n";

foreach ($programs->take(10) as $p) {
    $name = strlen($p->name) > 60 ? substr($p->name, 0, 57) . '...' : $p->name;
    printf("%-3s | %-15s | %-60s | %-15s\n", 
        $p->id, 
        $p->program, 
        $name, 
        $p->category ?? '(null)'
    );
}

echo "\nCategory Distribution:\n";
echo str_repeat("-", 100) . "\n";
$categories = $programs->groupBy('category');
foreach ($categories as $category => $progs) {
    echo sprintf("%-20s: %d programs\n", $category ?: '(null)', $progs->count());
}

echo "\n";
