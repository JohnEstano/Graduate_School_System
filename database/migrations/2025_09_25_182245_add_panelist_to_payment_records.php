<?php

// database/migrations/2025_09_26_add_panelist_to_payment_records.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('payment_records', function (Blueprint $table) {
            $table->unsignedBigInteger('panelist_record_id')->nullable()->after('student_record_id');

            $table->foreign('panelist_record_id')
                  ->references('id')
                  ->on('panelist_records')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('payment_records', function (Blueprint $table) {
            $table->dropForeign(['panelist_record_id']);
            $table->dropColumn('panelist_record_id');
        });
    }
};

