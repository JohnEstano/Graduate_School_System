<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the enum column to include 'paid'
        DB::statement("ALTER TABLE aa_payment_verifications MODIFY COLUMN status ENUM('pending', 'ready_for_finance', 'in_progress', 'paid', 'completed') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'paid' from the enum
        DB::statement("ALTER TABLE aa_payment_verifications MODIFY COLUMN status ENUM('pending', 'ready_for_finance', 'in_progress', 'completed') DEFAULT 'pending'");
    }
};
