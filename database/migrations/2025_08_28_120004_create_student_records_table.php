<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('student_records', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('gender')->nullable();
            $table->string('program')->nullable(); // Added program column
            $table->string('school_year')->nullable();
            $table->string('student_id')->nullable()->unique();
            $table->string('course_section')->nullable();
            $table->date('birthdate')->nullable();
            $table->string('academic_status')->nullable();
            $table->string('or_number')->nullable(); // Added or_number column
            $table->date('payment_date')->nullable(); // Added payment_date column
            $table->timestamps(); 
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('student_records');
    }
};