<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class UpdateStudentEmailsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Updating student emails to UIC format and fixing name capitalization...');
        
        // Get all students
        $students = User::where('role', 'Student')->get();
        
        $this->command->info("Found {$students->count()} students to update.");
        
        $updatedEmails = 0;
        $updatedNames = 0;
        
        foreach ($students as $student) {
            $originalEmail = $student->email;
            $originalFirstName = $student->first_name;
            $originalLastName = $student->last_name;
            
            // Fix name capitalization if needed
            $needsNameUpdate = false;
            $newFirstName = $student->first_name;
            $newLastName = $student->last_name;
            
            // Check if names are in ALL CAPS and fix them
            if ($student->first_name === strtoupper($student->first_name) && strlen($student->first_name) > 1) {
                $newFirstName = ucfirst(strtolower($student->first_name));
                $needsNameUpdate = true;
            }
            
            if ($student->last_name === strtoupper($student->last_name) && strlen($student->last_name) > 1) {
                $newLastName = ucfirst(strtolower($student->last_name));
                $needsNameUpdate = true;
            }
            
            // Update names if needed
            if ($needsNameUpdate) {
                $student->update([
                    'first_name' => $newFirstName,
                    'last_name' => $newLastName,
                ]);
                $updatedNames++;
                $this->command->line("✓ Fixed name: {$originalFirstName} {$originalLastName} → {$newFirstName} {$newLastName}");
            }
            
            // Generate UIC email if student has school_id
            if ($student->school_id && $student->first_name && $student->last_name) {
                $newEmail = $student->generateUicEmail();
                
                // Only update if the email is different and not already in UIC format
                if ($newEmail !== $originalEmail && !str_contains($originalEmail, '@uic.edu.ph')) {
                    // Check if the new email already exists
                    $existingUser = User::where('email', $newEmail)->where('id', '!=', $student->id)->first();
                    
                    if (!$existingUser) {
                        $student->update(['email' => $newEmail]);
                        $updatedEmails++;
                        $this->command->line("✓ Updated email: {$originalEmail} → {$newEmail}");
                    } else {
                        $this->command->warn("⚠️  Email {$newEmail} already exists, skipping {$student->school_id}");
                    }
                }
            }
        }
        
        $this->command->info("\n=== UPDATE SUMMARY ===");
        $this->command->line("✓ Students processed: {$students->count()}");
        $this->command->line("✓ Names updated: {$updatedNames}");
        $this->command->line("✓ Emails updated: {$updatedEmails}");
        
        // Show some examples of the new format
        $this->showExamples();
    }
    
    /**
     * Show examples of the updated format
     */
    private function showExamples(): void
    {
        $this->command->info("\n=== EXAMPLES OF UPDATED FORMAT ===");
        
        $students = User::where('role', 'Student')
                       ->whereNotNull('school_id')
                       ->limit(5)
                       ->get();
                       
        foreach ($students as $student) {
            $displayName = $student->display_name;
            $email = $student->email;
            $schoolId = $student->school_id;
            
            $this->command->line("📧 {$email}");
            $this->command->line("👤 {$displayName} (ID: {$schoolId})");
            $this->command->line("📝 Dashboard greeting: Hi, {$displayName}");
            $this->command->line(str_repeat("-", 50));
        }
    }
}