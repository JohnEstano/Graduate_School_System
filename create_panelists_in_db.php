<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Panelist;

echo "\n";
echo "Creating panelists in panelists table...\n\n";

$panelistData = [
    [
        'name' => 'Dr. Maria Santos',
        'email' => 'maria.santos@test.com',
        'role' => 'Chairperson',
        'status' => 'Not Assigned',
    ],
    [
        'name' => 'Prof. Juan Dela Cruz',
        'email' => 'juan.delacruz@test.com',
        'role' => 'Panel Member',
        'status' => 'Not Assigned',
    ],
    [
        'name' => 'Dr. Ana Reyes',
        'email' => 'ana.reyes@test.com',
        'role' => 'Panel Member',
        'status' => 'Not Assigned',
    ],
    [
        'name' => 'Dr. Carlos Garcia',
        'email' => 'carlos.garcia@test.com',
        'role' => 'Panel Member',
        'status' => 'Not Assigned',
    ],
];

foreach ($panelistData as $data) {
    $existing = Panelist::where('email', $data['email'])->first();
    
    if ($existing) {
        echo "⚠️  {$data['name']} already exists (ID: {$existing->id})\n";
        continue;
    }
    
    $panelist = Panelist::create($data);
    echo "✅ Created: {$panelist->name} (ID: {$panelist->id})\n";
}

echo "\nTotal panelists: " . Panelist::count() . "\n\n";
