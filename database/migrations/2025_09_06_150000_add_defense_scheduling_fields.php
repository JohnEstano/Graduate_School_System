<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            // Professional Defense Scheduling Fields
            $table->datetime('scheduled_date')->nullable()->after('date_of_defense');
            $table->time('scheduled_time')->nullable()->after('scheduled_date');
            $table->string('defense_mode')->nullable()->after('scheduled_time'); // 'face-to-face' or 'online'
            $table->string('defense_venue')->nullable()->after('defense_mode'); // Room/Link for defense
            $table->text('scheduling_notes')->nullable()->after('defense_venue');
            
            // Panel Assignment Tracking
            $table->datetime('panels_assigned_at')->nullable()->after('scheduling_notes');
            $table->unsignedBigInteger('panels_assigned_by')->nullable()->after('panels_assigned_at');
            $table->datetime('schedule_set_at')->nullable()->after('panels_assigned_by');
            $table->unsignedBigInteger('schedule_set_by')->nullable()->after('schedule_set_at');
            
            // Notification Tracking
            $table->datetime('adviser_notified_at')->nullable()->after('schedule_set_by');
            $table->datetime('student_notified_at')->nullable()->after('adviser_notified_at');
            $table->datetime('panels_notified_at')->nullable()->after('student_notified_at');
            
            // Professional Status Tracking
            $table->enum('scheduling_status', [
                'pending-panels', 
                'panels-assigned', 
                'scheduled', 
                'confirmed', 
                'in-progress', 
                'completed',
                'rescheduled'
            ])->default('pending-panels')->after('panels_notified_at');
            
            // Add foreign key constraints
            $table->foreign('panels_assigned_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('schedule_set_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('defense_requests', function (Blueprint $table) {
            $table->dropForeign(['panels_assigned_by']);
            $table->dropForeign(['schedule_set_by']);
            
            $table->dropColumn([
                'scheduled_date',
                'scheduled_time', 
                'defense_mode',
                'defense_venue',
                'scheduling_notes',
                'panels_assigned_at',
                'panels_assigned_by',
                'schedule_set_at',
                'schedule_set_by',
                'adviser_notified_at',
                'student_notified_at',
                'panels_notified_at',
                'scheduling_status'
            ]);
        });
    }
};
