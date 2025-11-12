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
        // For SQLite compatibility, we'll drop and recreate the column
        Schema::table('aa_payment_verifications', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('aa_payment_verifications', function (Blueprint $table) {
            $table->enum('status', ['pending', 'ready_for_finance', 'in_progress', 'paid', 'completed', 'invalid'])->default('pending')->after('batch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // For SQLite compatibility, we'll drop and recreate the column
        Schema::table('aa_payment_verifications', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('aa_payment_verifications', function (Blueprint $table) {
            $table->enum('status', ['pending', 'ready_for_finance', 'in_progress', 'paid', 'completed'])->default('pending')->after('batch_id');
        });
    }
};
