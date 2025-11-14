<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration removes unused legacy tables that were part of an old
     * scraping system that has been replaced by the newer UIC API integration.
     * 
     * Removed tables:
     * - legacy_credentials: Old credential storage system (unused)
     * - legacy_record_caches: Old caching mechanism (unused)
     * - legacy_scraped_data: Parent table for old scraping system (replaced)
     * - legacy_clearance_data: Old clearance data (replaced by legacy_clearance_statuses)
     * - legacy_grades_data: Old grades storage (unused)
     * - defense_request_status_logs: Created but never implemented
     */
    public function up(): void
    {
        // Drop tables with foreign keys first
        Schema::dropIfExists('legacy_clearance_data');
        Schema::dropIfExists('legacy_grades_data');
        
        // Then drop parent tables
        Schema::dropIfExists('legacy_scraped_data');
        Schema::dropIfExists('legacy_record_caches');
        Schema::dropIfExists('legacy_credentials');
        
        // Drop unused defense request status logs
        Schema::dropIfExists('defense_request_status_logs');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate legacy_credentials table
        Schema::create('legacy_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('legacy_username');
            $table->text('encrypted_password');
            $table->timestamp('linked_at')->nullable();
            $table->timestamp('last_verified_at')->nullable();
            $table->timestamps();
            $table->unique('user_id');
        });

        // Recreate legacy_record_caches table
        Schema::create('legacy_record_caches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('record_type');
            $table->json('data');
            $table->timestamp('fetched_at');
            $table->timestamps();
        });

        // Recreate legacy_scraped_data table
        Schema::create('legacy_scraped_data', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('student_number')->nullable();
            $table->string('full_name')->nullable();
            $table->string('program')->nullable();
            $table->string('curriculum')->nullable();
            $table->string('student_type')->nullable();
            $table->string('level')->nullable();
            $table->string('block')->nullable();
            $table->string('year_level')->nullable();
            $table->string('major')->nullable();
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Recreate legacy_clearance_data table
        Schema::create('legacy_clearance_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('legacy_scraped_data_id')->constrained('legacy_scraped_data')->onDelete('cascade');
            $table->string('office')->nullable();
            $table->string('status')->nullable();
            $table->string('remarks')->nullable();
            $table->string('semester')->nullable();
            $table->string('school_year')->nullable();
            $table->timestamps();
        });

        // Recreate legacy_grades_data table
        Schema::create('legacy_grades_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('legacy_scraped_data_id')->constrained('legacy_scraped_data')->onDelete('cascade');
            $table->string('course_code')->nullable();
            $table->string('course_description')->nullable();
            $table->string('units')->nullable();
            $table->string('grade')->nullable();
            $table->string('remarks')->nullable();
            $table->string('semester')->nullable();
            $table->string('school_year')->nullable();
            $table->timestamps();
        });

        // Recreate defense_request_status_logs table
        Schema::create('defense_request_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('defense_request_id')->constrained()->onDelete('cascade');
            $table->string('old_status')->nullable();
            $table->string('new_status');
            $table->foreignId('changed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
};
