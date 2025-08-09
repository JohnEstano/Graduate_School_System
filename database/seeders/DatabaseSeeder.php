<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\DefenseRequest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the Graduate School database for tests and developments.
     */
    public function run(): void
    {
        // Full list of programs (Masters and Doctors)
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

        // Roles
        $roles = [
            'Administrative Assistant',
            'Coordinator',
            'Dean',
            'Student',
        ];

        // 10 Coordinators (different programs)
        foreach (array_slice($programs, 0, 10) as $i => $program) {
            User::create([
                'first_name' => fake()->firstName(),
                'middle_name' => fake()->randomElement([fake()->firstName(), null]),
                'last_name' => fake()->lastName(),
                'email' => "coordinator{$i}@school.edu",
                'password' => Hash::make('password'),
                'role' => 'Coordinator',
                'program' => $program,
                'school_id' => 'COORD' . str_pad($i+1, 3, '0', STR_PAD_LEFT),
            ]);
        }

        // 2 Administrative Assistants
        foreach (range(1, 2) as $i) {
            User::create([
                'first_name' => fake()->firstName(),
                'middle_name' => fake()->randomElement([fake()->firstName(), null]),
                'last_name' => fake()->lastName(),
                'email' => "aa{$i}@school.edu",
                'password' => Hash::make('password'),
                'role' => 'Administrative Assistant',
                'program' => null,
                'school_id' => 'AA' . str_pad($i, 3, '0', STR_PAD_LEFT),
            ]);
        }

        // 1 Dean
        User::create([
            'first_name' => 'Dean',
            'middle_name' => null,
            'last_name' => 'Smith',
            'email' => 'dean@school.edu',
            'password' => Hash::make('password'),
            'role' => 'Dean',
            'program' => null,
            'school_id' => 'DEAN001',
        ]);

        // 17 Students
        $students = [];
        foreach (range(1, 17) as $i) {
            $program = $programs[array_rand($programs)];
            $student = User::create([
                'first_name' => fake()->firstName(),
                'middle_name' => fake()->randomElement([fake()->firstName(), null]),
                'last_name' => fake()->lastName(),
                'email' => "student{$i}@school.edu",
                'password' => Hash::make('password'),
                'role' => 'Student',
                'program' => $program,
                'school_id' => 'STU' . str_pad($i, 3, '0', STR_PAD_LEFT),
            ]);
            $students[] = $student;
        }

        // Panelist names pool
        $panelistNames = [];
        for ($i = 0; $i < 20; $i++) {
            $panelistNames[] = fake()->name();
        }

        // Defense Requests for each student
        foreach ($students as $student) {
            $date = fake()->dateTimeBetween('-6 months', '+2 months');
            $panelists = collect($panelistNames)->shuffle()->take(4)->values();
            DefenseRequest::create([
                'first_name' => $student->first_name,
                'middle_name' => $student->middle_name,
                'last_name' => $student->last_name,
                'school_id' => $student->school_id,
                'program' => $student->program,
                'thesis_title' => fake()->sentence(6) . ' in ' . $student->program,
                'date_of_defense' => $date->format('Y-m-d H:i:s'),
                'mode_defense' => fake()->randomElement(['Online', 'Face To Face']),
                'defense_type' => fake()->randomElement(['Proposal', 'Final', 'Prefinal']),
                'advisers_endorsement' => 'sample.png',
                'rec_endorsement' => 'sample.png',
                'proof_of_payment' => 'sample.png',
                'reference_no' => strtoupper(Str::random(10)),
                'defense_adviser' => fake()->name(),
                'defense_chairperson' => fake()->name(),
                'defense_panelist1' => $panelists[0],
                'defense_panelist2' => $panelists[1],
                'defense_panelist3' => $panelists[2],
                'defense_panelist4' => $panelists[3],
                'status' => fake()->randomElement(['Pending', 'Approved', 'Rejected']),
                'priority' => fake()->randomElement(['Low', 'Medium', 'High']),
                'last_status_updated_at' => now()->subDays(rand(0, 60)),
                'last_status_updated_by' => User::inRandomOrder()->first()->id,
            ]);
        }
    }
}
