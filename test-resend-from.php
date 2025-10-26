<?php

// Test different "from" formats
$apiKey = 're_JR3GCkYg_ExTwUHxNwmrBTKSJ2DwWiEbR';

echo "Test 1: From email only (no name)\n";
echo "===================================\n";

$data1 = [
    'from' => 'noreply@diapana.dev',
    'to' => ['japzdiapana@gmail.com'],
    'subject' => 'Test - No Name',
    'text' => 'Test with from email only',
];

$ch = curl_init('https://api.resend.com/emails');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data1));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

if ($httpCode != 200) {
    echo "Test 2: Checking if sending domain matches API\n";
    echo "===============================================\n";
    
    //Try sending from a different verified email if exists
    $data2 = [
        'from' => 'onboarding@resend.dev', // Resend's default sender
        'to' => ['japzdiapana@gmail.com'],
        'subject' => 'Test - Resend Default',
        'text' => 'Test with Resend default sender',
    ];
    
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data2));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: $httpCode\n";
    echo "Response: $response\n\n";
    
    if ($httpCode == 200) {
        echo "✅ SUCCESS! The issue is with the custom domain configuration.\n";
        echo "The API key can only send from certain domains.\n";
    }
} else {
    echo "✅ Email sent successfully!\n";
}
