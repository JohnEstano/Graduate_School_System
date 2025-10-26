<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;
use App\Models\User;

$defenseRequest = DefenseRequest::find(1);

echo "Defense Request ID: {$defenseRequest->id}\n";
echo "last_status_updated_by: " . ($defenseRequest->last_status_updated_by ?? 'NULL') . "\n\n";

if ($defenseRequest->last_status_updated_by) {
    $updatedByUser = User::find($defenseRequest->last_status_updated_by);
    if ($updatedByUser) {
        echo "User found:\n";
        echo "  ID: {$updatedByUser->id}\n";
        echo "  First Name: {$updatedByUser->first_name}\n";
        echo "  Middle Name: " . ($updatedByUser->middle_name ?? 'NULL') . "\n";
        echo "  Last Name: {$updatedByUser->last_name}\n\n";
        
        $fullName = trim(
            $updatedByUser->first_name . ' ' . 
            ($updatedByUser->middle_name ? strtoupper($updatedByUser->middle_name[0]) . '. ' : '') . 
            $updatedByUser->last_name
        );
        
        echo "Formatted Name: {$fullName}\n";
    } else {
        echo "User NOT found!\n";
    }
} else {
    echo "No last_status_updated_by set!\n";
}
