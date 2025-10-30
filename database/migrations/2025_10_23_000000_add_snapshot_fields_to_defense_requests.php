<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            $table->json('previous_schedule_snapshot')->nullable()->after('workflow_history');
            $table->json('previous_panels_snapshot')->nullable()->after('previous_schedule_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            $table->dropColumn(['previous_schedule_snapshot', 'previous_panels_snapshot']);
        });
    }
};
