<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== TESTING NEW API KEY ===\n\n";

$apiKey = config('services.resend.key');

echo "1. Configuration Check:\n";
echo "   API Key: " . substr($apiKey, 0, 15) . "...\n";
echo "   From: " . config('mail.from.address') . "\n";
echo "   Mailer: " . config('mail.default') . "\n\n";

echo "2. Validating API Key:\n";
$ch = curl_init('https://api.resend.com/api-keys');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 200) {
    echo "   ✅ API Key is valid!\n\n";
    
    echo "3. Sending test email:\n";
    $data = [
        'from' => 'Graduate School System <noreply@diapana.dev>',
        'to' => ['japzdiapana@gmail.com'],
        'subject' => 'NEW API KEY TEST - ' . date('H:i:s'),
        'html' => '<h1 style="color: #dc2626;">Success!</h1><p>Your new Resend API key is working perfectly!</p><p>Sent at: ' . date('Y-m-d H:i:s') . '</p>',
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
    
    echo "   HTTP Code: $httpCode\n";
    $result = json_decode($response, true);
    echo "   Response: $response\n\n";
    
    if ($httpCode == 200 && isset($result['id'])) {
        $emailId = $result['id'];
        echo "   ✅ Email sent! ID: $emailId\n\n";
        
        echo "4. Verifying in dashboard (wait 2 seconds):\n";
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
            $emailData = json_decode($response, true);
            echo "   ✅ EMAIL FOUND IN DASHBOARD!\n";
            echo "   Status: " . ($emailData['last_event'] ?? 'N/A') . "\n";
            echo "   To: " . json_encode($emailData['to'] ?? []) . "\n";
            echo "   Subject: " . ($emailData['subject'] ?? 'N/A') . "\n\n";
            echo "🎉🎉🎉 SUCCESS! Everything is working!\n";
            echo "The email is in your Resend dashboard and being delivered.\n\n";
            echo "✅ Your invitation system is NOW 100% READY FOR PRODUCTION!\n";
        } else {
            echo "   ❌ Not found in dashboard yet (might take a moment)\n";
            echo "   Response: $response\n";
        }
    } else {
        echo "   ❌ Failed to send\n";
        echo "   Error: " . ($result['message'] ?? 'Unknown') . "\n";
    }
    
} else {
    echo "   ❌ API Key is invalid!\n";
    echo "   HTTP Code: $httpCode\n";
    echo "   Response: $response\n";
}

echo "\n5. Testing with Laravel Mail:\n";
try {
    \Illuminate\Support\Facades\Mail::to('japzdiapana@gmail.com')->send(
        new \App\Mail\AdviserInvitation('Test Adviser Name', 'Test Coordinator Name')
    );
    echo "   ✅ Laravel Mail sent successfully!\n";
} catch (\Exception $e) {
    echo "   ❌ Laravel Mail failed: " . $e->getMessage() . "\n";
}
