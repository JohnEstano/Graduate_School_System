<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDefenseRequestCancellationsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('defense_request_cancellations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('defense_request_id');
            $table->unsignedBigInteger('cancelled_by'); // user id
            $table->string('reason');
            $table->timestamps();

            $table->foreign('defense_request_id')->references('id')->on('defense_requests')->onDelete('cascade');
            $table->foreign('cancelled_by')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('defense_request_cancellations');
    }
};
