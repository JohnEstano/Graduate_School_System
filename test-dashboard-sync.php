<?php

$apiKey = 're_JR3GCkYg_ExTwUHxNwmrBTKSJ2DwWiEbR';

echo "Sending test email and checking status immediately...\n\n";

// Send email
$data = [
    'from' => 'Graduate School System <noreply@diapana.dev>',
    'to' => ['japzdiapana@gmail.com'],
    'subject' => 'Dashboard Test - ' . date('Y-m-d H:i:s'),
    'html' => '<h1>Dashboard Sync Test</h1><p>Sent at: ' . date('Y-m-d H:i:s') . '</p><p>If you see this in your inbox but not in Resend dashboard, there is a dashboard sync issue or wrong API key.</p>',
];

echo "Sending email...\n";
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

echo "HTTP Code: $httpCode\n";
$result = json_decode($response, true);
echo "Response: $response\n\n";

if ($httpCode == 200 && isset($result['id'])) {
    $emailId = $result['id'];
    echo "✅ Email sent! ID: $emailId\n\n";
    
    echo "Waiting 2 seconds for API to process...\n";
    sleep(2);
    
    echo "\nChecking email status...\n";
    $ch = curl_init("https://api.resend.com/emails/$emailId");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Status Check HTTP Code: $httpCode\n";
    echo "Status Response: $response\n\n";
    
    if ($httpCode == 404) {
        echo "❌ EMAIL NOT FOUND IN DASHBOARD!\n\n";
        echo "This means one of these issues:\n";
        echo "1. The API key belongs to a DIFFERENT Resend account\n";
        echo "2. The API key was deleted/regenerated\n";
        echo "3. There's a Resend API bug\n\n";
        echo "SOLUTION: Go to https://resend.com/api-keys and check:\n";
        echo "- Which account are you logged into?\n";
        echo "- Does this API key exist in the list?\n";
        echo "- Try creating a NEW API key\n";
    } else {
        echo "✅ Email found in dashboard!\n";
    }
    
    echo "\n\n📧 CHECK YOUR EMAIL INBOX (japzdiapana@gmail.com)\n";
    echo "If you received the email but it's not in Resend dashboard,\n";
    echo "then the API key is from a different Resend account.\n";
}
