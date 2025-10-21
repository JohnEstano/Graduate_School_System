<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;
use App\Models\DefenseRequirement;

echo "=== CHECKING DATA IN BOTH TABLES ===\n\n";

echo "DEFENSE_REQUESTS table:\n";
$requests = DefenseRequest::all();
if ($requests->count() == 0) {
    echo "  No records found\n";
} else {
    foreach ($requests as $r) {
        echo "  ID: {$r->id} | Student: {$r->first_name} {$r->last_name} | Adviser: {$r->defense_adviser} | State: {$r->workflow_state}\n";
    }
}

echo "\nDEFENSE_REQUIREMENTS table:\n";
$requirements = DefenseRequirement::all();
if ($requirements->count() == 0) {
    echo "  No records found\n";
} else {
    foreach ($requirements as $r) {
        echo "  ID: {$r->id} | Student: {$r->first_name} {$r->last_name} | Adviser: {$r->adviser} | Status: {$r->status}\n";
    }
}

echo "\n=== END CHECK ===\n";
