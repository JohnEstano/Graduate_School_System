<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Http\Requests\Auth\LoginRequestV2;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DebugLoginProcessCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'debug:login-process {student_id?}';

    /**
     * The console command description.
     */
    protected $description = 'Debug the login process to see why users aren\'t being saved';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $studentId = $this->argument('student_id') ?? '230000001047';
        
        $this->info("🔍 DEBUGGING LOGIN PROCESS");
        $this->info("Student ID: {$studentId}");
        $this->line("");
        
        // Check if user already exists
        $this->info("1. Checking existing user...");
        $existingUser = User::where('school_id', $studentId)
                           ->orWhere('student_number', $studentId)
                           ->orWhere('email', $studentId.'@uic.edu.ph')
                           ->orWhere('email', 'LIKE', '%_'.$studentId.'@uic.edu.ph')
                           ->first();
                           
        if ($existingUser) {
            $this->line("   ✅ Found existing user: {$existingUser->email}");
            $this->line("   📝 Name: {$existingUser->display_name}");
            $this->line("   👤 Role: {$existingUser->role}");
        } else {
            $this->line("   ❌ No existing user found");
        }
        
        $this->line("");
        
        // Check database connection
        $this->info("2. Testing database connection...");
        try {
            $userCount = User::count();
            $this->line("   ✅ Database connected - Total users: {$userCount}");
        } catch (\Exception $e) {
            $this->error("   ❌ Database error: " . $e->getMessage());
            return;
        }
        
        $this->line("");
        
        // Check if LoginRequestV2 class exists and methods
        $this->info("3. Checking LoginRequestV2 class...");
        if (class_exists(LoginRequestV2::class)) {
            $this->line("   ✅ LoginRequestV2 class exists");
            
            $reflection = new \ReflectionClass(LoginRequestV2::class);
            if ($reflection->hasMethod('authenticate')) {
                $this->line("   ✅ authenticate() method exists");
            } else {
                $this->error("   ❌ authenticate() method missing!");
            }
        } else {
            $this->error("   ❌ LoginRequestV2 class not found!");
        }
        
        $this->line("");
        
        // Check if LegacyPortalClient is available
        $this->info("4. Checking legacy portal client...");
        try {
            $legacyClient = app(\App\Services\LegacyPortalClient::class);
            $this->line("   ✅ LegacyPortalClient available");
        } catch (\Exception $e) {
            $this->error("   ❌ LegacyPortalClient error: " . $e->getMessage());
        }
        
        $this->line("");
        
        // Check environment configuration
        $this->info("5. Checking environment config...");
        $debugRole = env('DEBUG_V2_DEFAULT_ROLE', 'Student');
        $this->line("   📝 DEBUG_V2_DEFAULT_ROLE: {$debugRole}");
        
        $this->line("");
        
        // Test creating a user manually
        $this->info("6. Testing manual user creation...");
        try {
            $testUser = User::create([
                'first_name' => 'Test',
                'last_name' => 'User',
                'email' => "test_{$studentId}@uic.edu.ph",
                'student_number' => $studentId,
                'school_id' => $studentId,
                'password' => bcrypt('test123'),
                'role' => 'Student',
            ]);
            
            $this->line("   ✅ Manual user creation successful");
            $this->line("   📝 Created user ID: {$testUser->id}");
            
            // Clean up
            $testUser->delete();
            $this->line("   🧹 Test user deleted");
            
        } catch (\Exception $e) {
            $this->error("   ❌ Manual user creation failed: " . $e->getMessage());
        }
        
        $this->line("");
        
        // Check if the issue might be in the login route
        $this->info("7. Suggestions for debugging actual login:");
        $this->line("   • Check if login form is posting to correct route");
        $this->line("   • Verify CSRF token is valid");
        $this->line("   • Check if validation is passing");
        $this->line("   • Look at Laravel logs during login attempt");
        $this->line("   • Add logging to LoginRequestV2::authenticate()");
        
        $this->line("");
        $this->info("💡 To debug actual login attempt:");
        $this->line("   1. Add Log::info() statements in LoginRequestV2::authenticate()");
        $this->line("   2. Attempt login via browser");
        $this->line("   3. Check storage/logs/laravel.log");
        $this->line("   4. Run: tail -f storage/logs/laravel.log");
    }
}