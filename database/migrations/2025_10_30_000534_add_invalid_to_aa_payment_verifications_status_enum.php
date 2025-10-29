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
        // Laravel doesn't support modifying ENUMs directly, so we need to use raw SQL
        DB::statement("ALTER TABLE aa_payment_verifications MODIFY COLUMN status ENUM('pending', 'ready_for_finance', 'in_progress', 'paid', 'completed', 'invalid') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'invalid' from the ENUM
        DB::statement("ALTER TABLE aa_payment_verifications MODIFY COLUMN status ENUM('pending', 'ready_for_finance', 'in_progress', 'paid', 'completed') DEFAULT 'pending'");
    }
};
