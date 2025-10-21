<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\DefenseRequest;
use App\Mail\DefenseRequestSubmitted;
use Illuminate\Support\Facades\Mail;

echo "Finding test data...\n";

$adviser = User::where('role', 'Faculty')->first();
$dr = DefenseRequest::latest()->first();

if ($adviser && $dr) {
    echo "Sending test email to: {$adviser->email}\n";
    echo "Adviser: {$adviser->full_name}\n";
    echo "Defense Request: {$dr->thesis_title}\n";
    
    try {
        Mail::to($adviser->email)->send(new DefenseRequestSubmitted($dr, $adviser));
        echo "✅ Email sent successfully!\n";
    } catch (Exception $e) {
        echo "❌ Error: {$e->getMessage()}\n";
        echo "Trace: {$e->getTraceAsString()}\n";
    }
} else {
    echo "❌ No test data found\n";
    echo "Adviser: " . ($adviser ? 'Found' : 'Not found') . "\n";
    echo "Defense Request: " . ($dr ? 'Found' : 'Not found') . "\n";
}
