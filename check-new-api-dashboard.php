<?php

$apiKey = 're_9j5Joz72_9XP28KAsoC5nwCVW1DgSm1j5';

echo "Checking all emails in dashboard with new API key...\n\n";

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

if ($httpCode == 200) {
    $data = json_decode($response, true);
    
    if (isset($data['data']) && count($data['data']) > 0) {
        echo "Found " . count($data['data']) . " emails:\n\n";
        
        foreach ($data['data'] as $email) {
            echo "ID: " . ($email['id'] ?? 'N/A') . "\n";
            echo "To: " . json_encode($email['to'] ?? []) . "\n";
            echo "Subject: " . ($email['subject'] ?? 'N/A') . "\n";
            echo "Status: " . ($email['last_event'] ?? 'N/A') . "\n";
            echo "Created: " . ($email['created_at'] ?? 'N/A') . "\n";
            echo "---\n";
        }
        
        echo "\n✅ Emails ARE appearing in this API key's dashboard!\n";
    } else {
        echo "No emails found in this API key's account.\n";
        echo "\nThis could mean:\n";
        echo "1. The API key is brand new (no emails sent yet)\n";
        echo "2. Emails take time to appear (wait a few minutes)\n";
        echo "3. You're still looking at a different account's dashboard\n";
    }
} else {
    echo "Error: $httpCode\n";
    echo "Response: $response\n";
}

echo "\n\n📧 IMPORTANT: Check your email inbox (japzdiapana@gmail.com)\n";
echo "Did you receive the test email 'NEW API KEY TEST'?\n";
echo "- If YES: The emails ARE being sent, just wait for dashboard sync\n";
echo "- If NO: There might be a delivery issue\n";
