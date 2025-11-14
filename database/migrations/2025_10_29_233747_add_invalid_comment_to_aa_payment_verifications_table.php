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
        Schema::table('aa_payment_verifications', function (Blueprint $table) {
            $table->text('invalid_comment')->nullable()->after('remarks');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aa_payment_verifications', function (Blueprint $table) {
            $table->dropColumn('invalid_comment');
        });
    }
};
