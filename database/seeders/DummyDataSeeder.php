<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\ProgramRecord;
use App\Models\StudentRecord;
use App\Models\PanelistRecord;
use App\Models\PaymentRecord;
use App\Models\PanelistStudentRecord;
use Faker\Factory as Faker;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {

        $faker = Faker::create();


        // --- Define arrays for random values ---
        $defenseTypes = ['Proposal', 'Pre-Final', 'Final'];
        $academicStatuses = ['Regular', 'Irregular'];

        // --- Truncate tables (reset auto-increment IDs too) ---
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('panelist_student_records')->truncate();
        DB::table('payment_records')->truncate();
        DB::table('panelist_records')->truncate();
        DB::table('student_records')->truncate();
        DB::table('program_records')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // --- Programs, Students, Panelists ---
        $programs = [
                // ---------------- Doctorate ----------------
    [
        'name' => 'Doctor in Business Management',
        'program' => 'Doctorate',
               'students' => [
                    [
                        'first_name' => 'Juan',
                        'middle_name' => 'D',
                        'last_name' => 'Cruz',
                        'gender' => 'Male',
                        'student_id' => 'SBSCS001',
                        'course_section' => 'BSCS 4A',
                        'birthdate' => '2002-05-15',
                        'academic_status' => 'Active',
                        'or_number' => 'OR10001',
                        'payment_date' => '2025-09-01',
                        'defense_date' => '2025-09-01',
                        'defense_type' => 'Proposal',
                        'payment_amount' => 2000,
                        'defense_status' => 'Completed',
                        'panelists' => [0, 1],
                    ],
                    [
                        'first_name' => 'Maria',
                        'middle_name' => 'L',
                        'last_name' => 'Santos',
                        'gender' => 'Female',
                        'student_id' => 'SBSCS002',
                        'course_section' => 'BSCS 4B',
                        'birthdate' => '2001-08-20',
                        'academic_status' => 'Active',
                        'or_number' => 'OR10002',
                        'payment_date' => '2025-08-28',
                        'defense_date' => '2025-09-01',
                        'defense_type' => 'Proposal',
                        'payment_amount' => 2000,
                        'defense_status' => 'Completed',
                        'panelists' => [0],
                    ],
                    [
                        'first_name' => 'Jim Nick',
                        'middle_name' => 'F',
                        'last_name' => 'Quezada',
                        'gender' => 'Male',
                        'student_id' => '230000000642',
                        'course_section' => 'BSIT 3B',
                        'birthdate' => '2002-05-27',
                        'academic_status' => 'Regular',
                        'or_number' => 'OR10003',
                        'payment_date' => '2025-09-10',
                        'defense_date' => '2025-09-01',
                        'defense_type' => 'Pre-Final',
                        'payment_amount' => 2500,
                        'defense_status' => 'Completed',
                        'panelists' => [0, 1],
                    ],
                ],

                'panelists' => [
                    [
                        'pfirst_name' => 'Dr. Jose',
                        'pmiddle_name' => 'M',
                        'plast_name' => 'Reyes',
                        'role' => 'Chairperson',
                    ],
                    [
                        'pfirst_name' => 'Engr. Ana',
                        'pmiddle_name' => 'S',
                        'plast_name' => 'Garcia',
                        'role' => 'Member',
                    ],
                    [
                        'pfirst_name' => 'Ian',
                        'pmiddle_name' => 'T',
                        'plast_name' => 'Ramirez',
                        'role' => 'Chairperson',
                    ],
                ],
    ],
[
    'name' => 'Doctor in Business Management Specialized in Information Systems',
    'program' => 'Doctorate',
    'students' => [
        [
            'first_name' => 'Jim',
            'middle_name' => 'Fernandez',
            'last_name' => 'Quezada',
            'gender' => 'Male',
            'student_id' => '230000001641',
            'course_section' => 'BSIT 3B',
            'birthdate' => '2002-05-27',
            'academic_status' => 'Regular',
            'or_number' => 'OR101114',
            'payment_date' => '2025-09-01',
            'defense_date' => '2025-09-01',
            'defense_type' => 'Final',
            'payment_amount' => 1000,
            'defense_status' => 'Completed',
            'panelists' => [0],
        ],
    ],
    'panelists' => [
        [
            'pfirst_name' => 'Eric John',
            'pmiddle_name' => '',
            'plast_name' => 'Emberda',
            'role' => 'Panel Chair',
        ],
    ],
],

    [
        'name' => 'Doctor of Philosophy in Education - Applied Linguistics',
        'program' => 'Doctorate',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Doctor of Philosophy in Education - Educational Leadership',
        'program' => 'Doctorate',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Doctor of Philosophy in Education - Counseling',
        'program' => 'Doctorate',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Doctor of Philosophy in Education - Filipino',
        'program' => 'Doctorate',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Doctor of Philosophy in Education - Information Technology Integration',
        'program' => 'Doctorate',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Doctor of Philosophy in Education - Mathematics',
        'program' => 'Doctorate',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Doctor of Philosophy in Education - Physical Education',
        'program' => 'Doctorate',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Doctor of Philosophy in Pharmacy',
        'program' => 'Doctorate',
        'students' => [],
        'panelists' => [],
    ],

    // ---------------- Masters ----------------
    [
        'name' => 'Master of Arts in Educational Management',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Arts in Elementary Education',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Arts in Education - English',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Arts in Education - Filipino',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Arts in Education - Information Technology Integration',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Arts in Education - Mathematics',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Arts in Education - Music Education',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Arts in Education - Physical Education',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Arts in Education - Sociology',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Arts in Religious Education',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Arts in Values Education',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Arts in Teaching Chemistry',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Arts in Teaching Physics',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master in Engineering Education - Civil Engineering',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master in Engineering Education - Electronics and Communications Engineering',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master in Information System',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master in Information Technology',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Science in Medical Technology - Biomedical Science',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Science in Medical Technology - Laboratory Leadership and Management',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Science in Medical Technology - Medical Laboratory Science Education and Management',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Science in Medical Technology - Community Health',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Science in Pharmacy',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master of Arts in Counseling',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master in Pastoral Ministry (Non-Thesis) - Family Ministry and Counseling',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master in Pastoral Ministry (Non-Thesis) - Pastoral Management',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    [
        'name' => 'Master in Pastoral Ministry (Non-Thesis) - Retreat Giving and Spirituality',
        'program' => 'Masters',
        'students' => [],
        'panelists' => [],
    ],
    ];



    

        $numStudents = rand(50, 100);



        $honorariumRates = [
            'Masters' => [
                'Proposal' => ['Adviser'=>3000,'Panel Chair'=>2000,'Panel Member'=>1200],
                'Pre-Final' => ['Adviser'=>3700,'Panel Chair'=>2500,'Panel Member'=>1500],
                'Final' => ['Adviser'=>1000,'Panel Chair'=>1000,'Panel Member'=>1000],
            ],
            'Doctorate' => [
                'Proposal' => ['Adviser'=>4000,'Panel Chair'=>2800,'Panel Member'=>1800],
                'Pre-Final' => ['Adviser'=>5000,'Panel Chair'=>3500,'Panel Member'=>2100],
                'Final' => ['Adviser'=>1000,'Panel Chair'=>1000,'Panel Member'=>1000],
            ],
        ];

        foreach ($programs as $progData) {
            // --- Create Program ---
            $program = ProgramRecord::create([
                'name' => $progData['name'],
                'program' => $progData['program'],
                'recently_updated' => now(),
                'time_last_opened' => now(),
                'date_edited' => now(),
            ]);

            // --- Create 5–10 panelists ---
            $panelists = [];
            $numPanelists = rand(5, 10);
            for ($p = 0; $p < $numPanelists; $p++) {
                $role = $p === 0 ? 'Adviser' : ($p === 1 ? 'Panel Chair' : 'Panel Member');
                $panelist = PanelistRecord::create([
                    'program_record_id' => $program->id,
                    'pfirst_name' => $faker->firstName,
                    'pmiddle_name' => $faker->firstName,
                    'plast_name' => $faker->lastName,
                    'role' => $role,
                    'received_date' => now(),
                ]);
                $panelists[] = $panelist;
            }

            // --- Create unique students ---
            $numStudents = rand(15, 30); // or any number of students per program
            $students = [];

            for ($i = 0; $i < $numStudents; $i++) {
                $defenseType = $defenseTypes[array_rand($defenseTypes)];
                $student = StudentRecord::create([
                    'program_record_id' => $program->id,
                    'first_name' => $faker->firstName,
                    'middle_name' => $faker->firstName,
                    'last_name' => $faker->lastName,
                    'gender' => $faker->randomElement(['Male', 'Female']),
                    'program' => $program->program,
                    'school_year' => '2025-2026',
                    'student_id' => '23'.$faker->unique()->numerify('#########'),
                    'course_section' => $faker->randomElement(['1A','1B','2A','2B','3A','3B','4A','4B']),
                    'birthdate' => $faker->date('Y-m-d','-25 years'),
                    'academic_status' => $faker->randomElement($academicStatuses),
                    'or_number' => 'OR'.$faker->numerify('#####'),
                    'payment_date' => $faker->dateTimeThisYear()->format('Y-m-d'),
                    'defense_date' => $faker->dateTimeThisYear()->format('Y-m-d'),
                    'defense_type' => $defenseType,
                ]);

                // --- Create payments for each panelist based on defense type ---
                foreach ($panelists as $panelist) {
                    $role = $panelist->role;
                    $amount = $honorariumRates[$program->program][$defenseType][$role] ?? 1000;
                    PaymentRecord::create([
                        'student_record_id' => $student->id,
                        'panelist_record_id' => $panelist->id,
                        'school_year' => '2025-2026',
                        'payment_date' => now(),
                        'defense_status' => 'Completed',
                        'amount' => $amount,
                    ]);
                }

                $students[] = $student;
            }

            // --- Assign 5–10 students to each panelist ---
            foreach ($panelists as $panelist) {
                $assignedStudents = $faker->randomElements($students, rand(5, 10));
                foreach ($assignedStudents as $student) {
                    PanelistStudentRecord::create([
                        'panelist_id' => $panelist->id,
                        'student_id' => $student->id,
                        'role' => $faker->randomElement(['Adviser', 'Chair', 'Member']),
                    ]);
                }
            }
        }
    }
}