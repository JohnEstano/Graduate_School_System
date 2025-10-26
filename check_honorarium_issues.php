<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking Honorarium Payments Issue ===\n\n";

$honorariums = \App\Models\HonorariumPayment::with(['panelist', 'defenseRequest'])->get();

echo "Total Honorarium Payments: {$honorariums->count()}\n\n";

$missingPanelist = [];
foreach ($honorariums as $h) {
    if (!$h->panelist && !empty($h->panelist_id)) {
        $missingPanelist[] = $h;
    }
}

echo "Honorarium payments with missing panelist linkage: " . count($missingPanelist) . "\n\n";

if (count($missingPanelist) > 0) {
    echo "Details:\n";
    foreach ($missingPanelist as $h) {
        echo "\nHonorarium #{$h->id}:\n";
        echo "  Defense Request: #{$h->defense_request_id}\n";
        echo "  Panelist ID: {$h->panelist_id}\n";
        echo "  Panelist Name: {$h->panelist_name}\n";
        echo "  Role: {$h->role}\n";
        echo "  Amount: ₱{$h->amount}\n";
        
        // Check if panelist exists in panelists table
        $panelistExists = \App\Models\Panelist::find($h->panelist_id);
        echo "  Panelist exists in table: " . ($panelistExists ? "YES" : "NO") . "\n";
        
        if ($panelistExists) {
            echo "  Panelist name in table: {$panelistExists->name}\n";
        }
    }
    
    echo "\n\n⚠️ NOTE: These honorarium payments reference panelists that don't exist.\n";
    echo "This is okay - the sync service skips these with a warning.\n";
    echo "They were likely deleted or the IDs are incorrect.\n";
}

// Check which defense requests have incomplete honorarium data
echo "\n\n=== Defense Requests Analysis ===\n\n";

$defenses = \App\Models\DefenseRequest::where('workflow_state', 'completed')->get();

foreach ($defenses as $defense) {
    echo "\nDefense #{$defense->id}: {$defense->first_name} {$defense->last_name}\n";
    
    $honorariums = \App\Models\HonorariumPayment::where('defense_request_id', $defense->id)->get();
    echo "  Total honorarium payments: {$honorariums->count()}\n";
    
    $valid = $honorariums->filter(fn($h) => $h->panelist)->count();
    $invalid = $honorariums->filter(fn($h) => !$h->panelist && !empty($h->panelist_id))->count();
    $nullPanelist = $honorariums->filter(fn($h) => empty($h->panelist_id))->count();
    
    echo "  Valid (with panelist): {$valid}\n";
    echo "  Invalid (panelist_id but not found): {$invalid}\n";
    echo "  Null panelist_id: {$nullPanelist}\n";
}

echo "\n✅ Analysis complete!\n";
