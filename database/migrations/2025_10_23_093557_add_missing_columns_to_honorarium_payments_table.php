<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('honorarium_payments', function (Blueprint $table) {
            if (!Schema::hasColumn('honorarium_payments', 'panelist_name')) {
                $table->string('panelist_name')->nullable()->after('panelist_id');
            }
            if (!Schema::hasColumn('honorarium_payments', 'defense_date')) {
                $table->date('defense_date')->nullable()->after('payment_date');
            }
            if (!Schema::hasColumn('honorarium_payments', 'student_name')) {
                $table->string('student_name')->nullable()->after('defense_date');
            }
            if (!Schema::hasColumn('honorarium_payments', 'program')) {
                $table->string('program')->nullable()->after('student_name');
            }
            if (!Schema::hasColumn('honorarium_payments', 'defense_type')) {
                $table->string('defense_type')->nullable()->after('program');
            }
            if (!Schema::hasColumn('honorarium_payments', 'payment_status')) {
                $table->string('payment_status')->default('pending')->after('amount');
            }
            
            // Make panelist_id nullable
            $table->unsignedBigInteger('panelist_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('honorarium_payments', function (Blueprint $table) {
            $table->dropColumn([
                'panelist_name',
                'defense_date',
                'student_name',
                'program',
                'defense_type',
                'payment_status',
            ]);
        });
    }
};
