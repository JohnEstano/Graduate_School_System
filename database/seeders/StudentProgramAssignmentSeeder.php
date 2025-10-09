<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Services\CoordinatorProgramService;

class StudentProgramAssignmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all available programs from the coordinator service
        $allPrograms = [];
        $coordinatorMappings = CoordinatorProgramService::getAllMappings();
        
        foreach ($coordinatorMappings as $email => $programs) {
            $allPrograms = array_merge($allPrograms, $programs);
        }
        
        // Get all students
        $students = User::where('role', 'Student')->get();
        
        if ($students->isEmpty()) {
            $this->command->info('No students found. Creating some sample students...');
            $this->createSampleStudents();
            $students = User::where('role', 'Student')->get();
        }
        
        $this->command->info('Assigning programs to ' . $students->count() . ' students...');
        
        // Assign each student to a random program
        foreach ($students as $student) {
            $randomProgram = $allPrograms[array_rand($allPrograms)];
            
            $student->update([
                'program' => $randomProgram
            ]);
            
            $this->command->line("✓ Assigned {$student->email} to: {$randomProgram}");
        }
        
        // Show summary
        $this->showAssignmentSummary();
    }
    
    /**
     * Create sample students if none exist
     */
    private function createSampleStudents(): void
    {
        $sampleStudents = [
            ['first_name' => 'Juan', 'last_name' => 'Dela Cruz', 'email' => 'jdelacruz@student.uic.edu.ph'],
            ['first_name' => 'Maria', 'last_name' => 'Santos', 'email' => 'msantos@student.uic.edu.ph'],
            ['first_name' => 'Jose', 'last_name' => 'Rizal', 'email' => 'jrizal@student.uic.edu.ph'],
            ['first_name' => 'Ana', 'last_name' => 'Garcia', 'email' => 'agarcia@student.uic.edu.ph'],
            ['first_name' => 'Miguel', 'last_name' => 'Rodriguez', 'email' => 'mrodriguez@student.uic.edu.ph'],
            ['first_name' => 'Carmen', 'last_name' => 'Lopez', 'email' => 'clopez@student.uic.edu.ph'],
            ['first_name' => 'Pedro', 'last_name' => 'Martinez', 'email' => 'pmartinez@student.uic.edu.ph'],
            ['first_name' => 'Sofia', 'last_name' => 'Hernandez', 'email' => 'shernandez@student.uic.edu.ph'],
            ['first_name' => 'Carlos', 'last_name' => 'Gonzalez', 'email' => 'cgonzalez@student.uic.edu.ph'],
            ['first_name' => 'Isabella', 'last_name' => 'Perez', 'email' => 'iperez@student.uic.edu.ph'],
            ['first_name' => 'Diego', 'last_name' => 'Torres', 'email' => 'dtorres@student.uic.edu.ph'],
            ['first_name' => 'Lucia', 'last_name' => 'Flores', 'email' => 'lflores@student.uic.edu.ph'],
            ['first_name' => 'Rafael', 'last_name' => 'Morales', 'email' => 'rmorales@student.uic.edu.ph'],
            ['first_name' => 'Valentina', 'last_name' => 'Jimenez', 'email' => 'vjimenez@student.uic.edu.ph'],
            ['first_name' => 'Alejandro', 'last_name' => 'Ruiz', 'email' => 'aruiz@student.uic.edu.ph'],
            ['first_name' => 'Camila', 'last_name' => 'Vargas', 'email' => 'cvargas@student.uic.edu.ph'],
            ['first_name' => 'Sebastian', 'last_name' => 'Castro', 'email' => 'scastro@student.uic.edu.ph'],
            ['first_name' => 'Andrea', 'last_name' => 'Ortega', 'email' => 'aortega@student.uic.edu.ph'],
            ['first_name' => 'Mateo', 'last_name' => 'Ramos', 'email' => 'mramos@student.uic.edu.ph'],
            ['first_name' => 'Elena', 'last_name' => 'Gutierrez', 'email' => 'egutierrez@student.uic.edu.ph'],
        ];
        
        foreach ($sampleStudents as $studentData) {
            User::create([
                'first_name' => $studentData['first_name'],
                'last_name' => $studentData['last_name'],
                'email' => $studentData['email'],
                'password' => bcrypt('password123'),
                'role' => 'Student',
                'school_id' => 'S' . rand(2020000, 2024999),
            ]);
        }
        
        $this->command->info('Created ' . count($sampleStudents) . ' sample students.');
    }
    
    /**
     * Show assignment summary by program and coordinator
     */
    private function showAssignmentSummary(): void
    {
        $this->command->info("\n=== STUDENT ASSIGNMENT SUMMARY ===");
        
        $coordinatorMappings = CoordinatorProgramService::getAllMappings();
        
        foreach ($coordinatorMappings as $coordinatorEmail => $programs) {
            $this->command->info("\n📧 {$coordinatorEmail}:");
            
            foreach ($programs as $program) {
                $studentCount = User::where('role', 'Student')
                                  ->where('program', $program)
                                  ->count();
                                  
                $this->command->line("   📚 {$program}: {$studentCount} students");
            }
        }
        
        $totalStudents = User::where('role', 'Student')->count();
        $assignedStudents = User::where('role', 'Student')->whereNotNull('program')->count();
        
        $this->command->info("\n📊 TOTAL SUMMARY:");
        $this->command->line("   • Total Students: {$totalStudents}");
        $this->command->line("   • Assigned Students: {$assignedStudents}");
        $this->command->line("   • Unassigned Students: " . ($totalStudents - $assignedStudents));
    }
}