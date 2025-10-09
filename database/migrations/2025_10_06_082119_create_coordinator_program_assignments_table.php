<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('coordinator_program_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coordinator_user_id')->constrained('users')->onDelete('cascade');
            $table->string('program_name');
            $table->foreignId('assigned_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Prevent duplicate assignments (one coordinator per program)
            $table->unique(['coordinator_user_id', 'program_name'], 'coord_prog_unique');
            
            // Index for fast lookups
            $table->index('program_name', 'coord_prog_name_idx');
            $table->index(['coordinator_user_id', 'is_active'], 'coord_active_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coordinator_program_assignments');
    }
};
