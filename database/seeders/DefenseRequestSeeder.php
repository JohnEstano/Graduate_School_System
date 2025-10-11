<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\DefenseRequest;
use App\Models\Panelist;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class DefenseRequestSeeder extends Seeder
{
    public function run()
    {
        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        // Truncate tables
        DB::table('defense_requests')->truncate();
        DB::table('panelists')->truncate();
        DB::table('users')->truncate();
        if (DB::getSchemaBuilder()->hasTable('coordinator_program_assignments')) {
            DB::table('coordinator_program_assignments')->truncate();
        }
        // Reset auto-increment
        DB::statement('ALTER TABLE users AUTO_INCREMENT = 1;');
        DB::statement('ALTER TABLE defense_requests AUTO_INCREMENT = 1;');
        DB::statement('ALTER TABLE panelists AUTO_INCREMENT = 1;');
        if (DB::getSchemaBuilder()->hasTable('coordinator_program_assignments')) {
            DB::statement('ALTER TABLE coordinator_program_assignments AUTO_INCREMENT = 1;');
        }
        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $faker = Faker::create();

        // Programs
        $programs = [
            'Master of Arts in Education major in English',
            'Master of Arts in Education major in Sociology',
            'Master of Arts in Education major in Mathematics',
            'Master of Arts in Education major in Physical Education',
            'Master of Arts in Educational Management',
            'Master of Arts in Elementary Education',
            'Master of Arts in Teaching College Chemistry',
            'Master of Arts in Teaching College Physics',
            'Master of Arts in Engineering Education with majors in Civil Engineering',
            'Master of Arts in Engineering Education with majors in Electronics Communications Engineering',
            'Master of Arts in Values Education',
            'Master in Business Administration',
            'Master of Information Technology',
            'Master in Information Systems',
            'Master of Science in Pharmacy',
            'Master of Science in Medical Technology/ Medical Laboratory Science',
            'Master of Arts in Education major in Filipino',
            'Master of Arts in Education major in Music Education',
            'Master of Arts in Education major in Information Technology Integration',
            'Doctor in Business Management',
            'Doctor of Philosophy in Education major in Applied Linguistics',
            'Doctor of Philosophy in Education major in Educational Leadership',
            'Doctor of Philosophy in Education major in Filipino',
            'Doctor of Philosophy in Education major in Mathematics',
            'Doctor of Philosophy in Education major in Counseling',
            'Doctor of Philosophy in Education major in  Information Technology Integration',
            'Doctor of Philosophy in Education major in Physical Education',
            'DOCTOR OF PHILOSOPHY IN PHARMACY',
            'Master in Counseling',
        ];

        // 1. Create Dean
        $dean = User::factory()->create([
            'first_name' => 'Maria',
            'last_name' => 'Lopez',
            'email' => 'dean@school.edu',
            'password' => Hash::make('password'),
            'role' => 'Dean',
        ]);

        // 2. Create 2 Administrative Assistants
        $aas = [];
        $aaNames = [['James', 'Smith'], ['Emily', 'Johnson']];
        foreach ($aaNames as $i => $name) {
            $aas[] = User::factory()->create([
                'first_name' => $name[0],
                'last_name' => $name[1],
                'email' => "aa" . ($i+1) . "@school.edu",
                'password' => Hash::make('password'),
                'role' => 'Administrative Assistant',
            ]);
        }

        // 3. Create 10 Coordinators, each assigned to a program
        $coordinators = [];
        foreach (range(0, 9) as $i) {
            $coordinators[] = User::factory()->create([
                'first_name' => $faker->firstName,
                'last_name' => $faker->lastName,
                'email' => "coordinator" . ($i+1) . "@school.edu",
                'password' => Hash::make('password'),
                'role' => 'Coordinator',
                'program' => $programs[$i % count($programs)],
            ]);
        }

        // 4. Create 10 Advisers, each assigned to a program
        $advisers = [];
        foreach (range(0, 9) as $i) {
            $advisers[] = User::factory()->create([
                'first_name' => $faker->firstName,
                'last_name' => $faker->lastName,
                'email' => "adviser" . ($i+1) . "@school.edu",
                'password' => Hash::make('password'),
                'role' => 'Faculty',
                'program' => $programs[$i % count($programs)],
            ]);
        }

        // 5. Attach advisers to coordinators (adviser_coordinator pivot)
        foreach ($advisers as $i => $adviser) {
            $coordinator = $coordinators[$i % count($coordinators)];
            $adviser->coordinators()->attach($coordinator->id);
        }

        // 6. Create 50 Students, each with adviser(s) and a defense request
        $statuses = ['Pending', 'Approved', 'Rejected', 'Completed'];
        $defenseTypes = ['Proposal', 'Prefinal', 'Final'];
        $priorities = ['Low', 'Medium', 'High'];
        // Add this array for workflow states that coordinators can see
        $workflowStates = [
            'adviser-approved',
            'coordinator-review',
            'coordinator-approved',
            'panels-assigned',
            'scheduled',
            'completed',
            'coordinator-rejected'
        ];

        foreach (range(1, 50) as $i) {
            $program = $programs[($i - 1) % count($programs)];
            $coordinator = $coordinators[($i - 1) % count($coordinators)];
            $adviser = $advisers[($i - 1) % count($advisers)];

            $student = User::factory()->create([
                'first_name' => $faker->firstName,
                'middle_name' => $faker->firstName,
                'last_name' => $faker->lastName,
                'email' => "student{$i}@school.edu",
                'password' => Hash::make('password'),
                'role' => 'Student',
                'program' => $program,
                'school_id' => "2025" . str_pad($i, 4, '0', STR_PAD_LEFT),
            ]);

            // Attach adviser to student (adviser_student pivot)
            $student->advisers()->attach($adviser->id);

            // Defense Request
            $defenseRequest = DefenseRequest::create([
                'first_name' => $student->first_name,
                'middle_name' => $student->middle_name,
                'last_name' => $student->last_name,
                'school_id' => $student->school_id,
                'program' => $program,
                'thesis_title' => $faker->sentence(6),
                'defense_type' => $defenseTypes[array_rand($defenseTypes)],
                'status' => $statuses[array_rand($statuses)],
                'priority' => $priorities[array_rand($priorities)],
                // PATCH: Use a workflow state visible to coordinators
                'workflow_state' => $workflowStates[array_rand($workflowStates)],
                'scheduled_date' => now()->addDays($i),
                'scheduled_time' => '09:00',
                'scheduled_end_time' => '11:00',
                'defense_mode' => 'Face-to-face',
                'defense_venue' => 'Room ' . (($i % 10) + 1),
                'defense_adviser' => $adviser->first_name . ' ' . $adviser->last_name,
                'adviser_user_id' => $adviser->id,
                'assigned_to_user_id' => $adviser->id,
                'submitted_by' => $student->id,
                'submitted_at' => now()->subDays(rand(1, 30)),
                'adviser_reviewed_at' => now()->subDays(rand(1, 30)),
                'coordinator_user_id' => $coordinator->id,
                'panels_assigned_at' => now()->subDays(rand(1, 30)),
                'last_status_updated_at' => now()->subDays(rand(0, 10)),
                'last_status_updated_by' => $coordinator->id,
                'reference_no' => strtoupper(Str::random(8)),
                'workflow_history' => [
                    [
                        'action' => 'submitted',
                        'timestamp' => now()->subDays(rand(1, 30))->toIso8601String(),
                        'user_id' => $student->id,
                        'user_name' => $student->first_name . ' ' . $student->last_name,
                        'from_state' => null,
                        'to_state' => 'submitted'
                    ]
                ],
            ]);

            // Assign panelists (create dummy panelists if needed)
            $panelists = [];
            foreach (range(1, 5) as $p) {
                $panelist = Panelist::firstOrCreate([
                    'email' => "panelist{$i}_{$p}@school.edu",
                ], [
                    'name' => $faker->name,
                    'role' => $p === 1 ? 'Chairperson' : 'Panel Member',
                    'status' => 'Assigned',
                ]);
                $panelists[] = $panelist;
            }
            $defenseRequest->defense_chairperson = $panelists[0]->id;
            $defenseRequest->defense_panelist1 = $panelists[1]->id;
            $defenseRequest->defense_panelist2 = $panelists[2]->id;
            $defenseRequest->defense_panelist3 = $panelists[3]->id;
            $defenseRequest->defense_panelist4 = $panelists[4]->id;
            $defenseRequest->save();
        }

        // 7. Coordinator-Program Assignments (if using coordinator_program_assignments table)
        if (DB::getSchemaBuilder()->hasTable('coordinator_program_assignments')) {
            foreach ($coordinators as $i => $coordinator) {
                DB::table('coordinator_program_assignments')->insert([
                    'coordinator_user_id' => $coordinator->id,
                    'program_name' => $coordinator->program,
                    'assigned_by' => $dean->id,
                    'notes' => 'Auto-assigned by seeder',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}