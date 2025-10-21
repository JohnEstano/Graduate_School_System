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
            $table->string('ai_detection_certificate')->nullable()->after('avisee_adviser_attachment');
            $table->string('endorsement_form')->nullable()->after('ai_detection_certificate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            $table->dropColumn(['ai_detection_certificate', 'endorsement_form']);
        });
    }
};
