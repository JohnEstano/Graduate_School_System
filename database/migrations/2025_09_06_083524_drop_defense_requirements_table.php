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
        // Drop the old defense_requirements table as data has been consolidated into defense_requests
        Schema::dropIfExists('defense_requirements');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the defense_requirements table if rollback is needed
        Schema::create('defense_requirements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('school_id');
            $table->string('program');
            $table->string('thesis_title');
            $table->string('adviser');
            $table->string('defense_type');
            $table->string('status')->default('pending');
            $table->string('rec_endorsement')->nullable();
            $table->string('proof_of_payment')->nullable();
            $table->string('reference_no')->nullable();
            $table->string('manuscript_proposal')->nullable();
            $table->string('similarity_index')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};
