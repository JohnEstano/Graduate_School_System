<?php

/**
 * Quick Test Account Creator
 * 
 * Run this in Tinker to create test accounts:
 * php artisan tinker
 * include('create_test_accounts.php');
 */

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "🎯 Creating Test Accounts...\n\n";

// ===========================================
// COORDINATOR ACCOUNT
// ===========================================
$coordinator = User::where('email', 'japzdiapana@gmail.com')->first();

if ($coordinator) {
    echo "⚠️  Coordinator account already exists!\n";
    echo "   Email: coordinator@test.com\n";
    echo "   Password: password\n\n";
} else {
    $coordinator = User::create([
        'first_name' => 'Maria',
        'middle_name' => 'Santos',
        'last_name' => 'Rodriguez',
        'email' => 'japzdiapana@gmail.com',
        'password' => Hash::make('password123'),
        'role' => 'Coordinator',
        'program' => 'Graduate School',
        'school_id' => 'COORD-2025-001',
    ]);
    
    echo "✅ Coordinator Account Created!\n";
    echo "   Name: {$coordinator->first_name} {$coordinator->last_name}\n";
    echo "   Email: japzdiapana@gmail.com\n";
    echo "   Password: password\n";
    echo "   Role: Coordinator\n\n";
}

// ===========================================
// ADVISER (FACULTY) ACCOUNT
// ===========================================
$adviser = User::where('email', 'japzdiapana@gmail.com')->first();

if ($adviser) {
    echo "⚠️  Adviser account already exists!\n";
    echo "   Email: japzdiapana@gmail.com\n";
    echo "   Password: password\n\n";
} else {
    $adviser = User::create([
        'first_name' => 'Dr. John',
        'middle_name' => 'Michael',
        'last_name' => 'Smith',
        'email' => 'japzdiapana@gmail.com',
        'password' => Hash::make('password123'),
        'role' => 'Faculty',
        'program' => 'Graduate School',
        'school_id' => 'FAC-2025-001',
    ]);
    
    // Generate adviser code
    $adviser->generateAdviserCode();
    
    echo "✅ Adviser Account Created!\n";
    echo "   Name: {$adviser->first_name} {$adviser->last_name}\n";
    echo "   Email: japzdiapana@gmail.com\n";
    echo "   Password: password123\n";
    echo "   Role: Faculty (Adviser)\n";
    echo "   Adviser Code: {$adviser->adviser_code}\n\n";
}

// ===========================================
// STUDENT ACCOUNT (BONUS)
// ===========================================
$student = User::where('email', 'student@test.com')->first();

if ($student) {
    echo "⚠️  Student account already exists!\n";
    echo "   Email: student@test.com\n";
    echo "   Password: password\n\n";
} else {
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
    
    echo "✅ Student Account Created (Bonus)!\n";
    echo "   Name: {$student->first_name} {$student->last_name}\n";
    echo "   Email: student@test.com\n";
    echo "   Password: password\n";
    echo "   Role: Student\n";
    echo "   Program: {$student->program}\n\n";
}

// ===========================================
// SUMMARY
// ===========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📋 TEST ACCOUNTS SUMMARY\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

echo "🔹 COORDINATOR\n";
echo "   Login: coordinator@test.com\n";
echo "   Password: password123\n";
echo "   URL: http://127.0.0.1:8000/login\n\n";

echo "🔹 ADVISER (FACULTY)\n";
echo "   Login: adviser@test.com\n";
echo "   Password: password123\n";
echo "   URL: http://127.0.0.1:8000/login\n\n";

echo "🔹 STUDENT\n";
echo "   Login: student@test.com\n";
echo "   Password: password\n";
echo "   URL: http://127.0.0.1:8000/login\n\n";

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "✅ All accounts ready for testing!\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

echo "💡 TIP: To test email workflow:\n";
echo "   1. Login as STUDENT and submit defense request\n";
echo "   2. Login as ADVISER and approve it\n";
echo "   3. Login as COORDINATOR and approve it\n";
echo "   4. Check emails at each step!\n\n";
