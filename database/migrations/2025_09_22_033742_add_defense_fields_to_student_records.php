<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_records', function (Blueprint $table) {
            $table->date('defense_date')->nullable()->after('payment_date'); 
            $table->string('defense_type')->nullable()->after('defense_date'); 
        });
    }

    public function down(): void
    {
        Schema::table('student_records', function (Blueprint $table) {
            $table->dropColumn(['defense_date', 'defense_type']);
        });
    }
};
