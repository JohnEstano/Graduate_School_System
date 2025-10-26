<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ProgramRecord;

$program = ProgramRecord::with('panelists.students')->first();
if (!$program) {
    echo "No program found\n";
    exit(1);
}

echo "Program: {$program->name}\n\n";
foreach ($program->panelists as $p) {
    $roles = $p->students->pluck('pivot.role')->filter()->unique()->values()->all();
    echo "Panelist: {$p->pfirst_name} {$p->plast_name}\n";
    echo "Summary roles: " . (count($roles) ? implode(', ', $roles) : ($p->role ?? 'N/A')) . "\n";
    echo "Assigned per student:\n";
    foreach ($p->students as $s) {
        $assigned = $s->pivot->role ?? 'N/A';
        echo "  - {$s->first_name} {$s->last_name}: {$assigned}\n";
    }
    echo str_repeat('-',40) . "\n";
}
