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
use Carbon\Carbon;

class DefenseRequestSeeder extends Seeder
{
    public function run()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('defense_requests')->truncate();
        DB::table('panelists')->truncate();
        DB::table('users')->truncate();
        if (DB::getSchemaBuilder()->hasTable('coordinator_program_assignments')) {
            DB::table('coordinator_program_assignments')->truncate();
        }
        DB::statement('ALTER TABLE users AUTO_INCREMENT = 1;');
        DB::statement('ALTER TABLE defense_requests AUTO_INCREMENT = 1;');
        DB::statement('ALTER TABLE panelists AUTO_INCREMENT = 1;');
        if (DB::getSchemaBuilder()->hasTable('coordinator_program_assignments')) {
            DB::statement('ALTER TABLE coordinator_program_assignments AUTO_INCREMENT = 1;');
        }
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

        // Major Philippine events for sample defense scheduling
        $phEvents = [
            ['title' => 'EDSA People Power Anniversary', 'date' => '2025-02-25'],
            ['title' => 'Independence Day', 'date' => '2025-06-12'],
            ['title' => 'National Heroes Day', 'date' => '2025-08-25'],
            ['title' => 'Bonifacio Day', 'date' => '2025-11-30'],
            ['title' => 'Christmas Day', 'date' => '2025-12-25'],
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

        // 6. Create Panelists pool
        $panelistPool = [];
        foreach (range(1, 20) as $i) {
            $panelistPool[] = Panelist::create([
                'name' => $faker->name,
                'email' => "panelist{$i}@school.edu",
                'role' => $i % 5 === 0 ? 'Chairperson' : 'Panel Member',
                'status' => 'Assigned',
            ]);
        }

        // Real panelist names
        $realPanelistNames = [
            'Dr. Jose Rizal', 'Dr. Fe del Mundo', 'Dr. Diosdado Banatao', 'Dr. Angel Alcala', 'Dr. Lourdes Cruz',
            'Dr. Baldomero Olivera', 'Dr. Ernesto Domingo', 'Dr. William Padolina', 'Dr. Edgardo Gomez', 'Dr. Gavino Trono',
            'Dr. Amelia Guevara', 'Dr. Raul Destura', 'Dr. Caesar Saloma', 'Dr. Fabian Dayrit', 'Dr. Maria Corazon de Ungria',
            'Dr. Rodolfo Aquino', 'Dr. Jaime Montoya', 'Dr. Maria Victoria Carpio-Bernido', 'Dr. Christopher Bernido', 'Dr. Ramon Barba'
        ];
        $panelistPool = [];
        foreach ($realPanelistNames as $idx => $name) {
            $panelistPool[] = Panelist::create([
                'name' => $name,
                'email' => "panelist" . ($idx+1) . "@school.edu",
                'role' => $idx % 5 === 0 ? 'Chairperson' : 'Panel Member',
                'status' => 'Assigned',
            ]);
        }

        // 7. Create 50 Students, each with adviser(s) and a defense request
        $statuses = ['Pending', 'Approved', 'Rejected', 'Completed'];
        $defenseTypes = ['Proposal', 'Prefinal', 'Final'];
        $priorities = ['Low', 'Medium', 'High'];
        $workflowStates = [
            'submitted',
            'adviser-review',
            'adviser-approved',
            'coordinator-review',
            'coordinator-approved',
            'panels-assigned',
            'scheduled',
            'completed',
            'coordinator-rejected',
            'adviser-rejected',
            'cancelled'
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

            // Randomly pick a workflow path
            $workflowPath = $faker->randomElement([
                // Full approved and scheduled
                ['submitted', 'adviser-approved', 'coordinator-approved', 'panels-assigned', 'scheduled', 'completed'],
                // Rejected by adviser
                ['submitted', 'adviser-review', 'adviser-rejected'],
                // Rejected by coordinator
                ['submitted', 'adviser-approved', 'coordinator-review', 'coordinator-rejected'],
                // Pending at coordinator
                ['submitted', 'adviser-approved', 'coordinator-review'],
                // Pending at adviser
                ['submitted', 'adviser-review'],
            ]);
            $currentState = end($workflowPath);

            // Set status/adviser_status/coordinator_status based on workflow
            $status = 'Pending';
            $adviserStatus = 'Pending';
            $coordinatorStatus = 'Pending';
            if (in_array('adviser-rejected', $workflowPath)) {
                $status = 'Rejected';
                $adviserStatus = 'Rejected';
            } elseif (in_array('coordinator-rejected', $workflowPath)) {
                $status = 'Rejected';
                $adviserStatus = 'Approved';
                $coordinatorStatus = 'Rejected';
            } elseif (in_array('completed', $workflowPath)) {
                $status = 'Completed';
                $adviserStatus = 'Approved';
                $coordinatorStatus = 'Approved';
            } elseif (in_array('scheduled', $workflowPath)) {
                $status = 'Approved';
                $adviserStatus = 'Approved';
                $coordinatorStatus = 'Approved';
            } elseif (in_array('coordinator-approved', $workflowPath)) {
                $status = 'Approved';
                $adviserStatus = 'Approved';
                $coordinatorStatus = 'Approved';
            } elseif (in_array('coordinator-review', $workflowPath)) {
                $status = 'Pending';
                $adviserStatus = 'Approved';
                $coordinatorStatus = 'Pending';
            } elseif (in_array('adviser-approved', $workflowPath)) {
                $status = 'Pending';
                $adviserStatus = 'Approved';
                $coordinatorStatus = 'Pending';
            } elseif (in_array('adviser-review', $workflowPath)) {
                $status = 'Pending';
                $adviserStatus = 'Pending';
                $coordinatorStatus = 'Pending';
            }

            // Build workflow history
            $workflowHistory = [];
            $timestamp = Carbon::now()->subDays(rand(10, 30));
            $userIds = [
                'student' => $student->id,
                'adviser' => $adviser->id,
                'coordinator' => $coordinator->id,
            ];
            foreach ($workflowPath as $idx => $step) {
                $action = $step;
                $userId = $userIds['student'];
                $userName = $student->first_name . ' ' . $student->last_name;
                $comment = null;
                if ($step === 'submitted') {
                    $action = 'submitted';
                } elseif ($step === 'adviser-review' || $step === 'adviser-approved' || $step === 'adviser-rejected') {
                    $userId = $adviser->id;
                    $userName = $adviser->first_name . ' ' . $adviser->last_name;
                    $action = 'adviser-status-updated';
                    $comment = $step === 'adviser-rejected' ? 'Adviser rejected the request.' : null;
                } elseif (str_starts_with($step, 'coordinator')) {
                    $userId = $coordinator->id;
                    $userName = $coordinator->first_name . ' ' . $coordinator->last_name;
                    $action = 'coordinator-status-updated';
                    $comment = $step === 'coordinator-rejected' ? 'Coordinator rejected the request.' : null;
                } elseif ($step === 'panels-assigned') {
                    $userId = $coordinator->id;
                    $userName = $coordinator->first_name . ' ' . $coordinator->last_name;
                    $action = 'Panels Assigned';
                } elseif ($step === 'scheduled') {
                    $userId = $coordinator->id;
                    $userName = $coordinator->first_name . ' ' . $coordinator->last_name;
                    $action = 'scheduled';
                } elseif ($step === 'completed') {
                    $userId = $coordinator->id;
                    $userName = $coordinator->first_name . ' ' . $coordinator->last_name;
                    $action = 'completed';
                    $comment = 'Auto-completed after scheduled defense end time passed';
                }
                $workflowHistory[] = [
                    'action' => $action,
                    'comment' => $comment,
                    'user_id' => $userId,
                    'user_name' => $userName,
                    'timestamp' => $timestamp->format('Y-m-d H:i:s'),
                    'from_state' => $idx > 0 ? $workflowPath[$idx-1] : null,
                    'to_state' => $step,
                ];
                $timestamp->addHours(rand(2, 12));
            }

            // Assign panels if in panels-assigned or later
            $panelistIds = array_map(fn($p) => $p->id, $faker->randomElements($panelistPool, 5));
            $defenseChairperson = $panelistIds[0] ?? null;
            $defensePanelist1 = $panelistIds[1] ?? null;
            $defensePanelist2 = $panelistIds[2] ?? null;
            $defensePanelist3 = $panelistIds[3] ?? null;
            $defensePanelist4 = $panelistIds[4] ?? null;

            // Schedule defense if in scheduled/completed
            $scheduledDate = null;
            $scheduledTime = null;
            $scheduledEndTime = null;
            $defenseVenue = null;
            $defenseMode = null;
            $dateOfDefense = null;
            if (in_array('scheduled', $workflowPath) || in_array('completed', $workflowPath)) {
                // Use a major PH event for some, random for others
                if ($i <= count($phEvents)) {
                    $event = $phEvents[$i - 1];
                    $scheduledDate = Carbon::parse($event['date']);
                    $defenseVenue = $event['title'] . ' Hall';
                } else {
                    $scheduledDate = Carbon::now()->addDays($i);
                    $defenseVenue = 'Room ' . (($i % 10) + 1);
                }
                $scheduledTime = sprintf('%02d:00', 8 + ($i % 5));
                $scheduledEndTime = sprintf('%02d:00', 10 + ($i % 5));
                $defenseMode = $faker->randomElement(['Face-to-face', 'Online']);
                $dateOfDefense = $scheduledDate->format('Y-m-d');
            }

            // Create the defense request
            $defenseRequest = DefenseRequest::create([
                'first_name' => $student->first_name,
                'middle_name' => $student->middle_name,
                'last_name' => $student->last_name,
                'school_id' => $student->school_id,
                'program' => $program,
                'thesis_title' => $faker->sentence(6),
                'defense_type' => $faker->randomElement($defenseTypes),
                'status' => $status,
                'priority' => $faker->randomElement($priorities),
                'workflow_state' => $currentState,
                'scheduled_date' => $scheduledDate,
                'scheduled_time' => $scheduledTime,
                'scheduled_end_time' => $scheduledEndTime,
                'defense_mode' => $defenseMode,
                'defense_venue' => $defenseVenue,
                'defense_adviser' => $adviser->first_name . ' ' . $adviser->last_name,
                'adviser_user_id' => $adviser->id,
                'coordinator_user_id' => $coordinator->id,
                'assigned_to_user_id' => $adviser->id,
                'submitted_by' => $student->id,
                'submitted_at' => $workflowHistory[0]['timestamp'],
                'adviser_reviewed_at' => isset($workflowHistory[1]['timestamp'])
                    ? Carbon::parse($workflowHistory[1]['timestamp'])->format('Y-m-d H:i:s')
                    : null,
                'coordinator_reviewed_at' => isset($workflowHistory[3]['timestamp'])
                    ? Carbon::parse($workflowHistory[3]['timestamp'])->format('Y-m-d H:i:s')
                    : null,
                // Remove panels_assigned_at if you don't want it
                'last_status_updated_at' => end($workflowHistory)['timestamp'],
                'last_status_updated_by' => $coordinator->id,
                'reference_no' => strtoupper(Str::random(8)),
                'workflow_history' => $workflowHistory,
                'defense_chairperson' => $defenseChairperson,
                'defense_panelist1' => $defensePanelist1,
                'defense_panelist2' => $defensePanelist2,
                'defense_panelist3' => $defensePanelist3,
                'defense_panelist4' => $defensePanelist4,
                'adviser_status' => $adviserStatus,
                'coordinator_status' => $coordinatorStatus,
                // Add more fields as needed...
            ]);
        }

        // 8. Coordinator-Program Assignments (if using coordinator_program_assignments table)
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