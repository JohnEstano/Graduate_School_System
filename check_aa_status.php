<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== AA Payment Verification Status ===\n\n";

$verifications = \App\Models\AaPaymentVerification::with('defenseRequest')->get();

foreach ($verifications as $v) {
    echo "Defense Request ID: {$v->defense_request_id}\n";
    echo "  AA Status: {$v->status}\n";
    echo "  Defense State: " . ($v->defenseRequest ? $v->defenseRequest->workflow_state : 'N/A') . "\n";
    echo "  Program: " . ($v->defenseRequest ? $v->defenseRequest->program : 'N/A') . "\n";
    echo "  Student: " . ($v->defenseRequest ? $v->defenseRequest->first_name . ' ' . $v->defenseRequest->last_name : 'N/A') . "\n";
    echo "\n";
}

echo "\n=== Defense Requests Status ===\n\n";

$defenses = \App\Models\DefenseRequest::all();
foreach ($defenses as $d) {
    echo "Defense Request ID: {$d->id}\n";
    echo "  Workflow State: {$d->workflow_state}\n";
    echo "  Program: {$d->program}\n";
    echo "  Student: {$d->first_name} {$d->last_name}\n";
    echo "  Has AA Verification: " . (\App\Models\AaPaymentVerification::where('defense_request_id', $d->id)->exists() ? 'Yes' : 'No') . "\n";
    echo "\n";
}
