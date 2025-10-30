<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_application_subject', function (Blueprint $table) {
            if (!Schema::hasColumn('exam_application_subject', 'score')) {
                $table->unsignedTinyInteger('score')->nullable()->after('subject_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('exam_application_subject', function (Blueprint $table) {
            if (Schema::hasColumn('exam_application_subject', 'score')) {
                $table->dropColumn('score');
            }
        });
    }
};
