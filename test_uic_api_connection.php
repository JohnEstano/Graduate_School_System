<?php

/**
 * Quick test script to verify UIC API v2 connection
 * Tests the configuration from .env and config/uic-api.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\UicApiClient;
use Illuminate\Support\Facades\Log;

echo "🔧 UIC API v2 Connection Test\n";
echo str_repeat("=", 50) . "\n\n";

// Display configuration
echo "📋 Configuration:\n";
echo "   Base URL: " . config('uic-api.base_url') . "\n";
echo "   Client ID: " . substr(config('uic-api.client_id'), 0, 20) . "...\n";
echo "   Timeout: " . config('uic-api.timeout') . " seconds\n";
echo "   Token Cache: " . config('uic-api.token_cache_minutes') . " minutes\n\n";

// Test credentials from the curl example
$testUsername = '230000001212';
$testPassword = 'temppass';

echo "🔐 Testing login with test credentials...\n";
echo "   Username: $testUsername\n\n";

try {
    $client = new UicApiClient();
    
    echo "⏳ Attempting login...\n";
    $result = $client->login($testUsername, $testPassword);
    
    if ($result['success']) {
        echo "✅ Login successful!\n\n";
        echo "📦 Response data:\n";
        echo "   User ID: " . ($result['user_data']['user_account_id'] ?? 'N/A') . "\n";
        echo "   Email: " . ($result['user_data']['email_address'] ?? 'N/A') . "\n";
        echo "   Name: " . ($result['user_data']['first_name'] ?? '') . " " . 
             ($result['user_data']['last_name'] ?? '') . "\n";
        echo "   Type: " . ($result['user_data']['type'] ?? 'N/A') . "\n";
        echo "   Token: " . substr($result['bearer_token'] ?? '', 0, 30) . "...\n";
        echo "   Token Type: " . ($result['token_type'] ?? 'N/A') . "\n";
        echo "   Expires: " . ($result['expires_at'] ?? 'N/A') . "\n\n";
        
        echo "🎉 Configuration is working correctly!\n";
        echo "   The UIC API v2 integration is ready to use.\n";
        
    } else {
        echo "❌ Login failed\n";
        echo "   Message: " . ($result['message'] ?? 'Unknown error') . "\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Error during test:\n";
    echo "   " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    
    if ($e->getPrevious()) {
        echo "\n   Previous error: " . $e->getPrevious()->getMessage() . "\n";
    }
}

echo "\n" . str_repeat("=", 50) . "\n";
