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
            // Add professional duration fields
            $table->time('scheduled_end_time')->nullable()->after('scheduled_time');
            $table->integer('defense_duration_minutes')->nullable()->after('scheduled_end_time'); // Duration in minutes (e.g., 120 for 2 hours)
            $table->string('formatted_time_range')->nullable()->after('defense_duration_minutes'); // Human-readable "12:00 PM - 2:00 PM"
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            $table->dropColumn([
                'scheduled_end_time',
                'defense_duration_minutes', 
                'formatted_time_range'
            ]);
        });
    }
};
