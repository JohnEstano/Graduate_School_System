<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProgramRecord;
use App\Models\PanelistRecord;
use App\Models\StudentRecord;
use App\Models\PaymentRecord;
use Illuminate\Support\Facades\DB;

class PanelistDataSeeder extends Seeder
{
    // Defense fee breakdown based on the image
    private $feeBreakdown = [
        'Masteral' => [
            'Proposal' => [
                'Adviser' => 3000.00,
                'Panel Chair' => 2000.00,
                'Panel Member' => 1200.00,
            ],
            'Pre-Final' => [
                'Adviser' => 3700.00,
                'Panel Chair' => 2500.00,
                'Panel Member' => 1500.00,
            ],
            'Final' => [
                'Adviser' => 1000.00,
                'Panel Chair' => 1000.00,
                'Panel Member' => 1000.00,
            ]
        ],
        'Doctorate' => [
            'Proposal' => [
                'Adviser' => 4000.00,
                'Panel Chair' => 2800.00,
                'Panel Member' => 1800.00,
            ],
            'Pre-Final' => [
                'Adviser' => 5000.00,
                'Panel Chair' => 3500.00,
                'Panel Member' => 2100.00,
            ],
            'Final' => [
                'Adviser' => 1000.00,
                'Panel Chair' => 1000.00,
                'Panel Member' => 1000.00,
            ]
        ]
    ];

    // Realistic Filipino names
    private $filipinoFirstNames = [
        'Maria', 'Jose', 'Juan', 'Antonio', 'Pedro', 'Rosa', 'Carmen', 'Ana', 
        'Luis', 'Francisco', 'Manuel', 'Ricardo', 'Carlos', 'Eduardo', 'Roberto',
        'Gloria', 'Teresa', 'Angelica', 'Cristina', 'Patricia', 'Jennifer', 'Michelle',
        'Michael', 'John', 'Mark', 'David', 'Daniel', 'Joseph', 'Paul', 'James'
    ];

    private $filipinoLastNames = [
        'Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Torres',
        'Gonzales', 'Rodriguez', 'Perez', 'Ramos', 'Flores', 'Rivera', 'Gomez',
        'Fernandez', 'Villanueva', 'Martinez', 'Del Rosario', 'Castillo', 'Diaz',
        'Aquino', 'Santiago', 'Domingo', 'Bernardo', 'Castro', 'Santiago'
    ];

    public function run()
    {
        // Clear existing data first
        $this->command->info("Clearing existing data...");
        PaymentRecord::query()->delete();
        DB::table('panelist_student_records')->delete();
        StudentRecord::query()->delete();
        PanelistRecord::query()->delete();

        // Get all programs
        $programs = ProgramRecord::all();

        foreach ($programs as $program) {
            // Determine if Masteral or Doctorate based on program name
            $programLevel = $this->determineProgramLevel($program->program);
            
            $this->command->info("Processing: {$program->name} ({$programLevel})");

            // Create panelists pool for this program (3-5 panelists)
            $panelistsPool = [];
            
            // Create 1 Adviser
            $panelistsPool['advisers'][] = $this->createPanelist($program->id, 'Adviser');
            
            // Create 1 Panel Chair
            $panelistsPool['chairs'][] = $this->createPanelist($program->id, 'Panel Chair');
            
            // Create 3-4 Panel Members
            $memberCount = rand(3, 4);
            for ($m = 1; $m <= $memberCount; $m++) {
                $panelistsPool['members'][] = $this->createPanelist($program->id, 'Panel Member');
            }

            // Create students and assign to panelists (3-5 students per program)
            $studentCount = rand(3, 5);
            
            for ($s = 1; $s <= $studentCount; $s++) {
                // Create a student
                $firstName = $this->filipinoFirstNames[array_rand($this->filipinoFirstNames)];
                $middleName = $this->filipinoLastNames[array_rand($this->filipinoLastNames)];
                $lastName = $this->filipinoLastNames[array_rand($this->filipinoLastNames)];
                
                $defenseType = ['Proposal', 'Pre-Final', 'Final'][array_rand(['Proposal', 'Pre-Final', 'Final'])];
                $defenseDate = $this->generateDefenseDate($defenseType);
                $paymentDate = date('Y-m-d', strtotime($defenseDate . ' -7 days'));

                $student = StudentRecord::create([
                    'program_record_id' => $program->id,
                    'first_name' => $firstName,
                    'middle_name' => $middleName,
                    'last_name' => $lastName,
                    'gender' => rand(0, 1) ? 'Male' : 'Female',
                    'program' => $program->program,
                    'school_year' => '2024-2025',
                    'student_id' => '2024' . str_pad(rand(10000, 99999), 5, '0', STR_PAD_LEFT),
                    'course_section' => 'Regular',
                    'birthdate' => date('Y-m-d', strtotime('-' . rand(28, 45) . ' years')),
                    'academic_status' => 'Active',
                    'or_number' => 'OR-' . date('Y') . '-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                    'payment_date' => $paymentDate,
                    'defense_date' => $defenseDate,
                    'defense_type' => $defenseType,
                ]);

                // Assign adviser from pool
                $adviser = $panelistsPool['advisers'][0];
                $student->panelists()->attach($adviser->id, ['role' => 'Adviser']);
                
                PaymentRecord::create([
                    'student_record_id' => $student->id,
                    'panelist_record_id' => $adviser->id,
                    'school_year' => '2024-2025',
                    'payment_date' => $paymentDate,
                    'defense_status' => $defenseType,
                    'amount' => $this->feeBreakdown[$programLevel][$defenseType]['Adviser'],
                ]);

                // Assign panel chair from pool
                $chair = $panelistsPool['chairs'][0];
                $student->panelists()->attach($chair->id, ['role' => 'Panel Chair']);
                
                PaymentRecord::create([
                    'student_record_id' => $student->id,
                    'panelist_record_id' => $chair->id,
                    'school_year' => '2024-2025',
                    'payment_date' => $paymentDate,
                    'defense_status' => $defenseType,
                    'amount' => $this->feeBreakdown[$programLevel][$defenseType]['Panel Chair'],
                ]);

                // Assign 3-4 panel members from pool (randomly)
                $assignedMembers = (array) array_rand($panelistsPool['members'], min(rand(3, 4), count($panelistsPool['members'])));
                if (!is_array($assignedMembers)) {
                    $assignedMembers = [$assignedMembers];
                }
                
                foreach ($assignedMembers as $memberIndex) {
                    $member = $panelistsPool['members'][$memberIndex];
                    $student->panelists()->attach($member->id, ['role' => 'Panel Member']);
                    
                    PaymentRecord::create([
                        'student_record_id' => $student->id,
                        'panelist_record_id' => $member->id,
                        'school_year' => '2024-2025',
                        'payment_date' => $paymentDate,
                        'defense_status' => $defenseType,
                        'amount' => $this->feeBreakdown[$programLevel][$defenseType]['Panel Member'],
                    ]);
                }
            }

            $this->command->info("✓ Created {$studentCount} students with panelists for: {$program->name}");
        }

        $this->command->info("\n=== Summary ===");
        $this->command->info("Total Students: " . StudentRecord::count());
        $this->command->info("Total Panelists: " . PanelistRecord::count());
        $this->command->info("Total Payments: " . PaymentRecord::count());
    }

    private function createPanelist($programId, $role)
    {
        $firstName = $this->filipinoFirstNames[array_rand($this->filipinoFirstNames)];
        $middleName = $this->filipinoLastNames[array_rand($this->filipinoLastNames)];
        $lastName = $this->filipinoLastNames[array_rand($this->filipinoLastNames)];

        return PanelistRecord::create([
            'program_record_id' => $programId,
            'pfirst_name' => 'Dr. ' . $firstName,
            'pmiddle_name' => substr($middleName, 0, 1) . '.',
            'plast_name' => $lastName,
            'role' => $role,
            'received_date' => date('Y-m-d', strtotime('now +14 days')),
        ]);
    }

    private function determineProgramLevel($programCode)
    {
        // Doctorate programs: DBM, DBM-IS, PHDED-*
        if (str_starts_with($programCode, 'DBM') || str_starts_with($programCode, 'PHDED')) {
            return 'Doctorate';
        }
        // Masteral programs: MBA, MEM, MAED-*, etc.
        return 'Masteral';
    }

    private function generateDefenseDate($defenseType)
    {
        // Generate realistic defense dates
        if ($defenseType === 'Proposal') {
            // Proposals: 2-6 months ago
            return date('Y-m-d', strtotime('-' . rand(60, 180) . ' days'));
        } elseif ($defenseType === 'Pre-Final') {
            // Pre-Final: 1-3 months ago
            return date('Y-m-d', strtotime('-' . rand(30, 90) . ' days'));
        } else {
            // Final: Recent (last 1-2 months)
            return date('Y-m-d', strtotime('-' . rand(7, 60) . ' days'));
        }
    }
}
