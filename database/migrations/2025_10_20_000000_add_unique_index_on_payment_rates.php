<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('payment_rates', function (Blueprint $table) {
            // Prevent duplicates for the composite key
            $table->unique(['program_level', 'type', 'defense_type'], 'payment_rates_unique_combo');
        });
    }

    public function down(): void
    {
        Schema::table('payment_rates', function (Blueprint $table) {
            $table->dropUnique('payment_rates_unique_combo');
        });
    }
};