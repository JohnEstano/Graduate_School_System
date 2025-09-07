<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_application', function (Blueprint $table) {
            // add updated_at, allow it to be null at first
            $table->timestamp('updated_at')->nullable()->after('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('exam_application', function (Blueprint $table) {
            $table->dropColumn('updated_at');
        });
    }
};
