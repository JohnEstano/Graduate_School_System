<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== COMPLETE RESEND DIAGNOSTIC ===\n\n";

// 1. Check configuration
echo "1. CONFIGURATION CHECK:\n";
echo "   Mail Mailer: " . config('mail.default') . "\n";
echo "   From Address: " . config('mail.from.address') . "\n";
echo "   From Name: " . config('mail.from.name') . "\n";
echo "   Resend API Key: " . config('services.resend.key') . "\n";
echo "   API Key Length: " . strlen(config('services.resend.key')) . "\n\n";

// 2. Test API key directly with correct format
echo "2. DIRECT API TEST (Correct Format):\n";

$apiKey = config('services.resend.key');
$fromAddress = config('mail.from.address');
$fromName = config('mail.from.name');

$data = [
    'from' => $fromName . ' <' . $fromAddress . '>',
    'to' => ['gdiapana_230000001047@uic.edu.ph'], // Your email first
    'subject' => 'Test Email - Diagnostic',
    'html' => '<h1>Test Email</h1><p>This is a diagnostic test from the Graduate School System.</p>',
];

echo "   Sending to: " . json_encode($data['to']) . "\n";
echo "   From: " . $data['from'] . "\n";
echo "   Payload: " . json_encode($data, JSON_PRETTY_PRINT) . "\n\n";

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
$curlError = curl_error($ch);
curl_close($ch);

echo "   HTTP Code: $httpCode\n";
echo "   Response: $response\n";
if ($curlError) {
    echo "   CURL Error: $curlError\n";
}

if ($httpCode == 200) {
    echo "   ✅ SUCCESS! Email sent via direct API\n\n";
    
    // 3. Now test with Laravel Mail
    echo "3. LARAVEL MAIL TEST:\n";
    
    try {
        \Illuminate\Support\Facades\Mail::to('gdiapana_230000001047@uic.edu.ph')->send(
            new \App\Mail\AdviserInvitation('Test Adviser', 'Test Coordinator')
        );
        
        echo "   ✅ SUCCESS! Laravel Mail sent successfully\n";
        
    } catch (\Exception $e) {
        echo "   ❌ FAILED!\n";
        echo "   Error: " . $e->getMessage() . "\n";
        echo "   Class: " . get_class($e) . "\n";
        echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    }
    
} else {
    echo "   ❌ FAILED!\n";
    $error = json_decode($response, true);
    if (isset($error['message'])) {
        echo "   Error Message: " . $error['message'] . "\n";
    }
    if (isset($error['name'])) {
        echo "   Error Name: " . $error['name'] . "\n";
    }
}

echo "\n=== END DIAGNOSTIC ===\n";
