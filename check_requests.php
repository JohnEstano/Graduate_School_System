<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;

echo "Defense Requests:\n";
$requests = DefenseRequest::with(['adviserUser'])->get();
foreach ($requests as $r) {
    echo "ID: {$r->id} - Student: {$r->first_name} {$r->last_name} - Adviser: {$r->defense_adviser} - Adviser User ID: " . ($r->adviser_user_id ?: 'null') . " - State: {$r->workflow_state}\n";
}
