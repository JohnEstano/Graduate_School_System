<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Testing send to ANY email address (Production Mode Test)\n";
echo "==========================================================\n\n";

$apiKey = config('services.resend.key');

// Test sending to a different email
$data = [
    'from' => 'Graduate School System <noreply@diapana.dev>',
    'to' => ['japzdiapana@gmail.com'], // Different email
    'subject' => 'Production Test - Graduate School System',
    'html' => '<h1>Success!</h1><p>Your Resend API is working in production mode with full access.</p>',
];

echo "Sending to: japzdiapana@gmail.com\n";
echo "From: noreply@diapana.dev\n\n";

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
echo "Response: $response\n\n";

if ($httpCode == 200) {
    echo "✅✅✅ SUCCESS! API key has FULL ACCESS!\n";
    echo "You can send to ANY email address.\n";
    echo "\n🎉 Your invitation system is ready for production!\n";
} else {
    echo "❌ Restricted. Can only send to verified email.\n";
    $error = json_decode($response, true);
    if (isset($error['message'])) {
        echo "Message: " . $error['message'] . "\n";
    }
}
