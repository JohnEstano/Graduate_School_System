<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\AdviserInvitation;

echo "Testing Resend Email Configuration\n";
echo "===================================\n\n";

echo "Mail Mailer: " . config('mail.default') . "\n";
echo "From Address: " . config('mail.from.address') . "\n";
echo "From Name: " . config('mail.from.name') . "\n";
echo "Resend API Key: " . substr(config('services.resend.key'), 0, 10) . "...\n\n";

try {
    echo "Attempting to send test email...\n";
    
    Mail::to('japzdiapana@gmail.com')->send(
        new AdviserInvitation(
            'Test Adviser Name',
            'Test Coordinator Name'
        )
    );
    
    echo "✅ Email sent successfully!\n";
    
} catch (\Exception $e) {
    echo "❌ Error sending email:\n";
    echo "Error Message: " . $e->getMessage() . "\n";
    echo "Error Class: " . get_class($e) . "\n";
    echo "\nFull Stack Trace:\n";
    echo $e->getTraceAsString() . "\n";
}
