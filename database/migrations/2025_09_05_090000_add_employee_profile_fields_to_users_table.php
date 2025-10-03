<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'employee_id')) {
                $table->unsignedBigInteger('employee_id')->nullable()->after('school_id');
            }
            if (!Schema::hasColumn('users', 'employee_department_code')) {
                $table->string('employee_department_code', 32)->nullable()->after('employee_id');
            }
            if (!Schema::hasColumn('users', 'employee_photo_url')) {
                $table->string('employee_photo_url', 255)->nullable()->after('employee_department_code');
            }
            if (!Schema::hasColumn('users', 'employee_profile_fetched_at')) {
                $table->timestamp('employee_profile_fetched_at')->nullable()->after('employee_photo_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'employee_profile_fetched_at')) $table->dropColumn('employee_profile_fetched_at');
            if (Schema::hasColumn('users', 'employee_photo_url')) $table->dropColumn('employee_photo_url');
            if (Schema::hasColumn('users', 'employee_department_code')) $table->dropColumn('employee_department_code');
            if (Schema::hasColumn('users', 'employee_id')) $table->dropColumn('employee_id');
        });
    }
};
