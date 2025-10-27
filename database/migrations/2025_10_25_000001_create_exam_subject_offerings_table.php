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
            $table->string('program')->index();      // or program_id FK if you have one
            $table->string('school_year')->index();  // e.g. 2024-2025

            // Subject identity
            $table->string('subject_code')->nullable();
            $table->string('subject_name');

            // Coordinator-posted schedule (can be set/edited yearly)
            $table->date('exam_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();

            $table->boolean('is_active')->default(true)->index();

            $table->timestamps();

            $table->unique(['program', 'school_year', 'subject_code', 'subject_name'], 'uniq_offering_identity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_subject_offerings');
    }
};