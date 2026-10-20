<?php

// Diagnostic script to check why emails aren't sending
// Run with: php diagnose_email.php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== EMAIL DIAGNOSTIC TOOL ===\n\n";

// Check latest defense request
echo "1. Checking latest defense request...\n";
$latest = DefenseRequest::latest()->first();
if (!$latest) {
    echo "   ❌ No defense requests found!\n";
    echo "   Please submit a defense request first.\n\n";
    exit;
}

echo "   ✅ Found defense request #{$latest->id}\n";
echo "   Student: {$latest->first_name} {$latest->last_name}\n";
echo "   Defense Adviser: '{$latest->defense_adviser}'\n";
echo "   Assigned Adviser ID: " . ($latest->adviser_user_id ?? 'NULL') . "\n\n";

// Check if adviser was found
echo "2. Checking if adviser exists in database...\n";
$adviserName = $latest->defense_adviser;
echo "   Looking for: {$adviserName}\n";

// Try to find adviser with full name (including middle name) or without
$adviserUser = User::where('role', 'Adviser')
    ->where(function ($query) use ($adviserName) {
        // Try with middle name: "FirstName MiddleName LastName"
        $query->whereRaw('LOWER(CONCAT(first_name," ",COALESCE(middle_name,"")," ",last_name)) = ?', [strtolower($adviserName)])
            // Or without middle name: "FirstName LastName"
            ->orWhereRaw('LOWER(CONCAT(first_name," ",last_name)) = ?', [strtolower($adviserName)])
            // Or trim extra spaces if middle name is empty
            ->orWhereRaw('LOWER(TRIM(CONCAT(first_name," ",COALESCE(middle_name,"")," ",last_name))) = ?', [strtolower($adviserName)]);
    })
    ->first();

if (!$adviserUser) {
    echo "   ❌ Adviser NOT FOUND with exact name match!\n\n";

    echo "3. Available Adviser users:\n";
    $Adviser = User::where('role', 'Adviser')->get(['id', 'first_name', 'last_name', 'email']);
    foreach ($Adviser as $f) {
        $fullName = "{$f->first_name} {$f->last_name}";
        echo "   - {$fullName} (email: {$f->email})\n";
    }

    echo "\n";
    echo "   🔧 FIX: The defense adviser name must EXACTLY match a Adviser user's name.\n";
    echo "   Current adviser name: '{$adviserName}'\n";
    echo "   Try using one of the names above exactly as shown.\n\n";

    exit;
}

echo "   ✅ Adviser found: {$adviserUser->first_name} {$adviserUser->last_name}\n";
echo "   Email: {$adviserUser->email}\n";
echo "   User ID: {$adviserUser->id}\n\n";

// Check if email address exists
echo "3. Checking if adviser has an email address...\n";
if (!$adviserUser->email) {
    echo "   ❌ Adviser has NO EMAIL ADDRESS!\n";
    echo "   🔧 FIX: Add an email address to this adviser's account.\n\n";
    exit;
}
echo "   ✅ Email address exists: {$adviserUser->email}\n\n";

// Check queued jobs
echo "4. Checking email queue...\n";
$jobsCount = DB::table('jobs')->count();
echo "   Pending jobs in queue: {$jobsCount}\n";

if ($jobsCount > 0) {
    echo "   ℹ️ There are jobs waiting to be processed.\n";
    echo "   Make sure queue worker is running: php artisan queue:work\n";

    $jobs = DB::table('jobs')->get();
    foreach ($jobs as $job) {
        $payload = json_decode($job->payload, true);
        $displayName = $payload['displayName'] ?? 'Unknown';
        echo "   - Job: {$displayName} (Attempts: {$job->attempts})\n";
    }
} else {
    echo "   ℹ️ No jobs in queue (either processed or not created).\n";
}
echo "\n";

// Check failed jobs
echo "5. Checking failed jobs...\n";
$failedCount = DB::table('failed_jobs')->count();
if ($failedCount > 0) {
    echo "   ❌ Found {$failedCount} failed job(s)!\n";
    $failed = DB::table('failed_jobs')->latest()->first();
    echo "   Last failure: {$failed->exception}\n";
    echo "   🔧 FIX: Run 'php artisan queue:retry all' to retry failed jobs.\n";
} else {
    echo "   ✅ No failed jobs.\n";
}
echo "\n";

// Check Resend configuration
echo "6. Checking email configuration...\n";
$mailer = env('MAIL_MAILER');
$apiKey = env('RESEND_API_KEY');
$fromAddress = env('MAIL_FROM_ADDRESS');

echo "   Mail driver: {$mailer}\n";
echo "   From address: {$fromAddress}\n";

if ($mailer === 'resend') {
    if (!$apiKey || $apiKey === 'your_resend_api_key_here') {
        echo "   ❌ RESEND_API_KEY not configured!\n";
        echo "   🔧 FIX: Update RESEND_API_KEY in .env file.\n";
    } else {
        $keyPreview = substr($apiKey, 0, 7) . '...' . substr($apiKey, -4);
        echo "   ✅ Resend API key configured: {$keyPreview}\n";
    }
} else {
    echo "   ⚠️ Mail driver is '{$mailer}' (not Resend)\n";
}
echo "\n";

// Final summary
echo "=== SUMMARY ===\n";
if ($adviserUser && $adviserUser->email) {
    echo "✅ Adviser found with email address\n";
    echo "✅ Email integration is configured\n";
    echo "\n";
    echo "📧 Email SHOULD have been sent to: {$adviserUser->email}\n";
    echo "\n";
    echo "If email was not received, check:\n";
    echo "1. Queue worker is running: php artisan queue:work\n";
    echo "2. Check spam/junk folder\n";
    echo "3. Verify Resend dashboard: https://resend.com/emails\n";
    echo "4. Check Laravel logs: storage/logs/laravel.log\n";
} else {
    echo "❌ Email NOT sent because adviser or email missing\n";
}

echo "\n";
