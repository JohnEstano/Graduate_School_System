<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the Graduate School database for tests and developments.
     */
    public function run(): void
    {
        // You can truncate tables here if you want a clean slate
        // \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        // \App\Models\User::truncate();
        // \App\Models\DefenseRequest::truncate();
        // \App\Models\Panelist::truncate();
        // \DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->call([
            DefenseRequestSeeder::class,
          
        ]);
    }
}
