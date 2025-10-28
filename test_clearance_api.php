<?php

/**
 * Test script to verify UIC API v2 clearance endpoints
 * Tests grades and tuition clearance checking
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Http;

echo "🔧 UIC API v2 Clearance Endpoints Test\n";
echo str_repeat("=", 60) . "\n\n";

// Configuration
$baseUrl = config('uic-api.base_url');
$clientId = config('uic-api.client_id');
$clientSecret = config('uic-api.client_secret');

echo "📋 Configuration:\n";
echo "   Base URL: $baseUrl\n";
echo "   Client ID: " . substr($clientId, 0, 20) . "...\n\n";

// Test credentials
$username = '230000001047';
$password = 'Temppass!';

echo "🔐 Step 1: Login to get bearer token\n";
echo "   Username: $username\n";

try {
    $loginResponse = Http::withHeaders([
        'X-API-Client-ID' => $clientId,
        'X-API-Client-Secret' => $clientSecret,
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
    ])->timeout(30)
      ->post($baseUrl . '/accounts/auth/login', [
        'username' => $username,
        'password' => $password,
    ]);

    if (!$loginResponse->successful()) {
        echo "   ❌ Login failed: " . $loginResponse->status() . "\n";
        echo "   Response: " . $loginResponse->body() . "\n";
        exit(1);
    }

    $loginData = $loginResponse->json();
    
    if (!isset($loginData['success']) || !$loginData['success']) {
        echo "   ❌ Login unsuccessful\n";
        echo "   Response: " . json_encode($loginData) . "\n";
        exit(1);
    }

    $token = $loginData['data']['token'] ?? null;
    $studentNumber = $username; // Use the username (student number) instead of user_account_id
    
    if (!$token) {
        echo "   ❌ No token in response\n";
        exit(1);
    }

    echo "   ✅ Login successful!\n";
    echo "   Token: " . substr($token, 0, 20) . "...\n";
    echo "   Student Number: $studentNumber\n\n";

    // Test Grades Clearance
    echo "📚 Step 2: Check Grades Clearance\n";
    echo "   Endpoint: /students-portal/students/$studentNumber/clearance/grades\n";
    
    $gradesResponse = Http::withHeaders([
        'X-API-Client-ID' => $clientId,
        'X-API-Client-Secret' => $clientSecret,
        'Content-Type' => 'application/json',
        'Authorization' => 'Bearer ' . $token,
    ])->timeout(30)
      ->get($baseUrl . "/students-portal/students/$studentNumber/clearance/grades");

    if (!$gradesResponse->successful()) {
        echo "   ❌ Request failed: " . $gradesResponse->status() . "\n";
        echo "   Response: " . $gradesResponse->body() . "\n";
    } else {
        $gradesData = $gradesResponse->json();
        echo "   ✅ Request successful!\n";
        echo "   Success: " . json_encode($gradesData['success'] ?? false) . "\n";
        echo "   Cleared: " . json_encode($gradesData['data'] ?? null) . "\n";
        echo "   Message: " . ($gradesData['message'] ?? 'No message') . "\n";
        echo "   Full Response: " . json_encode($gradesData, JSON_PRETTY_PRINT) . "\n\n";
    }

    // Test Tuition Clearance
    echo "💰 Step 3: Check Tuition Clearance\n";
    echo "   Endpoint: /students-portal/students/$studentNumber/clearance/tuition\n";
    
    $tuitionResponse = Http::withHeaders([
        'X-API-Client-ID' => $clientId,
        'X-API-Client-Secret' => $clientSecret,
        'Content-Type' => 'application/json',
        'Authorization' => 'Bearer ' . $token,
    ])->timeout(30)
      ->get($baseUrl . "/students-portal/students/$studentNumber/clearance/tuition");

    if (!$tuitionResponse->successful()) {
        echo "   ❌ Request failed: " . $tuitionResponse->status() . "\n";
        echo "   Response: " . $tuitionResponse->body() . "\n";
    } else {
        $tuitionData = $tuitionResponse->json();
        echo "   ✅ Request successful!\n";
        echo "   Success: " . json_encode($tuitionData['success'] ?? false) . "\n";
        echo "   Cleared: " . json_encode($tuitionData['data'] ?? null) . "\n";
        echo "   Message: " . ($tuitionData['message'] ?? 'No message') . "\n";
        echo "   Full Response: " . json_encode($tuitionData, JSON_PRETTY_PRINT) . "\n\n";
    }

    echo "🎉 All tests completed!\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n" . str_repeat("=", 60) . "\n";
