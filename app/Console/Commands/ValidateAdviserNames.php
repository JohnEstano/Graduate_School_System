<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ValidateAdviserNames extends Command
{
    protected $signature = 'Adviser:validate-names {--fix : Automatically fix common issues}';
    protected $description = 'Validate and optionally fix Adviser member names for email matching';

    public function handle()
    {
        $this->info('🔍 Validating Adviser Names...');
        $this->newLine();

        $Adviser = User::where('role', 'Adviser')->get();

        if ($Adviser->isEmpty()) {
            $this->warn('⚠️  No Adviser members found in the database.');
            return 0;
        }

        $issues = [];
        $fixed = 0;

        foreach ($Adviser as $user) {
            $problems = [];

            // Check for missing email
            if (!$user->email) {
                $problems[] = 'Missing email address';
            }

            // Check for extra whitespace
            if ($user->first_name !== trim($user->first_name)) {
                $problems[] = 'First name has leading/trailing whitespace';
                if ($this->option('fix')) {
                    $user->first_name = trim($user->first_name);
                    $fixed++;
                }
            }

            if ($user->middle_name && $user->middle_name !== trim($user->middle_name)) {
                $problems[] = 'Middle name has leading/trailing whitespace';
                if ($this->option('fix')) {
                    $user->middle_name = trim($user->middle_name);
                    $fixed++;
                }
            }

            if ($user->last_name !== trim($user->last_name)) {
                $problems[] = 'Last name has leading/trailing whitespace';
                if ($this->option('fix')) {
                    $user->last_name = trim($user->last_name);
                    $fixed++;
                }
            }

            // Check for multiple consecutive spaces
            if ($user->first_name && preg_match('/\s{2,}/', $user->first_name)) {
                $problems[] = 'First name has multiple consecutive spaces';
                if ($this->option('fix')) {
                    $user->first_name = preg_replace('/\s+/', ' ', $user->first_name);
                    $fixed++;
                }
            }

            if ($user->middle_name && preg_match('/\s{2,}/', $user->middle_name)) {
                $problems[] = 'Middle name has multiple consecutive spaces';
                if ($this->option('fix')) {
                    $user->middle_name = preg_replace('/\s+/', ' ', $user->middle_name);
                    $fixed++;
                }
            }

            if ($user->last_name && preg_match('/\s{2,}/', $user->last_name)) {
                $problems[] = 'Last name has multiple consecutive spaces';
                if ($this->option('fix')) {
                    $user->last_name = preg_replace('/\s+/', ' ', $user->last_name);
                    $fixed++;
                }
            }

            if (!empty($problems)) {
                $issues[] = [
                    'id' => $user->id,
                    'name' => $user->full_name,
                    'email' => $user->email ?? 'N/A',
                    'problems' => implode(', ', $problems)
                ];

                if ($this->option('fix')) {
                    $user->save();
                }
            }
        }

        if (empty($issues)) {
            $this->info('✅ All Adviser names are properly formatted!');
            $this->newLine();
        } else {
            $this->warn("⚠️  Found {$Adviser->count()} Adviser members, " . count($issues) . " have issues:");
            $this->newLine();

            $this->table(
                ['ID', 'Name', 'Email', 'Issues'],
                array_map(fn($issue) => [
                    $issue['id'],
                    $issue['name'],
                    $issue['email'],
                    $issue['problems']
                ], $issues)
            );

            if ($this->option('fix')) {
                $this->info("✅ Fixed {$fixed} issues!");
            } else {
                $this->newLine();
                $this->comment('💡 Run with --fix to automatically correct these issues:');
                $this->line('   php artisan Adviser:validate-names --fix');
            }
        }

        $this->newLine();
        $this->info('📋 Adviser Summary:');
        $this->table(
            ['ID', 'Full Name', 'Email'],
            $Adviser->map(fn($f) => [
                $f->id,
                $f->full_name,
                $f->email ?? '❌ NO EMAIL'
            ])->toArray()
        );

        return 0;
    }
}
