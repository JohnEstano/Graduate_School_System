<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Current Defense Request Data ===\n\n";

$dr = \App\Models\DefenseRequest::find(1);

if ($dr) {
    echo "Defense Request ID: {$dr->id}\n";
    echo "Student: {$dr->first_name} {$dr->last_name}\n";
    echo "Thesis: {$dr->thesis_title}\n";
    echo "\n--- Current Schedule ---\n";
    echo "Scheduled Date: " . ($dr->scheduled_date ?? 'NULL') . "\n";
    echo "Scheduled Time: " . ($dr->scheduled_time ?? 'NULL') . "\n";
    echo "Scheduled End Time: " . ($dr->scheduled_end_time ?? 'NULL') . "\n";
    echo "Defense Mode: " . ($dr->defense_mode ?? 'NULL') . "\n";
    echo "Defense Venue: " . ($dr->defense_venue ?? 'NULL') . "\n";
    
    echo "\n--- Current Panels ---\n";
    echo "Defense Chairperson: " . ($dr->defense_chairperson ?? 'NULL') . "\n";
    echo "Defense Panelist 1: " . ($dr->defense_panelist1 ?? 'NULL') . "\n";
    echo "Defense Panelist 2: " . ($dr->defense_panelist2 ?? 'NULL') . "\n";
    echo "Defense Panelist 3: " . ($dr->defense_panelist3 ?? 'NULL') . "\n";
    echo "Defense Panelist 4: " . ($dr->defense_panelist4 ?? 'NULL') . "\n";
    
    echo "\n--- Status ---\n";
    echo "Workflow State: " . ($dr->workflow_state ?? 'NULL') . "\n";
    echo "Coordinator Status: " . ($dr->coordinator_status ?? 'NULL') . "\n";
    echo "Adviser Status: " . ($dr->adviser_status ?? 'NULL') . "\n";
} else {
    echo "❌ No defense request found with ID 1\n";
}
