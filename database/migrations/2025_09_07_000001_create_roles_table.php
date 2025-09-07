<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // student, coordinator, dean, admin assistant, registrar
            $table->timestamps();
        });

        // Seed base roles (idempotent)
        DB::table('roles')->insertOrIgnore([
            ['name' => 'Student'],
            ['name' => 'Coordinator'],
            ['name' => 'Dean'],
            ['name' => 'Administrative Assistant'],
            ['name' => 'Registrar'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};