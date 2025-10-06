<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Role;
use App\Models\User;
use App\Models\ProgramRecord; // <-- add this line

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the Graduate School database for tests and developments.
     */
    public function run(): void
    {
    



        $this->call(HonorariumFullDemoSeeder::class);
    }
}
