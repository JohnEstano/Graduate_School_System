#!/usr/bin/env php
<?php

/**
 * Quick script to check bearer token
 * Usage: php check_bearer_token.php [user_id]
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Cache;
use App\Models\User;

$userId = $argv[1] ?? null;

if (!$userId) {
    echo "📋 Checking all users with bearer tokens...\n\n";
    
    $users = User::take(20)->get();
    $found = 0;
    
    foreach ($users as $user) {
        $token = Cache::get('uic_bearer_token_' . $user->id);
        if ($token) {
            $found++;
            echo "✅ User ID: {$user->id}\n";
            echo "   Email: {$user->email}\n";
            echo "   Token: " . substr($token, 0, 50) . "...\n\n";
        }
    }
    
    if ($found === 0) {
        echo "❌ No users have bearer tokens cached.\n";
        echo "💡 Users need to log in with mode=uic-api to get a bearer token.\n";
    } else {
        echo "Total users with tokens: {$found}\n";
    }
} else {
    echo "🔍 Checking bearer token for User ID: {$userId}\n\n";
    
    $user = User::find($userId);
    
    if (!$user) {
        echo "❌ User not found\n";
        exit(1);
    }
    
    $token = Cache::get('uic_bearer_token_' . $userId);
    
    if ($token) {
        echo "✅ Bearer Token Found!\n\n";
        echo "User ID: {$user->id}\n";
        echo "Email: {$user->email}\n";
        echo "Name: {$user->first_name} {$user->last_name}\n\n";
        echo "Token Preview: " . substr($token, 0, 50) . "...\n";
        echo "Token Length: " . strlen($token) . " characters\n";
        echo "Cache Key: uic_bearer_token_{$userId}\n\n";
        echo "Full Token:\n{$token}\n";
    } else {
        echo "❌ No bearer token found for this user\n";
        echo "💡 User needs to log in with mode=uic-api\n";
    }
}
