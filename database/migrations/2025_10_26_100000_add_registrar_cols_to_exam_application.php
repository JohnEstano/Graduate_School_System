<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('exam_application', 'registrar_status')) {
            Schema::table('exam_application', function (Blueprint $table) {
                $table->string('registrar_status')->nullable()->after('final_approval_status'); // pending|approved|rejected
                $table->text('registrar_reason')->nullable()->after('registrar_status');
                $table->unsignedBigInteger('registrar_reviewer_id')->nullable()->after('registrar_reason');
                $table->timestamp('registrar_reviewed_at')->nullable()->after('registrar_reviewer_id');
                // Optional: who approved last
                if (!Schema::hasColumn('exam_application', 'approved_by')) {
                    $table->string('approved_by')->nullable()->after('registrar_reviewed_at');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('exam_application', function (Blueprint $table) {
            if (Schema::hasColumn('exam_application', 'registrar_status')) {
                $table->dropColumn(['registrar_status', 'registrar_reason', 'registrar_reviewer_id', 'registrar_reviewed_at']);
            }
            if (Schema::hasColumn('exam_application', 'approved_by')) {
                $table->dropColumn('approved_by');
            }
        });
    }
};