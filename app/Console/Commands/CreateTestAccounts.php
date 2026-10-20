<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateTestAccounts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:accounts {--reset : Delete existing test accounts first}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create test accounts for Coordinator, Adviser, and Student';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🎯 Creating Test Accounts...');
        $this->newLine();

        // Reset if requested
        if ($this->option('reset')) {
            $this->warn('Deleting existing test accounts...');
            User::whereIn('email', [
                'coordinator@test.com',
                'adviser@test.com',
                'student@test.com'
            ])->delete();
            $this->info('✅ Test accounts deleted');
            $this->newLine();
        }

        // Create Coordinator
        $coordinator = $this->createCoordinator();

        // Create Adviser
        $adviser = $this->createAdviser();

        // Create Student
        $student = $this->createStudent();

        // Summary Table
        $this->newLine();
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('📋 TEST ACCOUNTS SUMMARY');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->newLine();

        $this->table(
            ['Role', 'Email', 'Password', 'Name'],
            [
                ['Coordinator', 'coordinator@test.com', 'password', $coordinator->display_name ?? $coordinator->name],
                ['Adviser', 'adviser@test.com', 'password', $adviser->display_name ?? $adviser->name],
                ['Student', 'student@test.com', 'password', $student->display_name ?? $student->name],
            ]
        );

        $this->newLine();
        $this->info('✅ All test accounts created successfully!');
        $this->newLine();

        $this->line('💡 Login URL: http://127.0.0.1:8000/login');
        $this->newLine();

        $this->comment('📧 To test email workflow:');
        $this->line('   1. Login as STUDENT → Submit defense request');
        $this->line('   2. Login as ADVISER → Approve request');
        $this->line('   3. Login as COORDINATOR → Approve & schedule');
        $this->line('   4. Check emails at each step!');
        $this->newLine();

        return 0;
    }

    private function createCoordinator()
    {
        $coordinator = User::where('email', 'coordinator@test.com')->first();

        if ($coordinator) {
            $this->warn('⚠️  Coordinator account already exists!');
            return $coordinator;
        }

        $coordinator = User::create([
            'first_name' => 'Maria',
            'middle_name' => 'Santos',
            'last_name' => 'Rodriguez',
            'email' => 'coordinator@test.com',
            'password' => Hash::make('password'),
            'role' => 'Coordinator',
            'program' => 'Graduate School',
            'school_id' => 'COORD-2025-001',
        ]);

        $this->info('✅ Coordinator Account Created!');
        $this->line("   Name: {$coordinator->first_name} {$coordinator->last_name}");
        $this->line('   Email: coordinator@test.com');
        $this->line('   Password: password');
        $this->newLine();

        return $coordinator;
    }

    private function createAdviser()
    {
        $adviser = User::where('email', 'adviser@test.com')->first();

        if ($adviser) {
            $this->warn('⚠️  Adviser account already exists!');
            return $adviser;
        }

        $adviser = User::create([
            'first_name' => 'Dr. John',
            'middle_name' => 'Michael',
            'last_name' => 'Smith',
            'email' => 'adviser@test.com',
            'password' => Hash::make('password'),
            'role' => 'Adviser',
            'program' => 'Graduate School',
            'school_id' => 'FAC-2025-001',
        ]);

        // Generate adviser code if method exists
        if (method_exists($adviser, 'generateAdviserCode')) {
            $adviser->generateAdviserCode();
        }

        $this->info('✅ Adviser Account Created!');
        $this->line("   Name: {$adviser->first_name} {$adviser->last_name}");
        $this->line('   Email: adviser@test.com');
        $this->line('   Password: password');
        if ($adviser->adviser_code) {
            $this->line("   Adviser Code: {$adviser->adviser_code}");
        }
        $this->newLine();

        return $adviser;
    }

    private function createStudent()
    {
        $student = User::where('email', 'student@test.com')->first();

        if ($student) {
            $this->warn('⚠️  Student account already exists!');
            return $student;
        }

        $student = User::create([
            'first_name' => 'Juan',
            'middle_name' => 'Carlos',
            'last_name' => 'Dela Cruz',
            'email' => 'student@test.com',
            'password' => Hash::make('password'),
            'role' => 'Student',
            'program' => 'Master of Arts in Education',
            'school_id' => '2025-12345',
        ]);

        $this->info('✅ Student Account Created!');
        $this->line("   Name: {$student->first_name} {$student->last_name}");
        $this->line('   Email: student@test.com');
        $this->line('   Password: password');
        $this->line("   Program: {$student->program}");
        $this->newLine();

        return $student;
    }
}
