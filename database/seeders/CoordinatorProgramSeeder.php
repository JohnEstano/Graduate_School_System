<?php

namespace Database\Seeders;

use App\Models\CoordinatorProgram;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class CoordinatorProgramSeeder extends Seeder
{
    /**
     * Seed data exposed at runtime as a fallback when DB tables are empty.
     */
    protected static array $seedData = [
        [
            'email' => 'pacosta@uic.edu.ph',
            'programs' => [
                'Doctor in Business Management',
                'Master in Business Administration (with Thesis)',
                'Master in Business Administration (Non-Thesis)',
                'Master in Business Administration for Health Professionals (Non-Thesis)',
            ],
        ],
        [
            'email' => 'gscoordinator_maed@uic.edu.ph',
            'programs' => [
                'Doctor of Philosophy in Education major in Counseling',
                'Doctor of Philosophy in Education major in Physical Education',
                'Doctor of Philosophy in Education major in Mathematics',
                'Master of Arts in Education major in Physical Education',
                'Master in Information Systems',
                'Master of Arts in Counseling',
            ],
        ],
        [
            'email' => 'gscoordinator_pharmacy@uic.edu.ph',
            'programs' => [
                'Doctor of Philosophy in Pharmacy',
                'Master of Science in Pharmacy',
                'Master of Science in Medical Technology',
            ],
        ],
        [
            'email' => 'gscoordinator_phd@uic.edu.ph',
            'programs' => [
                'Doctor of Philosophy in Education major in Applied Linguistics',
                'Doctor of Philosophy in Education major in Educational Leadership',
                'Doctor of Philosophy in Education major in Filipino',
                'Master of Arts in Education major in English',
                'Master of Arts in Education major in Filipino',
            ],
        ],
        [
            'email' => 'aalontaga@uic.edu.ph',
            'programs' => [
                'Master of Arts in Education major in Music Education',
            ],
        ],
        [
            'email' => 'vbadong@uic.edu.ph',
            'programs' => [
                'Master of Arts in Teaching Chemistry',
                'Master of Arts in Teaching Physics',
                'Master of Arts in Engineering Education major in Electronics and Communications Engineering',
                'Master of Arts in Engineering Education major in Civil Engineering',
                'Master of Arts in Elementary Education',
            ],
        ],
        [
            'email' => 'hbeltran@uic.edu.ph',
            'programs' => [
                'Doctor in Business Management with specialization in Information Systems',
                'Doctor of Philosophy in Education major in Information Technology Integration',
                'Master of Arts in Education major in Information Technology Integration',
                'Master in Information Systems',
                'Master in Information Technology',
            ],
        ],
        [
            'email' => 'talderite@uic.edu.ph',
            'programs' => [
                'Master of Arts in Educational Management',
                'Master of Arts in Elementary Education',
                'Master of Arts in Religious Education',
                'Master of Arts in Values Education',
                'Master of Arts in Education major in Mathematics',
                'Master of Arts in Education major in Sociology',
            ],
        ],
    ];

    public function run(): void
    {
        $coordinatorRoleId = Schema::hasTable('roles')
            ? Role::where('name', 'Coordinator')->value('id')
            : null;

        foreach (self::$seedData as $c) {
            if (empty($c['email']) || empty($c['programs']) || !is_array($c['programs'])) {
                continue;
            }

            // Do NOT over-filter by role_id; many envs have role_id null
            $user = User::where('email', $c['email'])->first();

            // Optional: second try with role_id if available
            if (! $user && $coordinatorRoleId) {
                $user = User::where('email', $c['email'])
                    ->where('role_id', $coordinatorRoleId)
                    ->first();
            }

            if (! $user) continue;

            foreach ($c['programs'] as $program) {
                $p = trim(preg_replace('/\s+/', ' ', (string) $program));
                if ($p === '') continue;

                CoordinatorProgram::firstOrCreate([
                    'coordinator_id' => $user->id,
                    'program'        => $p,
                ]);
            }
        }
    }

    /**
     * Runtime accessor: return programs for a coordinator email from the seed data.
     */
    public static function getProgramsByEmail(string $email): array
    {
        $emailLower = mb_strtolower(trim($email));
        foreach (self::$seedData as $c) {
            if (!isset($c['email'], $c['programs'])) continue;
            if (mb_strtolower(trim($c['email'])) === $emailLower) {
                return array_values(array_unique(array_map(
                    fn($p) => trim(preg_replace('/\s+/', ' ', (string) $p)),
                    $c['programs']
                )));
            }
        }
        return [];
    }
}