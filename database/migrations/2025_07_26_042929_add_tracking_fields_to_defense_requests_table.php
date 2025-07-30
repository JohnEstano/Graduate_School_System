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
        Schema::table('defense_requests', function (Blueprint $table) {
            $table->string('status')->default('Pending');
            $table->string('priority')->default('Medium');
            $table->timestamp('last_status_updated_at')->nullable();
            $table->foreignId('last_status_updated_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            $table->dropColumn(['status', 'priority', 'last_status_updated_at', 'last_status_updated_by', 'updated_by']);
        });
    }
};
