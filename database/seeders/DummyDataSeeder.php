<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProgramRecord;
use App\Models\StudentRecord;
use App\Models\PaymentRecord;
use App\Models\PanelistRecord;
use App\Models\Adviser;
use App\Models\User;
use App\Models\DefenseRequest;
use Faker\Factory as Faker;
use Faker\Generator as FakerGenerator;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        // Optional: truncate tables if needed
        // \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        // StudentRecord::truncate();
        // PaymentRecord::truncate();
        // PanelistRecord::truncate();
        // \DB::table('panelist_student_records')->truncate();
        // \DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $programs = ProgramRecord::all();

        foreach ($programs as $program) {
            // Create panelists for program
            $panelists = $this->createPanelistsForProgram($program, $faker);

            // Random number of students per program
            $numStudents = rand(3, 8);

            for ($i = 0; $i < $numStudents; $i++) {
                // Create defense request first
                $defenseRequest = DefenseRequest::create([
                    'first_name' => $faker->firstName,
                    'middle_name' => $faker->optional()->firstName,
                    'last_name' => $faker->lastName,
                    'school_id' => 'S' . str_pad($faker->unique()->numberBetween(1000, 9999), 5, '0', STR_PAD_LEFT),
                    'program' => $program->program,
                    'thesis_title' => $faker->sentence(6),
                    'defense_type' => $faker->randomElement(['Proposal', 'Prefinal', 'Final']),
                    'defense_adviser' => $panelists['adviser']->pfirst_name . ' ' . ($panelists['adviser']->pmiddle_name ? $panelists['adviser']->pmiddle_name . ' ' : '') . $panelists['adviser']->plast_name,
                    'status' => 'Completed',
                    'amount' => $faker->randomFloat(2, 2000, 5000),
                    'payment_date' => $faker->dateTimeThisYear()->format('Y-m-d'),
                    'submitted_at' => $faker->dateTimeThisYear(),
                ]);

                $student = StudentRecord::create([
                    'first_name'       => $defenseRequest->first_name,
                    'middle_name'      => $defenseRequest->middle_name,
                    'last_name'        => $defenseRequest->last_name,
                    'gender'           => $faker->randomElement(['Male', 'Female']),
                    'program'          => $program->program,
                    'program_record_id' => $program->id,
                    'school_year'      => '2025-2026',
                    'student_id'       => $defenseRequest->school_id,
                    'course_section'   => $faker->randomElement(['A','B','C','D']) . rand(1,4),
                    'birthdate'        => $faker->dateTimeBetween('-30 years', '-20 years')->format('Y-m-d'),
                    'academic_status'  => $faker->randomElement(['Regular','Irregular']),
                    'or_number'        => 'OR' . $faker->numberBetween(10000, 99999),
                    'payment_date'     => $defenseRequest->payment_date,
                    'defense_request_id' => $defenseRequest->id,
                    'defense_date'     => $faker->dateTimeThisYear()->format('Y-m-d'),
                    'defense_type'     => $defenseRequest->defense_type,
                ]);

                // Assign panelists and create payments
                $this->assignPanelistsToStudent($student, $panelists, $faker, $defenseRequest);
            }
        }

        $this->command->info('Students, panelists, advisers, and payments seeded successfully!');
    }

    /**
     * Create panelists for a program including adviser, chair, and members.
     * Also creates corresponding Adviser model record for the adviser panelist.
     *
     * @param ProgramRecord $program
     * @param FakerGenerator $faker
     * @return array
     */
    private function createPanelistsForProgram(ProgramRecord $program, FakerGenerator $faker): array
    {
        /** @var ProgramRecord $program */
        /** @var FakerGenerator $faker */
        $panelists = [];

        // Get a random coordinator
        $coordinator = User::where('role', 'coordinator')->inRandomOrder()->first();

        // 1 Adviser
        $adviserPanelist = PanelistRecord::create([
            'program_record_id' => $program->id,
            'pfirst_name'      => $faker->firstName,
            'pmiddle_name'     => $faker->optional()->firstName,
            'plast_name'       => $faker->lastName,
            'role'             => 'Adviser',
            'received_date'    => $faker->dateTimeThisYear()->format('Y-m-d'),
        ]);

        // Create corresponding Adviser record
        $adviser = Adviser::create([
            'coordinator_id' => $coordinator ? $coordinator->id : null,
            'first_name' => $adviserPanelist->pfirst_name,
            'middle_name' => $adviserPanelist->pmiddle_name,
            'last_name' => $adviserPanelist->plast_name,
            'email' => strtolower($adviserPanelist->pfirst_name . '.' . $adviserPanelist->plast_name . '@university.edu'),
            'employee_id' => 'EMP' . $faker->numberBetween(1000, 9999),
            'status' => 'active',
        ]);

        $panelists['adviser'] = $adviserPanelist;

        // 1 Panel Chair
        $panelists['chair'] = PanelistRecord::create([
            'program_record_id' => $program->id,
            'pfirst_name'      => $faker->firstName,
            'pmiddle_name'     => $faker->optional()->firstName,
            'plast_name'       => $faker->lastName,
            'role'             => 'Panel Chair',
            'received_date'    => $faker->dateTimeThisYear()->format('Y-m-d'),
        ]);

        // 3 Panel Members
        $panelists['members'] = [];
        for ($i = 0; $i < 3; $i++) {
            $panelists['members'][] = PanelistRecord::create([
                'program_record_id' => $program->id,
                'pfirst_name'      => $faker->firstName,
                'pmiddle_name'     => $faker->optional()->firstName,
                'plast_name'       => $faker->lastName,
                'role'             => 'Panel Member',
                'received_date'    => $faker->dateTimeThisYear()->format('Y-m-d'),
            ]);
        }

        return $panelists;
    }

    /**
     * Assign panelists to a student and create corresponding payment records.
     *
     * @param StudentRecord $student
     * @param array $panelists
     * @param FakerGenerator $faker
     * @param DefenseRequest $defenseRequest
     * @return void
     */
    private function assignPanelistsToStudent(StudentRecord $student, array $panelists, FakerGenerator $faker, DefenseRequest $defenseRequest): void
    {
        // Ensure variables are recognized by static analyzer
        $studentRecord = $student;
        $panelistArray = $panelists;
        $fakerInstance = $faker;
        $defenseRequestRecord = $defenseRequest;
        // Adviser
        $studentRecord->panelists()->attach($panelistArray['adviser']->id, ['role' => 'Adviser']);
        PaymentRecord::create([
            'student_record_id' => $studentRecord->id,
            'panelist_record_id' => $panelistArray['adviser']->id,
            'defense_request_id' => $defenseRequestRecord->id,
            'school_year'      => '2025-2026',
            'payment_date'     => $fakerInstance->dateTimeThisYear()->format('Y-m-d'),
            'defense_status'   => $fakerInstance->randomElement(['Completed','Pending']),
            'amount'           => $fakerInstance->randomFloat(2, 2000, 4000),
        ]);

        // Panel Chair
        $studentRecord->panelists()->attach($panelistArray['chair']->id, ['role' => 'Panel Chair']);
        PaymentRecord::create([
            'student_record_id' => $studentRecord->id,
            'panelist_record_id' => $panelistArray['chair']->id,
            'defense_request_id' => $defenseRequestRecord->id,
            'school_year'      => '2025-2026',
            'payment_date'     => $fakerInstance->dateTimeThisYear()->format('Y-m-d'),
            'defense_status'   => $fakerInstance->randomElement(['Completed','Pending']),
            'amount'           => $fakerInstance->randomFloat(2, 1500, 3000),
        ]);

        // Random 2–3 Panel Members
        $numMembers = rand(2, 3);
        $selectedMembers = $fakerInstance->randomElements($panelistArray['members'], $numMembers);
        foreach ($selectedMembers as $member) {
            $studentRecord->panelists()->attach($member->id, ['role' => 'Panel Member']);
            PaymentRecord::create([
                'student_record_id' => $studentRecord->id,
                'panelist_record_id' => $member->id,
                'defense_request_id' => $defenseRequestRecord->id,
                'school_year'      => '2025-2026',
                'payment_date'     => $fakerInstance->dateTimeThisYear()->format('Y-m-d'),
                'defense_status'   => $fakerInstance->randomElement(['Completed','Pending']),
                'amount'           => $fakerInstance->randomFloat(2, 800, 1500),
            ]);
        }
    }
}
