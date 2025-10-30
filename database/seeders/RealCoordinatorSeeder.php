<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class RealCoordinatorSeeder extends Seeder
{
    public function run(): void
    {
        // Create or update real coordinators with their comprehensive program assignments
        $coordinators = [
            [
                'email' => 'pacosta@uic.edu.ph',
                'first_name' => 'Patricia',
                'last_name' => 'Costa',
                'role' => 'Program Coordinator',
                'programs' => 'Doctor in Business Management (DBM), Master in Business Administration (with Thesis and Non-Thesis), Master in Business Administration for Health Professionals',
                'school_id' => 'COORD001'
            ],
            [
                'email' => 'gscoordinator_maed@uic.edu.ph',
                'first_name' => 'Graduate School',
                'last_name' => 'MAED Coordinator',
                'role' => 'Program Coordinator',
                'programs' => 'Doctor of Philosophy in Counseling, Doctor of Philosophy in Physical Education, Doctor of Philosophy in Mathematics, Master of Arts in Education major in Physical Education, Master in Counseling (MIC), Master of Arts in Counseling (MAC)',
                'school_id' => 'COORD002'
            ],
            [
                'email' => 'gscoordinator_pharmacy@uic.edu.ph',
                'first_name' => 'Graduate School',
                'last_name' => 'Pharmacy Coordinator',
                'role' => 'Program Coordinator',
                'programs' => 'Doctor of Philosophy in Pharmacy, Master of Science in Pharmacy, Master of Science in Medical Technology',
                'school_id' => 'COORD003'
            ],
            [
                'email' => 'gscoordinator_phd@uic.edu.ph',
                'first_name' => 'Graduate School',
                'last_name' => 'PhD Coordinator',
                'role' => 'Program Coordinator',
                'programs' => 'Doctor of Philosophy in Education major in Applied Linguistics (PhDAL), Doctor of Philosophy in Education major in Educational Leadership (PhDEL), Doctor of Philosophy in Education major in Filipino, Master of Arts in Education major in English, Master of Arts in Education major in Filipino',
                'school_id' => 'COORD004'
            ],
            [
                'email' => 'aalontaga@uic.edu.ph',
                'first_name' => 'Alexander',
                'last_name' => 'Alontaga',
                'role' => 'Program Coordinator',
                'programs' => 'Master of Arts in Education major in Music Education',
                'school_id' => 'COORD005'
            ],
            [
                'email' => 'vbadong@uic.edu.ph',
                'first_name' => 'Vicente',
                'last_name' => 'Badong',
                'role' => 'Program Coordinator',
                'programs' => 'Master of Arts in Teaching College Chemistry (MATC), Master of Arts in Teaching College Physics (MATP), Master of Arts in Engineering Education major in Civil Engineering (MAEE-CE), Master of Arts in Engineering Education major in Electronics and Communications Engineering (MAEE-ECE)',
                'school_id' => 'COORD006'
            ],
            [
                'email' => 'gbuelis@uic.edu.ph',
                'first_name' => 'Grace',
                'last_name' => 'Buelis',
                'role' => 'Academic Program Adviser',
                'programs' => 'Master of Science in Medical Technology',
                'school_id' => 'COORD007'
            ],
            [
                'email' => 'hbeltran@uic.edu.ph',
                'first_name' => 'Harrold',
                'last_name' => 'Beltran',
                'role' => 'Program Coordinator',
                'programs' => 'Doctor in Business Management major in Information Systems (DBM-IS), Doctor of Philosophy in Information Technology Integration (PhDITI), Master of Arts in Education major in Information Technology Integration (MAED-ITI), Master in Information Systems (MIS), Master in Information Technology (MIT)',
                'school_id' => 'COORD008'
            ],
            [
                'email' => 'talderite@uic.edu.ph',
                'first_name' => 'Theodore',
                'last_name' => 'Alderite',
                'role' => 'Program Coordinator',
                'programs' => 'Master of Arts in Education major in Mathematics, Master of Arts in Education major in Sociology, Master of Arts in Education major in Religious Education, Master of Arts in Education major in Values Education, Master of Arts in Educational Management, Master of Arts in Elementary Education',
                'school_id' => 'COORD009'
            ]
        ];

        echo "Creating real coordinators with comprehensive program assignments...\n";

        foreach ($coordinators as $coordinator) {
            User::updateOrCreate(
                ['email' => $coordinator['email']],
                [
                    'first_name' => $coordinator['first_name'],
                    'middle_name' => null,
                    'last_name' => $coordinator['last_name'],
                    'email' => $coordinator['email'],
                    'password' => Hash::make('password123'),
                    'role' => 'Coordinator', // Standardize role for system consistency
                    'school_id' => $coordinator['school_id'],
                    'program' => $coordinator['programs'], // Store comprehensive program list
                ]
            );
            echo "✓ Created/Updated: {$coordinator['email']}\n";
            echo "  Programs: {$coordinator['programs']}\n\n";
        }

        echo "Real coordinator data with comprehensive program assignments has been updated!\n";
        echo "Total coordinators: " . count($coordinators) . "\n";
    }
}