<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\DefenseRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class ValidateEmailSystem extends Command
{
    protected $signature = 'email:validate-system';
    protected $description = 'Comprehensive validation of the entire email notification system';

    public function handle()
    {
        $this->info('╔══════════════════════════════════════════════════════════╗');
        $this->info('║   EMAIL SYSTEM VALIDATION - Production Readiness Check  ║');
        $this->info('╚══════════════════════════════════════════════════════════╝');
        $this->newLine();

        $passed = 0;
        $failed = 0;
        $warnings = 0;

        // Check 1: Environment Variables
        $this->line('1️⃣  Checking environment configuration...');
        if ($this->checkEnvironment()) {
            $passed++;
        } else {
            $failed++;
        }
        $this->newLine();

        // Check 2: Database Tables
        $this->line('2️⃣  Checking database tables...');
        if ($this->checkDatabase()) {
            $passed++;
        } else {
            $failed++;
        }
        $this->newLine();

        // Check 3: Faculty Data
        $this->line('3️⃣  Validating faculty data...');
        $result = $this->checkFaculty();
        if ($result === true) {
            $passed++;
        } elseif ($result === 'warning') {
            $warnings++;
        } else {
            $failed++;
        }
        $this->newLine();

        // Check 4: Email Templates
        $this->line('4️⃣  Checking email templates...');
        if ($this->checkTemplates()) {
            $passed++;
        } else {
            $failed++;
        }
        $this->newLine();

        // Check 5: Queue Configuration
        $this->line('5️⃣  Validating queue configuration...');
        if ($this->checkQueue()) {
            $passed++;
        } else {
            $failed++;
        }
        $this->newLine();

        // Check 6: Name Matching System
        $this->line('6️⃣  Testing name matching system...');
        if ($this->testNameMatching()) {
            $passed++;
        } else {
            $failed++;
        }
        $this->newLine();

        // Final Report
        $this->line('═══════════════════════════════════════════════════════════');
        $this->info('                      VALIDATION SUMMARY                    ');
        $this->line('═══════════════════════════════════════════════════════════');
        $this->newLine();

        $total = $passed + $failed + $warnings;
        $this->table(
            ['Status', 'Count', 'Percentage'],
            [
                ['✅ Passed', $passed, round(($passed / $total) * 100, 1) . '%'],
                ['⚠️  Warnings', $warnings, round(($warnings / $total) * 100, 1) . '%'],
                ['❌ Failed', $failed, round(($failed / $total) * 100, 1) . '%'],
            ]
        );

        $this->newLine();

        if ($failed === 0 && $warnings === 0) {
            $this->info('🎉 EXCELLENT! Email system is production-ready!');
            $this->line('   All checks passed successfully.');
        } elseif ($failed === 0) {
            $this->warn('⚠️  GOOD - Email system is functional but has warnings.');
            $this->line('   Review warnings above and address before production.');
        } else {
            $this->error('❌ CRITICAL - Email system has failures!');
            $this->line('   Fix failed checks before deploying to production.');
        }

        $this->newLine();
        $this->comment('💡 For detailed diagnostics, run: php diagnose_email.php');
        $this->newLine();

        return $failed === 0 ? 0 : 1;
    }

    private function checkEnvironment(): bool
    {
        $required = [
            'MAIL_MAILER' => 'resend',
            'RESEND_API_KEY' => null,
            'MAIL_FROM_ADDRESS' => null,
            'QUEUE_CONNECTION' => 'database',
        ];

        $allGood = true;

        foreach ($required as $key => $expectedValue) {
            $value = env($key);
            
            if ($expectedValue !== null) {
                if ($value === $expectedValue) {
                    $this->line("   ✅ {$key} = {$value}");
                } else {
                    $this->error("   ❌ {$key} should be '{$expectedValue}' but is '{$value}'");
                    $allGood = false;
                }
            } else {
                if ($value) {
                    if ($key === 'RESEND_API_KEY') {
                        $preview = substr($value, 0, 7) . '...' . substr($value, -4);
                        $this->line("   ✅ {$key} = {$preview}");
                    } else {
                        $this->line("   ✅ {$key} = {$value}");
                    }
                } else {
                    $this->error("   ❌ {$key} is not set!");
                    $allGood = false;
                }
            }
        }

        return $allGood;
    }

    private function checkDatabase(): bool
    {
        $tables = ['users', 'defense_requests', 'jobs', 'failed_jobs'];
        $allGood = true;

        foreach ($tables as $table) {
            try {
                DB::table($table)->limit(1)->count();
                $this->line("   ✅ Table '{$table}' exists");
            } catch (\Exception $e) {
                $this->error("   ❌ Table '{$table}' not found!");
                $allGood = false;
            }
        }

        return $allGood;
    }

    private function checkFaculty()
    {
        $faculty = User::where('role', 'Faculty')->get();
        
        if ($faculty->isEmpty()) {
            $this->error('   ❌ No faculty members found in database!');
            return false;
        }

        $this->line("   ✅ Found {$faculty->count()} faculty members");

        $noEmail = $faculty->filter(fn($f) => !$f->email)->count();
        $hasIssues = false;

        foreach ($faculty as $f) {
            if (!$f->email) {
                $this->warn("   ⚠️  {$f->full_name} has no email address");
                $hasIssues = true;
            }
        }

        if ($hasIssues) {
            $this->warn("   💡 Run: php artisan faculty:validate-names --fix");
            return 'warning';
        }

        $this->line("   ✅ All faculty members have email addresses");
        return true;
    }

    private function checkTemplates(): bool
    {
        $templates = [
            'defense-submitted',
            'defense-approved',
            'defense-rejected',
            'defense-scheduled',
        ];

        $allGood = true;
        $basePath = resource_path('views/emails');

        foreach ($templates as $template) {
            $path = "{$basePath}/{$template}.blade.php";
            if (file_exists($path)) {
                $this->line("   ✅ Template '{$template}.blade.php' exists");
            } else {
                $this->error("   ❌ Template '{$template}.blade.php' not found!");
                $allGood = false;
            }
        }

        return $allGood;
    }

    private function checkQueue(): bool
    {
        $allGood = true;

        // Check jobs table
        try {
            $jobCount = DB::table('jobs')->count();
            $this->line("   ✅ Jobs table accessible ({$jobCount} pending)");
        } catch (\Exception $e) {
            $this->error("   ❌ Cannot access jobs table!");
            $allGood = false;
        }

        // Check failed_jobs table
        try {
            $failedCount = DB::table('failed_jobs')->count();
            if ($failedCount > 0) {
                $this->warn("   ⚠️  {$failedCount} failed jobs found");
                $this->warn("   💡 Run: php artisan queue:retry all");
            } else {
                $this->line("   ✅ No failed jobs");
            }
        } catch (\Exception $e) {
            $this->error("   ❌ Cannot access failed_jobs table!");
            $allGood = false;
        }

        return $allGood;
    }

    private function testNameMatching(): bool
    {
        $faculty = User::where('role', 'Faculty')->first();
        
        if (!$faculty) {
            $this->warn('   ⚠️  Cannot test - no faculty members available');
            return true; // Don't fail the test
        }

        $allGood = true;

        // Test 1: Full name with middle
        $fullName = $faculty->full_name;
        $found = User::findByFullName($fullName, 'Faculty')->first();
        if ($found && $found->id === $faculty->id) {
            $this->line("   ✅ Full name match: '{$fullName}'");
        } else {
            $this->error("   ❌ Failed to match full name: '{$fullName}'");
            $allGood = false;
        }

        // Test 2: Name without middle
        if ($faculty->middle_name) {
            $nameWithoutMiddle = $faculty->first_name . ' ' . $faculty->last_name;
            $found = User::findByFullName($nameWithoutMiddle, 'Faculty')->first();
            if ($found && $found->id === $faculty->id) {
                $this->line("   ✅ Name without middle: '{$nameWithoutMiddle}'");
            } else {
                $this->warn("   ⚠️  Could not match without middle name: '{$nameWithoutMiddle}'");
            }
        }

        // Test 3: Case insensitive
        $lowercase = strtolower($fullName);
        $found = User::findByFullName($lowercase, 'Faculty')->first();
        if ($found && $found->id === $faculty->id) {
            $this->line("   ✅ Case insensitive match: '{$lowercase}'");
        } else {
            $this->error("   ❌ Failed case insensitive match: '{$lowercase}'");
            $allGood = false;
        }

        return $allGood;
    }
}
