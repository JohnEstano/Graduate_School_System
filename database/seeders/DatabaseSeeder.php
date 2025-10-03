<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Role;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the Graduate School database for tests and developments.
     */
    public function run(): void
    {
        // Disable foreign key checks
        \DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Truncate all relevant tables
        \DB::table('panelists')->truncate();
        \DB::table('users')->truncate();
        \DB::table('roles')->truncate();
        \DB::table('events')->truncate();
        \DB::table('defense_requests')->truncate();

        // Re-enable foreign key checks
        \DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Create Super Admin role
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);

        // Create Super Admin user
        User::create([
            'first_name' => 'Super',
            'middle_name' => null,
            'last_name' => 'Admin',
            'email' => 'superadmin@uic.edu.ph',
            'password' => Hash::make('supersecurepassword'),
            'role' => 'Super Admin',
            'role_id' => $superAdminRole->id,
            'school_id' => 'ADMIN001',
        ]);
    }
}
