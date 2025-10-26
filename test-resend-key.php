<?php

// Test if Resend API key is valid
$apiKey = 're_JR3GCkYg_ExTwUHxNwmrBTKSJ2DwWiEbR';

echo "Testing Resend API Key Validity\n";
echo "================================\n\n";

// Try to get API keys list (this will tell us if the key is valid)
$ch = curl_init('https://api.resend.com/api-keys');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status Code: $httpCode\n";
echo "Response: $response\n\n";

if ($httpCode == 401) {
    echo "❌ API Key is INVALID or EXPIRED!\n";
    echo "Solution: Generate a new API key from https://resend.com/api-keys\n";
} elseif ($httpCode == 200) {
    echo "✅ API Key is valid!\n";
    
    // Now test domains
    echo "\nChecking domains...\n";
    $ch = curl_init('https://api.resend.com/domains');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Domains HTTP Code: $httpCode\n";
    echo "Domains Response: $response\n";
    
    $domains = json_decode($response, true);
    if (isset($domains['data'])) {
        echo "\nVerified Domains:\n";
        foreach ($domains['data'] as $domain) {
            $status = $domain['status'] ?? 'unknown';
            $name = $domain['name'] ?? 'unknown';
            echo "  - $name: $status\n";
        }
    }
}
