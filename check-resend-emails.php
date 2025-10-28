<?php

// Check the status of the emails we just sent
$apiKey = 're_JR3GCkYg_ExTwUHxNwmrBTKSJ2DwWiEbR';

echo "Checking Recent Emails in Resend\n";
echo "=================================\n\n";

// Get the last email we sent
$emailId1 = '506ceab7-edfe-4fe2-9aa2-6df72b4cb669'; // From production test
$emailId2 = '4daefe7f-ee50-41ea-ad9f-a34045702166'; // From diagnostic test

echo "Checking Email 1: $emailId1\n";
$ch = curl_init("https://api.resend.com/emails/$emailId1");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: " . json_encode(json_decode($response, true), JSON_PRETTY_PRINT) . "\n\n";

echo "Checking Email 2: $emailId2\n";
$ch = curl_init("https://api.resend.com/emails/$emailId2");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: " . json_encode(json_decode($response, true), JSON_PRETTY_PRINT) . "\n\n";

// List all recent emails
echo "Listing All Recent Emails:\n";
echo "==========================\n";
$ch = curl_init('https://api.resend.com/emails');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
$emails = json_decode($response, true);

if (isset($emails['data']) && count($emails['data']) > 0) {
    echo "Found " . count($emails['data']) . " emails:\n\n";
    foreach ($emails['data'] as $email) {
        echo "ID: " . ($email['id'] ?? 'N/A') . "\n";
        echo "To: " . json_encode($email['to'] ?? []) . "\n";
        echo "Subject: " . ($email['subject'] ?? 'N/A') . "\n";
        echo "Status: " . ($email['last_event'] ?? 'N/A') . "\n";
        echo "Created: " . ($email['created_at'] ?? 'N/A') . "\n";
        echo "---\n";
    }
} else {
    echo "No emails found!\n";
    echo "Full Response: " . $response . "\n";
}
