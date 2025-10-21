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
        Schema::create('legacy_grades_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('legacy_scraped_data_id')->constrained('legacy_scraped_data')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('semester_id');
            $table->string('semester_label');
            $table->string('course_code');
            $table->string('course_title');
            $table->string('rating_show')->nullable(); // The actual grade shown
            $table->decimal('rating_numeric', 5, 2)->nullable(); // Numeric version if applicable
            $table->boolean('is_incomplete')->default(false); // True if grade is '40' or empty
            $table->string('section')->nullable();
            $table->string('unit_type')->nullable();
            $table->decimal('prelim', 5, 2)->nullable();
            $table->decimal('midterm', 5, 2)->nullable();
            $table->decimal('finals', 5, 2)->nullable();
            $table->json('raw_grade_data')->nullable(); // Store the full raw data
            $table->timestamp('scraped_at');
            $table->timestamps();
            
            // Indexes
            $table->index(['user_id', 'semester_id']);
            $table->index(['course_code']);
            $table->index(['is_incomplete']);
            $table->index(['rating_show']);
            $table->index(['scraped_at']);
            
            // Unique constraint to prevent duplicates
            $table->unique(['user_id', 'semester_id', 'course_code'], 'unique_user_semester_course');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legacy_grades_data');
    }
};
