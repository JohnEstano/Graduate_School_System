<?php
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$users = DB::table('users')
    ->select('id', 'first_name', 'last_name', 'email', 'role')
    ->whereIn('role', ['Panel', 'Faculty', 'Coordinator'])
    ->orderBy('role')
    ->orderBy('last_name')
    ->get();

echo "=== Panel/Faculty Users in Database ===\n\n";
echo str_pad("ID", 5) . " | " . str_pad("First Name", 20) . " | " . str_pad("Last Name", 20) . " | " . str_pad("Email", 40) . " | Role\n";
echo str_repeat("-", 120) . "\n";

foreach ($users as $user) {
    echo str_pad($user->id, 5) . " | " . 
         str_pad($user->first_name ?? '', 20) . " | " . 
         str_pad($user->last_name ?? '', 20) . " | " . 
         str_pad($user->email ?? '', 40) . " | " . 
         $user->role . "\n";
}

echo "\n=== Panel Names in Defense Request ===\n";
$defense = DB::table('defense_requests')->find(1);
if ($defense) {
    echo "Chairperson: " . ($defense->defense_chairperson ?? 'null') . "\n";
    echo "Panelist 1:  " . ($defense->defense_panelist1 ?? 'null') . "\n";
    echo "Panelist 2:  " . ($defense->defense_panelist2 ?? 'null') . "\n";
    echo "Panelist 3:  " . ($defense->defense_panelist3 ?? 'null') . "\n";
    echo "Panelist 4:  " . ($defense->defense_panelist4 ?? 'null') . "\n";
}
