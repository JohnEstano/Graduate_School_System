<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "\n";
echo "Creating test panelists...\n\n";

$panelists = [
    [
        'name' => 'Dr. Maria Santos',
        'email' => 'maria.santos@test.com',
        'role' => 'panelist',
    ],
    [
        'name' => 'Prof. Juan Dela Cruz',
        'email' => 'juan.delacruz@test.com',
        'role' => 'panelist',
    ],
    [
        'name' => 'Dr. Ana Reyes',
        'email' => 'ana.reyes@test.com',
        'role' => 'panelist',
    ],
    [
        'name' => 'Dr. Carlos Garcia',
        'email' => 'carlos.garcia@test.com',
        'role' => 'panelist',
    ],
];

foreach ($panelists as $panelistData) {
    $existing = User::where('email', $panelistData['email'])->first();
    
    if ($existing) {
        echo "⚠️  {$panelistData['name']} already exists (ID: {$existing->id})\n";
        continue;
    }
    
    $panelist = User::create([
        'name' => $panelistData['name'],
        'email' => $panelistData['email'],
        'password' => Hash::make('password123'),
        'role' => $panelistData['role'],
    ]);
    
    echo "✅ Created: {$panelist->name} (ID: {$panelist->id})\n";
}

echo "\nTotal panelists now: " . User::where('role', 'panelist')->count() . "\n";
echo "Total students: " . User::where('role', 'student')->count() . "\n\n";
