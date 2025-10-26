<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aa_payment_verifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('defense_request_id');
            $table->unsignedBigInteger('assigned_to')->nullable(); // AA user id
            $table->unsignedBigInteger('batch_id')->nullable();
            $table->enum('status', ['pending', 'ready_for_finance', 'in_progress', 'paid', 'completed'])->default('pending');

            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('defense_request_id')->references('id')->on('defense_requests')->onDelete('cascade');
            $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
            $table->foreign('batch_id')->references('id')->on('aa_payment_batches')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aa_payment_verifications');
    }
};
