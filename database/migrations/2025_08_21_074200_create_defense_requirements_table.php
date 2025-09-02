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
            $table->string('status')->default('pending');
            $table->string('reference_no')->nullable();
            $table->string('rec_endorsement')->nullable();
            $table->string('proof_of_payment')->nullable();
            $table->string('manuscript_proposal')->nullable();
            $table->string('similarity_index')->nullable();
            $table->string('defense_type')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('defense_requirements');
    }
};
