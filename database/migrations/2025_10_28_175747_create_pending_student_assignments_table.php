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
        Schema::create('pending_student_assignments', function (Blueprint $table) {
            $table->id();
            $table->string('student_email')->index();
            $table->unsignedBigInteger('adviser_id');
            $table->unsignedBigInteger('coordinator_id');
            $table->boolean('invitation_sent')->default(false);
            $table->timestamp('invitation_sent_at')->nullable();
            $table->timestamps();
            
            $table->foreign('adviser_id')->references('id')->on('advisers')->onDelete('cascade');
            $table->foreign('coordinator_id')->references('id')->on('users')->onDelete('cascade');
            
            // Ensure a student email can only be pending for one adviser at a time
            $table->unique('student_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pending_student_assignments');
    }
};
