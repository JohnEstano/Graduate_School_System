<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('adviser_student', function (Blueprint $table) {
            // Add status and requested_by. Keep existing rows default to 'accepted' to preserve behavior.
            if (! Schema::hasColumn('adviser_student', 'status')) {
                $table->string('status')->default('accepted')->after('student_id');
            }
            if (! Schema::hasColumn('adviser_student', 'requested_by')) {
                $table->unsignedBigInteger('requested_by')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('adviser_student', function (Blueprint $table) {
            if (Schema::hasColumn('adviser_student', 'requested_by')) {
                $table->dropColumn('requested_by');
            }
            if (Schema::hasColumn('adviser_student', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
