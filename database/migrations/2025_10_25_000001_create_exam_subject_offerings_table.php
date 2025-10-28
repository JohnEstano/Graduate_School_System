<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exam_subject_offerings', function (Blueprint $table) {
            $table->bigIncrements('id');

            // Who/what this applies to
            // Reduced length for MySQL index limit (191 chars for utf8mb4)
            $table->string('program', 191)->index();      // or program_id FK if you have one
            $table->string('school_year', 20)->index();  // e.g. 2024-2025

            // Subject identity
            // Reduced length for MySQL index limit
            $table->string('subject_code', 50)->nullable();
            $table->string('subject_name', 191);

            // Coordinator-posted schedule (can be set/edited yearly)
            $table->date('exam_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();

            $table->boolean('is_active')->default(true)->index();

            $table->timestamps();

            // Unique constraint with limited column lengths to avoid MySQL key length limit
            // Total: 191 + 20 + 50 + 191 = 452 characters * 4 bytes (utf8mb4) = 1808 bytes (well under 3072 limit)
            $table->unique(['program', 'school_year', 'subject_code', 'subject_name'], 'uniq_offering_identity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_subject_offerings');
    }
};