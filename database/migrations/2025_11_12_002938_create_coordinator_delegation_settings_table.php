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
        Schema::create('coordinator_delegation_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dean_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('coordinator_id')->constrained('users')->onDelete('cascade');
            $table->string('program')->nullable(); // Program coordinator manages
            $table->boolean('can_sign_on_behalf')->default(false); // Dean allows coordinator to sign with dean's signature
            $table->timestamps();
            
            // Unique constraint: one setting per dean-coordinator pair
            $table->unique(['dean_id', 'coordinator_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coordinator_delegation_settings');
    }
};
