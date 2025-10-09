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
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('legacy_account_id')->nullable()->after('school_id');
            $table->string('student_number_legacy')->nullable()->after('legacy_account_id')->comment('Legacy student number from clearance API');
            $table->string('degree_code')->nullable()->after('program')->comment('Degree code from legacy system');
            $table->unsignedInteger('degree_program_id')->nullable()->after('degree_code')->comment('Legacy degree program ID');
            $table->string('year_level')->nullable()->after('degree_program_id')->comment('Year level from legacy system');
            $table->string('balance')->nullable()->after('year_level')->comment('Current balance from clearance API (e.g., "Php 51968.54")');
            $table->unsignedInteger('clearance_statuscode')->nullable()->after('balance')->comment('Clearance statuscode from API (3300=has balance, etc.)');
            $table->timestamp('legacy_data_synced_at')->nullable()->comment('Last time legacy account data was synced');
            
            // Add index for faster lookups
            $table->index('legacy_account_id');
            $table->index('student_number_legacy');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['legacy_account_id']);
            $table->dropIndex(['student_number_legacy']);
            $table->dropColumn([
                'legacy_account_id',
                'student_number_legacy',
                'degree_code',
                'degree_program_id',
                'year_level',
                'balance',
                'clearance_statuscode',
                'legacy_data_synced_at'
            ]);
        });
    }
};
