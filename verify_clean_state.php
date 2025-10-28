<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;
use App\Models\AaPaymentVerification;
use App\Models\HonorariumPayment;
use App\Models\StudentRecord;
use App\Models\PanelistRecord;
use App\Models\PaymentRecord;

echo "=== CURRENT STATE ===\n\n";

echo "1. Defense Requests with 'ready_for_finance' status:\n";
$defenseRequests = DefenseRequest::whereHas('aaVerification', function($q) {
    $q->where('status', 'ready_for_finance');
})->with('aaVerification')->get();

echo "   Total: {$defenseRequests->count()}\n";
foreach ($defenseRequests as $dr) {
    echo "   - ID: {$dr->id}, Program: {$dr->program}, Student: {$dr->first_name} {$dr->last_name}\n";
    echo "     Adviser: {$dr->defense_adviser}\n";
    echo "     Chair: {$dr->defense_chairperson}\n";
    echo "     Panel 1: {$dr->defense_panelist1}\n";
}

echo "\n2. HonorariumPayments:\n";
$honorariumPayments = HonorariumPayment::all();
echo "   Total: {$honorariumPayments->count()}\n";

echo "\n3. StudentRecords:\n";
$studentRecords = StudentRecord::all();
echo "   Total: {$studentRecords->count()}\n";

echo "\n4. PanelistRecords:\n";
$panelistRecords = PanelistRecord::all();
echo "   Total: {$panelistRecords->count()}\n";

echo "\n5. PaymentRecords:\n";
$paymentRecords = PaymentRecord::all();
echo "   Total: {$paymentRecords->count()}\n";

echo "\n=== READY FOR TESTING ===\n";
echo "The observer should automatically create records when AA status changes to 'ready_for_finance'\n";
echo "OR you can manually trigger sync for existing defenses by changing their AA status.\n\n";
