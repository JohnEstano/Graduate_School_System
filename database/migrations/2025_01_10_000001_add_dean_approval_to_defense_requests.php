<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds dean approval fields to defense_requests table.
     * The dean now has final approval authority with option to delegate signature to coordinator.
     */
    public function up(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            // Dean approval status
            $table->string('dean_status', 50)->default('Pending')->after('coordinator_status');
            
            // Dean who approved
            $table->unsignedBigInteger('dean_approved_by')->nullable()->after('dean_status');
            $table->foreign('dean_approved_by')->references('id')->on('users')->onDelete('set null');
            
            // When dean approved
            $table->timestamp('dean_approved_at')->nullable()->after('dean_approved_by');
            
            // Whether coordinator signed on behalf of dean
            $table->boolean('coordinator_signed_on_behalf')->default(false)->after('dean_approved_at');
            
            // Dean's comments (optional)
            $table->text('dean_comments')->nullable()->after('coordinator_signed_on_behalf');
            
            // Path to dean-signed endorsement form
            $table->string('dean_endorsement_form', 500)->nullable()->after('dean_comments');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            $table->dropForeign(['dean_approved_by']);
            $table->dropColumn([
                'dean_status',
                'dean_approved_by',
                'dean_approved_at',
                'coordinator_signed_on_behalf',
                'dean_comments',
                'dean_endorsement_form',
            ]);
        });
    }
};
