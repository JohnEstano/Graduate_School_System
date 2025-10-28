<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;

$requestId = $argv[1] ?? 1;
$adviserId = $argv[2] ?? 4;

$dr = DefenseRequest::find($requestId);
if (!$dr) {
    echo "Defense request #{$requestId} not found!\n";
    exit(1);
}

echo "Before:\n";
echo "  adviser_user_id: " . ($dr->adviser_user_id ?? 'NULL') . "\n\n";

$dr->adviser_user_id = $adviserId;
$dr->save();

echo "After:\n";
echo "  adviser_user_id: {$dr->adviser_user_id}\n\n";
echo "✓ Defense request #{$requestId} has been linked to adviser #{$adviserId}\n";
