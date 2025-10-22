<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payment_records', function (Blueprint $table) {
            $table->unsignedBigInteger('defense_request_id')->nullable()->after('panelist_record_id');
            $table->foreign('defense_request_id')->references('id')->on('defense_requests')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_records', function (Blueprint $table) {
            $table->dropForeign(['defense_request_id']);
            $table->dropColumn('defense_request_id');
        });
    }
};
