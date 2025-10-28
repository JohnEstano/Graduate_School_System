<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;

echo "\n=== VERIFYING DEFENSE REQUEST AMOUNTS ===\n\n";

$totalRequests = DefenseRequest::count();
echo "Total Defense Requests: {$totalRequests}\n\n";

if ($totalRequests === 0) {
    echo "No defense requests found in the database.\n";
    echo "✅ When new defense requests are created, amounts will be automatically calculated.\n\n";
    exit(0);
}

$requests = DefenseRequest::select('id', 'first_name', 'last_name', 'program', 'defense_type', 'amount')
    ->orderBy('id', 'desc')
    ->limit(10)
    ->get();

echo "Recent Defense Requests (Last 10):\n";
echo str_repeat('-', 100) . "\n";
echo str_pad('ID', 5) . str_pad('Student Name', 30) . str_pad('Program', 35) . str_pad('Defense Type', 15) . "Amount\n";
echo str_repeat('-', 100) . "\n";

foreach ($requests as $r) {
    $studentName = trim($r->first_name . ' ' . $r->last_name);
    $amountDisplay = $r->amount ? '₱' . number_format($r->amount, 2) : 'Not Set';
    
    echo str_pad($r->id, 5) . 
         str_pad(substr($studentName, 0, 28), 30) . 
         str_pad(substr($r->program, 0, 33), 35) . 
         str_pad($r->defense_type, 15) . 
         $amountDisplay . "\n";
}

echo str_repeat('-', 100) . "\n\n";

// Count requests with and without amounts
$withAmount = DefenseRequest::whereNotNull('amount')->where('amount', '>', 0)->count();
$withoutAmount = DefenseRequest::whereNull('amount')->orWhere('amount', 0)->count();

echo "Summary:\n";
echo "  ✅ With Amount: {$withAmount}\n";
echo "  ⚠️  Without Amount: {$withoutAmount}\n\n";

if ($withoutAmount > 0) {
    echo "💡 Run 'php update_defense_amounts.php' to populate missing amounts.\n\n";
}
