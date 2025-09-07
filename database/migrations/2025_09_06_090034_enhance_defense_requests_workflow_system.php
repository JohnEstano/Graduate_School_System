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
        Schema::table('defense_requests', function (Blueprint $table) {
            // Enhanced workflow state management
            $table->string('workflow_state')->default('submitted')->change();
            
            // Adviser review fields
            $table->text('adviser_comments')->nullable()->after('workflow_state');
            $table->timestamp('adviser_reviewed_at')->nullable()->after('adviser_comments');
            $table->unsignedBigInteger('adviser_reviewed_by')->nullable()->after('adviser_reviewed_at');
            
            // Coordinator review fields
            $table->text('coordinator_comments')->nullable()->after('adviser_reviewed_by');
            $table->timestamp('coordinator_reviewed_at')->nullable()->after('coordinator_comments');
            $table->unsignedBigInteger('coordinator_reviewed_by')->nullable()->after('coordinator_reviewed_at');
            
            // General metadata
            $table->json('workflow_history')->nullable()->after('coordinator_reviewed_by');
            $table->timestamp('submitted_at')->nullable()->after('workflow_history');
            
            // Foreign key constraints
            $table->foreign('adviser_reviewed_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('coordinator_reviewed_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            $table->dropForeign(['adviser_reviewed_by']);
            $table->dropForeign(['coordinator_reviewed_by']);
            
            $table->dropColumn([
                'adviser_comments',
                'adviser_reviewed_at',
                'adviser_reviewed_by',
                'coordinator_comments',
                'coordinator_reviewed_at',
                'coordinator_reviewed_by',
                'workflow_history',
                'submitted_at'
            ]);
        });
    }
};
