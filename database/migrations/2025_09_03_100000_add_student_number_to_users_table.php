<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'student_number')) {
                $table->string('student_number', 32)->nullable()->after('id');
                $table->unique('student_number');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'student_number')) {
                $table->dropUnique(['student_number']);
                $table->dropColumn('student_number');
            }
        });
    }
};
