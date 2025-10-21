<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('defense_requests', 'status')) {
                $table->string('status')->default('Pending')->after('defense_panelist4');
            }
            if (!Schema::hasColumn('defense_requests', 'priority')) {
                $table->string('priority')->default('Medium')->after('status');
            }
            if (!Schema::hasColumn('defense_requests', 'last_status_updated_at')) {
                $table->timestamp('last_status_updated_at')->nullable()->after('priority');
            }
            if (!Schema::hasColumn('defense_requests', 'last_status_updated_by')) {
                $table->foreignId('last_status_updated_by')->nullable()->after('last_status_updated_at')->constrained('users');
            }
            if (!Schema::hasColumn('defense_requests', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->after('last_status_updated_by')->constrained('users');
            }
        });
    }

    public function down(): void
    {
        // Do not drop in down to avoid accidental data loss; intentionally left blank or could drop conditionally
    }
};
