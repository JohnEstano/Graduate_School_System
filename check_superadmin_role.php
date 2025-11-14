<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "\n=== CHECKING SUPERADMIN USER ===\n\n";

// Get current authenticated user (if any)
$authUser = \Illuminate\Support\Facades\Auth::user();
if ($authUser) {
    echo "Currently authenticated user:\n";
    echo "  ID: {$authUser->id}\n";
    echo "  Email: {$authUser->email}\n";
    echo "  Role: '{$authUser->role}'\n";
    echo "  Role (exact): '" . var_export($authUser->role, true) . "'\n\n";
}

// Get all users with SuperAdmin-like roles
echo "Users with 'admin' or 'super' in their role:\n";
echo str_repeat('-', 80) . "\n";

$users = User::whereRaw("LOWER(role) LIKE '%admin%' OR LOWER(role) LIKE '%super%'")->get();

if ($users->isEmpty()) {
    echo "No admin users found!\n\n";
} else {
    foreach ($users as $user) {
        echo "ID: {$user->id} | Email: {$user->email} | Role: '{$user->role}'\n";
    }
    echo "\n";
}

// Get all unique roles
echo "All unique roles in the system:\n";
echo str_repeat('-', 80) . "\n";
$roles = User::distinct()->pluck('role')->sort()->values();
foreach ($roles as $role) {
    $count = User::where('role', $role)->count();
    echo "  '{$role}' ({$count} users)\n";
}
echo "\n";
