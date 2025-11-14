<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('exam_application_subject', function (Blueprint $table) {
            if (!Schema::hasColumn('exam_application_subject', 'offering_id')) {
                $table->unsignedBigInteger('offering_id')->nullable()->after('application_id')->index();
                $table->foreign('offering_id')
                    ->references('id')->on('exam_subject_offerings')
                    ->nullOnDelete(); // if offering removed, keep snapshot
            }
        });
    }

    public function down(): void
    {
        Schema::table('exam_application_subject', function (Blueprint $table) {
            if (Schema::hasColumn('exam_application_subject', 'offering_id')) {
                $table->dropForeign(['offering_id']);
                $table->dropColumn('offering_id');
            }
        });
    }
};