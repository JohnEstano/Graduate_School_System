<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;
use App\Models\User;

echo "=== All Defense Requests ===\n\n";

$requests = DefenseRequest::all();

foreach ($requests as $dr) {
    echo "ID: {$dr->id}\n";
    echo "  Student: {$dr->first_name} {$dr->last_name}\n";
    echo "  Thesis: {$dr->thesis_title}\n";
    echo "  adviser_id: " . ($dr->adviser_id ?? 'NULL') . "\n";
    echo "  user_id (student): " . ($dr->user_id ?? 'NULL') . "\n";
    echo "  coordinator_user_id: " . ($dr->coordinator_user_id ?? 'NULL') . "\n";
    echo "  adviser_status: {$dr->adviser_status}\n";
    echo "  coordinator_status: {$dr->coordinator_status}\n";
    echo "\n";
}

echo "\n=== All Advisers ===\n\n";
$advisers = User::where('role', 'Adviser')->orWhere('role', 'Faculty')->get();
foreach ($advisers as $adviser) {
    echo "ID: {$adviser->id} - {$adviser->first_name} {$adviser->last_name} ({$adviser->email})\n";
    $coords = $adviser->coordinators()->get();
    echo "  Coordinators linked: " . $coords->count() . "\n";
    foreach ($coords as $c) {
        echo "    - {$c->first_name} {$c->last_name} (ID: {$c->id})\n";
    }
    echo "\n";
}

echo "\n=== All Coordinators ===\n\n";
$coordinators = User::where('role', 'Coordinator')->get();
foreach ($coordinators as $coord) {
    echo "ID: {$coord->id} - {$coord->first_name} {$coord->last_name} ({$coord->email})\n";
    echo "  Program: {$coord->program}\n\n";
}
