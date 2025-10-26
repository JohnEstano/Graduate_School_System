<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ProgramRecord;

echo "\n";
echo "PROGRAM RECORDS IN DATABASE\n";
echo str_repeat("=", 100) . "\n\n";

$totalPrograms = ProgramRecord::count();
echo "Total Programs: {$totalPrograms}\n\n";

echo "Sample Programs:\n";
echo str_repeat("-", 100) . "\n";

$programs = ProgramRecord::orderBy('category', 'desc')
    ->orderBy('name')
    ->get(['id', 'name', 'program', 'category']);

$doctorates = $programs->where('category', 'Doctorate');
$masters = $programs->where('category', 'Masters');

echo "\n📚 DOCTORATE PROGRAMS ({$doctorates->count()} total)\n";
echo str_repeat("-", 100) . "\n";
foreach ($doctorates as $p) {
    echo sprintf("%-3s | %-15s | %s\n", $p->id, $p->program, $p->name);
}

echo "\n📖 MASTERAL PROGRAMS ({$masters->count()} total)\n";
echo str_repeat("-", 100) . "\n";
foreach ($masters as $p) {
    echo sprintf("%-3s | %-15s | %s\n", $p->id, $p->program, $p->name);
}

echo "\n" . str_repeat("=", 100) . "\n";
echo "\n✅ These programs were automatically seeded from: database/static/program_data.php\n";
echo "📝 Migration: 2025_08_28_120003_create_program_records_table.php\n";
echo "🔄 Status: Already ran (shown in migrate:status)\n\n";
