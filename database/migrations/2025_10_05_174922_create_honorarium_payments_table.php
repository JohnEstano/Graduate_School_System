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
        Schema::create('honorarium_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('defense_request_id');
            $table->unsignedBigInteger('panelist_id');
            $table->string('panelist_type')->default('Panelist'); // 'Panelist' or 'Faculty'
            $table->string('role'); // Chairperson/Panel Member
            $table->decimal('amount', 10, 2)->default(0);
            $table->date('payment_date')->nullable();
            $table->string('status')->default('Unpaid'); // Paid/Unpaid
            $table->timestamps();

            $table->foreign('defense_request_id')->references('id')->on('defense_requests')->onDelete('cascade');
            $table->foreign('panelist_id')->references('id')->on('panelists')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('honorarium_payments');
    }
};
