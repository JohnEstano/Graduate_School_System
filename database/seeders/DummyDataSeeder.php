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

        // Disable foreign key checks and truncate tables
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('panelist_student_records')->truncate();
        DB::table('payment_records')->truncate();
        DB::table('panelist_records')->truncate();
        DB::table('student_records')->truncate();
        DB::table('program_records')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Honorarium rates
        $honorariumRates = [
            ProgramRecord::MASTERS => [
                'Proposal' => ['Adviser'=>3000,'Panel Chair'=>2000,'Panel Member'=>1200],
                'Pre-Final' => ['Adviser'=>3700,'Panel Chair'=>2500,'Panel Member'=>1500],
                'Final' => ['Adviser'=>1000,'Panel Chair'=>1000,'Panel Member'=>1000],
            ],
            ProgramRecord::DOCTORATE => [
                'Proposal' => ['Adviser'=>4000,'Panel Chair'=>2800,'Panel Member'=>1800],
                'Pre-Final' => ['Adviser'=>5000,'Panel Chair'=>3500,'Panel Member'=>2100],
                'Final' => ['Adviser'=>1000,'Panel Chair'=>1000,'Panel Member'=>1000],
            ],
        ];

        foreach (ProgramRecord::defaultPrograms() as $level => $programNames) {
            foreach ($programNames as $programName) {
                // Create program record
                $program = ProgramRecord::create([
                    'name' => $programName,
                    'program' => $level,
                    'recently_updated' => now(),
                    'time_last_opened' => now(),
                    'date_edited' => now(),
                ]);

                // Create random panelists with real names
                $panelists = [];
                $numPanelists = rand(1, 3);
                for ($i = 0; $i < $numPanelists; $i++) {
                    $panelists[] = PanelistRecord::create([
                        'program_record_id' => $program->id,
                        'pfirst_name' => $faker->firstName,
                        'pmiddle_name' => $faker->randomElement([$faker->firstName, null]),
                        'plast_name' => $faker->lastName,
                        'role' => $i === 0 ? 'Panel Chair' : 'Panel Member',
                        'received_date' => now(),
                    ]);
                }

                // Create random students with real names
                $numStudents = rand(1, 5);
                for ($j = 0; $j < $numStudents; $j++) {
                    $defenseType = $faker->randomElement(['Proposal','Pre-Final','Final']);
                    $student = StudentRecord::create([
                        'program_record_id' => $program->id,
                        'first_name' => $faker->firstName,
                        'middle_name' => $faker->randomElement([$faker->firstName, null]),
                        'last_name' => $faker->lastName,
                        'gender' => $faker->randomElement(['Male','Female']),
                        'program' => $level,
                        'school_year' => '2025-2026',
                        'student_id' => 'S' . str_pad($faker->numberBetween(1000,9999), 5, '0', STR_PAD_LEFT),
                        'course_section' => $faker->randomElement(['A','B','C','D']) . rand(1,4),
                        'birthdate' => $faker->dateTimeBetween('-30 years','-20 years')->format('Y-m-d'),
                        'academic_status' => $faker->randomElement(['Regular','Irregular']),
                        'or_number' => 'OR' . $faker->numberBetween(10000,99999),
                        'payment_date' => $faker->dateTimeThisYear()->format('Y-m-d'),
                        'defense_date' => $faker->dateTimeThisYear()->format('Y-m-d'),
                        'defense_type' => $defenseType,
                    ]);

                    // Assign payments to panelists
                    foreach ($panelists as $panelist) {
                        PanelistStudentRecord::create([
                            'panelist_id' => $panelist->id,
                            'student_id' => $student->id,
                            'role' => $panelist->role,
                        ]);

                        $amount = $honorariumRates[$level][$defenseType][$panelist->role] ?? 1000;

                        PaymentRecord::create([
                            'student_record_id' => $student->id,
                            'panelist_record_id' => $panelist->id,
                            'school_year' => '2025-2026',
                            'payment_date' => now(),
                            'defense_status' => 'Completed',
                            'amount' => $amount,
                        ]);
                    }
                }
            }
        }
    }
}
