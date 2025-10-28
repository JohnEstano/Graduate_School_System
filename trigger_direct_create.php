<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\DefenseRequest;
use App\Models\AaPaymentVerification;

echo "🔥 DIRECT CREATE TRIGGER\n";
echo "========================\n\n";

// Find all ready_for_finance defenses
$readyDefenses = AaPaymentVerification::where('status', 'ready_for_finance')
    ->with('defenseRequest')
    ->get();

echo "Found " . $readyDefenses->count() . " defenses with ready_for_finance status\n\n";

foreach ($readyDefenses as $verification) {
    $defense = $verification->defenseRequest;
    
    if (!$defense) {
        echo "⚠️  Verification #{$verification->id} has no defense request\n";
        continue;
    }
    
    echo "Processing Defense #{$defense->id}\n";
    echo "  Student: {$defense->first_name} {$defense->last_name}\n";
    echo "  Program: {$defense->program}\n";
    echo "  Defense Type: {$defense->defense_type}\n";
    
    // Get the controller and trigger the direct create
    $controller = new \App\Http\Controllers\AA\PaymentVerificationController();
    
    // Use reflection to call the private method
    $reflection = new ReflectionClass($controller);
    $method = $reflection->getMethod('createStudentAndPanelistRecords');
    $method->setAccessible(true);
    
    try {
        $method->invoke($controller, $defense);
        echo "  ✅ DIRECT CREATE SUCCESSFUL\n\n";
    } catch (Exception $e) {
        echo "  ❌ FAILED: " . $e->getMessage() . "\n\n";
    }
}

echo "\n🎯 Check your logs at storage/logs/laravel.log\n";
echo "🌐 Check your routes:\n";
echo "   - http://127.0.0.1:8000/honorarium\n";
echo "   - http://127.0.0.1:8000/student-records\n";
