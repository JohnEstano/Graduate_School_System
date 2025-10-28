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
        Schema::table('payment_submissions', function (Blueprint $table) {
            // Add exam_application_id column if it doesn't exist
            if (!Schema::hasColumn('payment_submissions', 'exam_application_id')) {
                $table->unsignedBigInteger('exam_application_id')->nullable()->after('student_id');
                $table->foreign('exam_application_id')
                    ->references('application_id')
                    ->on('exam_application')
                    ->nullOnDelete();
                $table->index('exam_application_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_submissions', function (Blueprint $table) {
            if (Schema::hasColumn('payment_submissions', 'exam_application_id')) {
                $table->dropForeign(['exam_application_id']);
                $table->dropColumn('exam_application_id');
            }
        });
    }
};
