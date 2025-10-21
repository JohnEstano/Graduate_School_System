<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TestStudentLoginFlowCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'test:student-login-flow {student_id?}';

    /**
     * The console command description.
     */
    protected $description = 'Test student login flow and UIC email generation';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $studentId = $this->argument('student_id') ?? '999000001';
        
        $this->info("🧪 TESTING STUDENT LOGIN FLOW");
        $this->info("Student ID: {$studentId}");
        $this->line("");
        
        // Step 1: Simulate new student creation (what happens during login)
        $this->info("1. Simulating new student creation during login...");
        
        // Check if student already exists
        $existingUser = User::where('school_id', $studentId)->first();
        if ($existingUser) {
            $this->line("   ⚠️  Student {$studentId} already exists: {$existingUser->email}");
            $this->line("   🗑️  Deleting existing record for clean test...");
            $existingUser->delete();
        }
        
        // Create user as LoginRequestV2 would
        $user = User::create([
            'email' => $studentId . '@uic.edu.ph', // Initial email format
            'student_number' => $studentId,
            'school_id' => $studentId,
            'password' => Hash::make('testpassword'),
            'role' => 'Student',
            'first_name' => 'Test',
            'last_name' => 'Student',
        ]);
        
        $this->line("   ✅ Created user: {$user->email}");
        
        // Step 2: Simulate profile enrichment (what would happen after legacy auth)
        $this->info("2. Simulating profile enrichment...");
        
        // Update with sample data that would come from legacy system
        $user->update([
            'first_name' => 'JOHN',        // Legacy system returns ALL CAPS
            'middle_name' => 'CARLOS',     // Legacy system returns ALL CAPS  
            'last_name' => 'DELA CRUZ',    // Legacy system returns ALL CAPS
        ]);
        
        $this->line("   ✅ Updated with legacy data (ALL CAPS names)");
        $this->line("   📝 Before formatting: {$user->first_name} {$user->middle_name} {$user->last_name}");
        
        // Step 3: Apply proper case formatting (what our enhanced enricher does)
        $user->update([
            'first_name' => mb_convert_case(strtolower($user->first_name), MB_CASE_TITLE, 'UTF-8'),
            'middle_name' => mb_convert_case(strtolower($user->middle_name), MB_CASE_TITLE, 'UTF-8'),
            'last_name' => mb_convert_case(strtolower($user->last_name), MB_CASE_TITLE, 'UTF-8'),
        ]);
        
        $this->line("   ✅ Applied proper case formatting");
        $this->line("   📝 After formatting: {$user->first_name} {$user->middle_name} {$user->last_name}");
        
        // Step 4: Generate and update UIC email
        $this->info("3. Generating UIC email format...");
        
        $uicEmail = $user->generateUicEmail();
        $this->line("   📧 Generated UIC email: {$uicEmail}");
        
        // Check if email already exists
        $existingEmail = User::where('email', $uicEmail)->where('id', '!=', $user->id)->first();
        if (!$existingEmail) {
            $user->update(['email' => $uicEmail]);
            $this->line("   ✅ Updated user email to UIC format");
        } else {
            $this->line("   ⚠️  UIC email already exists, keeping current email");
        }
        
        // Step 5: Test dashboard display name
        $this->info("4. Testing dashboard display...");
        
        $displayName = $user->display_name;
        $this->line("   👤 Display name: {$displayName}");
        $this->line("   💬 Dashboard greeting: Hi, {$displayName}");
        
        // Step 6: Verify authentication lookup
        $this->info("5. Testing authentication lookup...");
        
        // Test lookup by student ID
        $foundById = User::where('school_id', $studentId)->first();
        $this->line("   🔍 Lookup by student ID: " . ($foundById ? "✅ Found" : "❌ Not found"));
        
        // Test lookup by UIC email
        $foundByEmail = User::where('email', $uicEmail)->first();
        $this->line("   🔍 Lookup by UIC email: " . ($foundByEmail ? "✅ Found" : "❌ Not found"));
        
        // Test UIC email parsing
        if (str_contains($uicEmail, '_') && str_contains($uicEmail, '@uic.edu.ph')) {
            $parts = explode('_', explode('@', $uicEmail)[0]);
            if (count($parts) >= 2) {
                $extractedId = $parts[1];
                $this->line("   🔍 Extract ID from email: {$extractedId} " . ($extractedId === $studentId ? "✅ Match" : "❌ Mismatch"));
            }
        }
        
        $this->line("");
        $this->info("📊 FINAL RESULTS:");
        $this->line("   • Student ID: {$user->school_id}");
        $this->line("   • Email: {$user->email}");
        $this->line("   • Display Name: {$user->display_name}");
        $this->line("   • Role: {$user->role}");
        
        if ($foundById && $foundByEmail && $user->email === $uicEmail) {
            $this->info("🎉 SUCCESS: Student login flow should work properly!");
        } else {
            $this->error("❌ ISSUES: Login flow has problems that need fixing");
        }
        
        // Clean up test data
        $this->line("");
        $this->info("🧹 Cleaning up test data...");
        $user->delete();
        $this->line("✅ Test user deleted");
    }
}