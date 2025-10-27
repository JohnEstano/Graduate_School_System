<?php
// filepath: c:\GSURS\Graduate_School_System-1\database\migrations\2025_10_26_000002_add_final_reason_to_exam_application.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('exam_application', function (Blueprint $t) {
            if (!Schema::hasColumn('exam_application', 'final_approval_reason')) {
                $t->string('final_approval_reason', 500)->nullable()->after('final_approval_date');
            }
        });
    }
    public function down(): void
    {
        Schema::table('exam_application', function (Blueprint $t) {
            if (Schema::hasColumn('exam_application', 'final_approval_reason')) {
                $t->dropColumn('final_approval_reason');
            }
        });
    }
};