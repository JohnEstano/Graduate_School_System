<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('exam_application_subject', function (Blueprint $table) {
            // Only add columns that don't already exist
            // Note: subject_code, subject_name, status, remarks already exist from create migration
            
            // New normalized reference (skip if added by later migration)
            if (!Schema::hasColumn('exam_application_subject', 'offering_id')) {
                $table->unsignedBigInteger('offering_id')->nullable()->after('application_id');
                $table->foreign('offering_id')->references('id')->on('exam_subject_offerings')->nullOnDelete();
            }

            // Denormalized copies for exam schedule (NEW columns only)
            if (!Schema::hasColumn('exam_application_subject', 'exam_date')) {
                $table->date('exam_date')->nullable()->after('subject_name');
            }
            if (!Schema::hasColumn('exam_application_subject', 'start_time')) {
                $table->time('start_time')->nullable()->after('exam_date');
            }
            if (!Schema::hasColumn('exam_application_subject', 'end_time')) {
                $table->time('end_time')->nullable()->after('start_time');
            }
        });
    }

    public function down(): void
    {
        Schema::table('exam_application_subject', function (Blueprint $table) {
            // Only drop columns that this migration actually added
            if (Schema::hasColumn('exam_application_subject', 'offering_id')) {
                $table->dropForeign(['offering_id']);
                $table->dropColumn('offering_id');
            }
            if (Schema::hasColumn('exam_application_subject', 'exam_date')) {
                $table->dropColumn('exam_date');
            }
            if (Schema::hasColumn('exam_application_subject', 'start_time')) {
                $table->dropColumn('start_time');
            }
            if (Schema::hasColumn('exam_application_subject', 'end_time')) {
                $table->dropColumn('end_time');
            }
        });
    }
};