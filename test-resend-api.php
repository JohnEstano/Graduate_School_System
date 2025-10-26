<?php

// Test Resend API directly with curl
$apiKey = 're_JR3GCkYg_ExTwUHxNwmrBTKSJ2DwWiEbR';

$data = [
    'from' => 'noreply@diapana.dev',
    'to' => ['japzdiapana@gmail.com'],
    'subject' => 'Test Email from Graduate School System',
    'html' => '<h1>Test Email</h1><p>This is a test email from the Graduate School System.</p>',
];

$ch = curl_init('https://api.resend.com/emails');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status Code: $httpCode\n";
echo "Response: $response\n";

$responseData = json_decode($response, true);
if (isset($responseData['message'])) {
    echo "\nError Message: " . $responseData['message'] . "\n";
}
if (isset($responseData['name'])) {
    echo "Error Name: " . $responseData['name'] . "\n";
}
