<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('defense_requests','adviser_user_id')) {
                $table->unsignedBigInteger('adviser_user_id')->nullable()->after('defense_adviser');
            }
            if (!Schema::hasColumn('defense_requests','assigned_to_user_id')) {
                $table->unsignedBigInteger('assigned_to_user_id')->nullable()->after('adviser_user_id');
            }
            if (!Schema::hasColumn('defense_requests','workflow_state')) {
                $table->string('workflow_state', 40)->default('adviser-review')->after('assigned_to_user_id');
            }
            $table->index(['workflow_state']);
            $table->index(['assigned_to_user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            if (Schema::hasColumn('defense_requests','workflow_state')) $table->dropColumn('workflow_state');
            if (Schema::hasColumn('defense_requests','assigned_to_user_id')) $table->dropColumn('assigned_to_user_id');
            if (Schema::hasColumn('defense_requests','adviser_user_id')) $table->dropColumn('adviser_user_id');
        });
    }
};
