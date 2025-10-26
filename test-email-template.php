<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Testing Email Template Rendering\n";
echo "==================================\n\n";

try {
    // Create the mailable
    $mailable = new \App\Mail\AdviserInvitation(
        'Dr. Juan Dela Cruz',
        'Dr. Maria Santos'
    );
    
    echo "1. Mailable created successfully ✅\n\n";
    
    // Try to render the email
    echo "2. Rendering email template...\n";
    
    $renderedContent = $mailable->render();
    
    echo "   ✅ Template rendered successfully!\n";
    echo "   Content length: " . strlen($renderedContent) . " bytes\n\n";
    
    // Check if template has critical elements
    echo "3. Checking template content:\n";
    
    $checks = [
        'DOCTYPE' => strpos($renderedContent, '<!DOCTYPE') !== false,
        'Graduate School' => strpos($renderedContent, 'Graduate School') !== false,
        'Adviser Name' => strpos($renderedContent, 'Dr. Juan Dela Cruz') !== false,
        'Coordinator Name' => strpos($renderedContent, 'Dr. Maria Santos') !== false,
        'Login Button' => strpos($renderedContent, 'Log In') !== false || strpos($renderedContent, 'Login') !== false,
        'Email Styles' => strpos($renderedContent, '<style>') !== false,
    ];
    
    foreach ($checks as $check => $passed) {
        echo "   " . ($passed ? '✅' : '❌') . " $check\n";
    }
    
    echo "\n4. Saving rendered template to file for inspection...\n";
    file_put_contents('test-email-template.html', $renderedContent);
    echo "   ✅ Saved to: test-email-template.html\n";
    echo "   You can open this file in your browser to see how the email looks\n\n";
    
    // Now try sending with the rendered template
    echo "5. Testing actual email send:\n";
    
    $apiKey = config('services.resend.key');
    
    $data = [
        'from' => 'Graduate School System <noreply@diapana.dev>',
        'to' => ['japzdiapana@gmail.com'],
        'subject' => 'Template Test - ' . date('H:i:s'),
        'html' => $renderedContent,
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
    echo "   Response: $response\n\n";
    
    if ($httpCode == 200) {
        echo "   ✅ Email with template sent successfully!\n";
        echo "\n🎉 The template is working correctly!\n";
    } else {
        echo "   ❌ Failed to send\n";
        $error = json_decode($response, true);
        if (isset($error['message'])) {
            echo "   Error: " . $error['message'] . "\n";
        }
    }
    
} catch (\Exception $e) {
    echo "❌ ERROR:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString() . "\n";
}
