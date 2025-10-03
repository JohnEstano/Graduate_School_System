<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('coordinator_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coordinator_id')->constrained('users')->cascadeOnDelete();
            $table->string('program'); // matches users.program string
            $table->timestamps();
            $table->unique(['coordinator_id', 'program']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coordinator_programs');
    }
};