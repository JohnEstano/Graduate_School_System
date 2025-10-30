<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_application', function (Blueprint $table) {
            if (!Schema::hasColumn('exam_application', 'average_score')) {
                $table->unsignedTinyInteger('average_score')->nullable()->after('final_approval_status');
            }
            if (!Schema::hasColumn('exam_application', 'result_status')) {
                $table->string('result_status', 20)->nullable()->after('average_score'); // 'passed' | 'failed'
            }
        });
    }

    public function down(): void
    {
        Schema::table('exam_application', function (Blueprint $table) {
            if (Schema::hasColumn('exam_application', 'result_status')) {
                $table->dropColumn('result_status');
            }
            if (Schema::hasColumn('exam_application', 'average_score')) {
                $table->dropColumn('average_score');
            }
        });
    }
};
