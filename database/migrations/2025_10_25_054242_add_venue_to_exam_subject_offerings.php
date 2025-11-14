[<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('exam_subject_offerings', function (Blueprint $table) {
            $table->string('venue')->nullable()->after('end_time');
        });
    }

    public function down(): void
    {
        Schema::table('exam_subject_offerings', function (Blueprint $table) {
            $table->dropColumn('venue');
        });
    }
};