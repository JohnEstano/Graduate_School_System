<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration adds coordinator assignment tracking to defense requests.
     * When an adviser approves a defense request, it will be automatically assigned
     * to the coordinator responsible for that program based on CoordinatorProgramService.
     */
    public function up(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            // Add coordinator_user_id column (the column that should track which coordinator is assigned)
            $table->foreignId('coordinator_user_id')->nullable()->after('adviser_user_id')
                ->constrained('users')
                ->nullOnDelete()
                ->comment('The coordinator assigned to oversee this defense request');
            
            // Coordinator assignment tracking
            $table->timestamp('coordinator_assigned_at')->nullable()->after('coordinator_reviewed_at')
                ->comment('When the coordinator was automatically assigned');
            
            $table->foreignId('coordinator_assigned_by')->nullable()->after('coordinator_assigned_at')
                ->constrained('users')
                ->nullOnDelete()
                ->comment('Who triggered the coordinator assignment (usually the approving adviser)');
            
            // Optional: Track if coordinator was manually reassigned by super admin
            $table->boolean('coordinator_manually_assigned')->default(false)->after('coordinator_assigned_by')
                ->comment('True if super admin manually reassigned, false if auto-assigned');
            
            $table->text('coordinator_assignment_notes')->nullable()->after('coordinator_manually_assigned')
                ->comment('Notes about coordinator assignment or reassignment');
            
            // Add indexes for performance
            $table->index(['program', 'workflow_state'], 'idx_defense_requests_program_state');
            $table->index(['coordinator_user_id', 'workflow_state'], 'idx_defense_requests_coord_state');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            // Drop foreign keys FIRST (before dropping indexes and columns)
            $table->dropForeign(['coordinator_user_id']);
            $table->dropForeign(['coordinator_assigned_by']);
            
            // Drop indexes
            $table->dropIndex('idx_defense_requests_program_state');
            $table->dropIndex('idx_defense_requests_coord_state');
            
            // Drop columns
            $table->dropColumn([
                'coordinator_user_id',
                'coordinator_assigned_at',
                'coordinator_assigned_by',
                'coordinator_manually_assigned',
                'coordinator_assignment_notes'
            ]);
        });
    }
};
