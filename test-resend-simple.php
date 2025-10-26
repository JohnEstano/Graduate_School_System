<?php

// Test with simpler email
$apiKey = 're_JR3GCkYg_ExTwUHxNwmrBTKSJ2DwWiEbR';

echo "Test 1: Simple text email\n";
echo "==========================\n";

$data1 = [
    'from' => 'Graduate School System <noreply@diapana.dev>',
    'to' => ['japzdiapana@gmail.com'],
    'subject' => 'Test Email - Simple',
    'text' => 'This is a simple test email.',
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

if ($httpCode == 200) {
    echo "✅ Simple email sent successfully!\n\n";
    
    echo "Test 2: HTML email with inline styles\n";
    echo "======================================\n";
    
    $data2 = [
        'from' => 'Graduate School System <noreply@diapana.dev>',
        'to' => ['japzdiapana@gmail.com'],
        'subject' => 'Test Email - HTML',
        'html' => '<!DOCTYPE html><html><head></head><body style="font-family: Arial, sans-serif;"><h1 style="color: #dc2626;">Test Email</h1><p>This is a test with HTML and styles.</p></body></html>',
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
    echo "Response: $response\n";
    
    if ($httpCode == 200) {
        echo "✅ HTML email sent successfully!\n";
        echo "\n✅✅✅ Resend is working perfectly! The issue must be in the Laravel configuration.\n";
    }
} else {
    echo "❌ Failed. Error details:\n";
    $error = json_decode($response, true);
    print_r($error);
}
