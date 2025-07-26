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
        Schema::create('defense_request_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('defense_request_id')->constrained()->onDelete('cascade');
            $table->string('status');
            $table->string('priority')->nullable();
            $table->foreignId('updated_by')->constrained('users');
            $table->timestamp('updated_at');
            $table->text('remarks')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('defense_request_status_logs');
    }
};
