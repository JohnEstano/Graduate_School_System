<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Services\CoordinatorProgramService;

class HBeltranStudentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get hbeltran's assigned programs
        $hbeltranPrograms = CoordinatorProgramService::getProgramsByEmail('hbeltran@uic.edu.ph');
        
        $this->command->info('Creating students for hbeltran@uic.edu.ph programs...');
        
        // Create students for each of hbeltran's programs
        $studentData = [
            // DBM-IS students
            ['first_name' => 'Alexander', 'last_name' => 'Tech', 'email' => 'atech@student.uic.edu.ph', 'program' => 'Doctor in Business Management major in Information Systems'],
            ['first_name' => 'Sophia', 'last_name' => 'Systems', 'email' => 'ssystems@student.uic.edu.ph', 'program' => 'Doctor in Business Management major in Information Systems'],
            
            // PhDITI students  
            ['first_name' => 'Daniel', 'last_name' => 'Integration', 'email' => 'dintegration@student.uic.edu.ph', 'program' => 'Doctor of Philosophy in Information Technology Integration'],
            ['first_name' => 'Emma', 'last_name' => 'Digital', 'email' => 'edigital@student.uic.edu.ph', 'program' => 'Doctor of Philosophy in Information Technology Integration'],
            
            // MAED-ITI students
            ['first_name' => 'Lucas', 'last_name' => 'Educator', 'email' => 'leducator@student.uic.edu.ph', 'program' => 'Master of Arts in Education major in Information Technology Integration'],
            ['first_name' => 'Olivia', 'last_name' => 'Learning', 'email' => 'olearning@student.uic.edu.ph', 'program' => 'Master of Arts in Education major in Information Technology Integration'],
            
            // MIS students
            ['first_name' => 'Noah', 'last_name' => 'Database', 'email' => 'ndatabase@student.uic.edu.ph', 'program' => 'Master in Information Systems'],
            ['first_name' => 'Ava', 'last_name' => 'Analytics', 'email' => 'aanalytics@student.uic.edu.ph', 'program' => 'Master in Information Systems'],
            ['first_name' => 'Ethan', 'last_name' => 'Enterprise', 'email' => 'eenterprise@student.uic.edu.ph', 'program' => 'Master in Information Systems'],
            
            // MIT students
            ['first_name' => 'Isabella', 'last_name' => 'Network', 'email' => 'inetwork@student.uic.edu.ph', 'program' => 'Master in Information Technology'],
            ['first_name' => 'Mason', 'last_name' => 'Security', 'email' => 'msecurity@student.uic.edu.ph', 'program' => 'Master in Information Technology'],
            ['first_name' => 'Charlotte', 'last_name' => 'Cloud', 'email' => 'ccloud@student.uic.edu.ph', 'program' => 'Master in Information Technology'],
        ];
        
        foreach ($studentData as $student) {
            User::create([
                'first_name' => $student['first_name'],
                'last_name' => $student['last_name'],
                'email' => $student['email'],
                'password' => bcrypt('password123'),
                'role' => 'Student',
                'program' => $student['program'],
                'school_id' => 'S' . rand(2020000, 2024999),
            ]);
            
            $this->command->line("✓ Created {$student['first_name']} {$student['last_name']} for {$student['program']}");
        }
        
        // Show summary for hbeltran
        $this->command->info("\n=== HBELTRAN STUDENT SUMMARY ===");
        
        foreach ($hbeltranPrograms as $program) {
            $studentCount = User::where('role', 'Student')
                              ->where('program', $program)
                              ->count();
                              
            $this->command->line("📚 {$program}: {$studentCount} students");
            
            // List the students
            $students = User::where('role', 'Student')
                          ->where('program', $program)
                          ->get(['first_name', 'last_name', 'email']);
                          
            foreach ($students as $student) {
                $this->command->line("   • {$student->first_name} {$student->last_name} ({$student->email})");
            }
        }
    }
}