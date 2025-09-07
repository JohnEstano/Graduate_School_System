<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_application', function (Blueprint $table) {
            $table->text('remarks')
                  ->nullable()
                  ->collation('utf8mb4_unicode_ci')
                  ->after('office_address'); // put it after office_address, adjust if you like
        });
    }

    public function down(): void
    {
        Schema::table('exam_application', function (Blueprint $table) {
            $table->dropColumn('remarks');
        });
    }
};
