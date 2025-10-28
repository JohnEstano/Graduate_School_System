<?php

$apiKey = 're_9j5Joz72_9XP28KAsoC5nwCVW1DgSm1j5';

echo "=== DEEP DIAGNOSTIC: Why Emails Aren't Delivering ===\n\n";

// Check the account and domain status
echo "1. Checking Account Details:\n";

$ch = curl_init('https://api.resend.com/domains');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
curl_close($ch);

$domains = json_decode($response, true);
echo "Domains:\n";
print_r($domains);
echo "\n";

// Check recent emails status
echo "2. Checking Recent Email Statuses:\n";

$ch = curl_init('https://api.resend.com/emails');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
curl_close($ch);

$emails = json_decode($response, true);

if (isset($emails['data'])) {
    echo "Total emails in account: " . count($emails['data']) . "\n\n";
    
    // Check the most recent email
    if (count($emails['data']) > 0) {
        $latestEmail = $emails['data'][0];
        echo "Latest Email:\n";
        echo "  ID: " . ($latestEmail['id'] ?? 'N/A') . "\n";
        echo "  To: " . json_encode($latestEmail['to'] ?? []) . "\n";
        echo "  Subject: " . ($latestEmail['subject'] ?? 'N/A') . "\n";
        echo "  Status: " . ($latestEmail['last_event'] ?? 'N/A') . "\n";
        echo "  Created: " . ($latestEmail['created_at'] ?? 'N/A') . "\n\n";
    }
}

// Now send a test email and track it
echo "3. Sending Test Email with Tracking:\n";

$data = [
    'from' => 'noreply@diapana.dev',  // Simple from without name
    'to' => ['japzdiapana@gmail.com'],
    'subject' => 'TRACKING TEST ' . time(),
    'text' => 'This is a plain text test email. No HTML, no complications.',
];

echo "Sending plain text email...\n";
$ch = curl_init('https://api.resend.com/emails');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
]);
curl_setopt($ch, CURLOPT_VERBOSE, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

$result = json_decode($response, true);

if ($httpCode == 200 && isset($result['id'])) {
    $emailId = $result['id'];
    echo "✅ Email accepted by API. ID: $emailId\n\n";
    
    // Wait and check status multiple times
    for ($i = 1; $i <= 5; $i++) {
        echo "Checking status (attempt $i/5)...\n";
        sleep(2);
        
        $ch = curl_init("https://api.resend.com/emails/$emailId");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode == 200) {
            $emailStatus = json_decode($response, true);
            echo "  Status: " . ($emailStatus['last_event'] ?? 'N/A') . "\n";
            
            if (isset($emailStatus['last_event']) && $emailStatus['last_event'] !== 'N/A') {
                echo "\n✅ Found it! Email status: " . $emailStatus['last_event'] . "\n";
                print_r($emailStatus);
                break;
            }
        } else {
            echo "  404 - Not found yet\n";
        }
    }
} else {
    echo "❌ Failed to send\n";
    if (isset($result['message'])) {
        echo "Error: " . $result['message'] . "\n";
    }
}

echo "\n\n4. Checking if API Key Has Restrictions:\n";

// Try to get API key details
$ch = curl_init('https://api.resend.com/api-keys');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
curl_close($ch);

echo "API Keys in account:\n";
$keys = json_decode($response, true);
print_r($keys);

echo "\n\n=== DIAGNOSIS ===\n";
echo "If emails show 'sent' or 'delivered' status but you don't receive them:\n";
echo "  → Check spam/junk folder\n";
echo "  → Email might be blocked by recipient server\n";
echo "  → Domain reputation issue\n\n";

echo "If emails show 'queued' or no status:\n";
echo "  → Resend is still processing\n";
echo "  → Wait 5-10 minutes\n\n";

echo "If all emails return 404:\n";
echo "  → Wrong API key for this dashboard\n";
echo "  → API key permission issue\n";
