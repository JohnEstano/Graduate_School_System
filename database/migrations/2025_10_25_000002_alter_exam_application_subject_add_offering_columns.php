<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('exam_application_subject', function (Blueprint $table) {
            // New normalized reference
            $table->unsignedBigInteger('offering_id')->nullable()->after('application_id');

            // Denormalized copies (for reporting/export)
            $table->string('subject_code')->nullable()->after('offering_id');
            $table->string('subject_name')->nullable()->after('subject_code');
            $table->date('exam_date')->nullable()->after('subject_name');
            $table->time('start_time')->nullable()->after('exam_date');
            $table->time('end_time')->nullable()->after('start_time');

            // Review metadata
            $table->string('status')->nullable()->after('end_time'); // pending/approved/rejected etc.
            $table->text('remarks')->nullable()->after('status');

            // FK and indexes
            $table->foreign('offering_id')->references('id')->on('exam_subject_offerings')->nullOnDelete();
            $table->index(['application_id', 'status'], 'exam_app_subj_app_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('exam_application_subject', function (Blueprint $table) {
            $table->dropIndex('exam_app_subj_app_status_idx');
            $table->dropForeign(['offering_id']);
            $table->dropColumn(['offering_id', 'subject_code', 'subject_name', 'exam_date', 'start_time', 'end_time', 'status', 'remarks']);
        });
    }
};