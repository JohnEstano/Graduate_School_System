<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration removes unused legacy tables, messaging tables, and queue/password reset tables.
     * 
     * Removed tables:
     * - legacy_credentials: Old credential storage system (unused)
     * - legacy_record_caches: Old caching mechanism (unused)
     * - legacy_scraped_data: Parent table for old scraping system (replaced)
     * - legacy_clearance_data: Old clearance data (replaced by legacy_clearance_statuses)
     * - legacy_grades_data: Old grades storage (unused)
     * - defense_request_status_logs: Created but never implemented
     * - messages: Removed messaging feature
     * - message_participants: Removed messaging feature
     * - conversations: Removed messaging feature
     * - jobs: Queue system not used (running sync mode)
     * - job_batches: Batch jobs not used
     * - failed_jobs: Queue system not used
     * - password_reset_tokens: Password reset not implemented
     */
    public function up(): void
    {
        // Drop messaging tables with foreign keys first
        Schema::dropIfExists('messages');
        Schema::dropIfExists('message_participants');
        Schema::dropIfExists('conversations');
        
        // Drop legacy tables with foreign keys
        Schema::dropIfExists('legacy_clearance_data');
        Schema::dropIfExists('legacy_grades_data');
        
        // Then drop parent tables
        Schema::dropIfExists('legacy_scraped_data');
        Schema::dropIfExists('legacy_record_caches');
        Schema::dropIfExists('legacy_credentials');
        
        // Drop unused defense request status logs
        Schema::dropIfExists('defense_request_status_logs');
        
        // Drop unused queue and password reset tables
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('password_reset_tokens');
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

        // Recreate conversations table
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('private');
            $table->string('title')->nullable();
            $table->json('participants');
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
            $table->index('last_message_at');
        });

        // Recreate messages table
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('content');
            $table->string('type')->default('text');
            $table->json('metadata')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['conversation_id', 'created_at']);
        });

        // Recreate message_participants table
        Schema::create('message_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('last_read_at')->nullable();
            $table->timestamps();
            $table->unique(['conversation_id', 'user_id']);
        });

        // Recreate password_reset_tokens table
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // Recreate jobs table
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        // Recreate job_batches table
        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        // Recreate failed_jobs table
        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });
    }
};
