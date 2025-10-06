<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class TestUicEmailLookupCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'test:uic-email-lookup {email?}';

    /**
     * The console command description.
     */
    protected $description = 'Test UIC email lookup and authentication logic';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email') ?? 'gdiapana_230000001047@uic.edu.ph';
        
        $this->info("🔍 TESTING UIC EMAIL LOOKUP");
        $this->info("Email to test: {$email}");
        $this->line("");
        
        // Test 1: Direct email lookup
        $this->info("1. Direct email lookup:");
        $user = User::where('email', $email)->first();
        if ($user) {
            $this->line("   ✅ Found user: {$user->display_name} (ID: {$user->school_id})");
            $this->line("   📧 Email: {$user->email}");
            $this->line("   👤 Role: {$user->role}");
        } else {
            $this->line("   ❌ No user found with exact email match");
        }
        
        $this->line("");
        
        // Test 2: Extract student ID from UIC email
        $this->info("2. Extract student ID from UIC email:");
        if (str_contains($email, '_') && str_contains($email, '@uic.edu.ph')) {
            $parts = explode('_', explode('@', $email)[0]);
            if (count($parts) >= 2) {
                $possibleStudentId = $parts[1];
                $this->line("   📝 Extracted student ID: {$possibleStudentId}");
                
                $userByStudentId = User::where('school_id', $possibleStudentId)->first();
                if ($userByStudentId) {
                    $this->line("   ✅ Found user by student ID: {$userByStudentId->display_name}");
                    $this->line("   📧 Current email: {$userByStudentId->email}");
                    
                    // Check if emails match
                    if ($userByStudentId->email === $email) {
                        $this->line("   ✅ Email matches! Authentication would succeed.");
                    } else {
                        $this->line("   ⚠️  Email mismatch - user might need email update");
                    }
                } else {
                    $this->line("   ❌ No user found with student ID: {$possibleStudentId}");
                }
            } else {
                $this->line("   ❌ Could not extract student ID from email format");
            }
        } else {
            $this->line("   ⚠️  Email doesn't match UIC format (name_id@uic.edu.ph)");
        }
        
        $this->line("");
        
        // Test 3: List all students with UIC emails
        $this->info("3. Current students with UIC email format:");
        $uicStudents = User::where('role', 'Student')
                          ->where('email', 'LIKE', '%@uic.edu.ph')
                          ->where('email', 'LIKE', '%_%')
                          ->limit(5)
                          ->get();
                          
        foreach ($uicStudents as $student) {
            $this->line("   • {$student->display_name} → {$student->email}");
        }
        
        if ($uicStudents->isEmpty()) {
            $this->line("   ❌ No students found with UIC email format");
        }
        
        $this->line("");
        $this->info("🎯 RECOMMENDATION:");
        
        if ($user && $user->email === $email) {
            $this->line("✅ Authentication for {$email} should work properly!");
            $this->line("✅ Dashboard will show: Hi, {$user->display_name}");
        } else {
            $this->line("⚠️  Authentication might fail - check email format or user data");
        }
    }
}