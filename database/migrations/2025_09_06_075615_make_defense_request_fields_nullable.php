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
            // Make fields nullable that should be filled by coordinator later
            $table->date('date_of_defense')->nullable()->change();
            $table->string('mode_defense')->nullable()->change();
            $table->string('defense_chairperson')->nullable()->change();
            $table->string('defense_panelist1')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            // Revert to non-nullable (be careful with existing data)
            $table->date('date_of_defense')->nullable(false)->change();
            $table->string('mode_defense')->nullable(false)->change();
            $table->string('defense_chairperson')->nullable(false)->change();
            $table->string('defense_panelist1')->nullable(false)->change();
        });
    }
};
