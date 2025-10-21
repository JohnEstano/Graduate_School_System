<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoordinatorProgramAssignment extends Model
{
    protected $fillable = [
        'coordinator_user_id',
        'program_name',
        'assigned_by',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the coordinator user
     */
    public function coordinator()
    {
        return $this->belongsTo(User::class, 'coordinator_user_id');
    }

    /**
     * Get the user who assigned this program
     */
    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    /**
     * Get the coordinator for a specific program
     */
    public static function getCoordinatorForProgram(string $programName): ?User
    {
        $assignment = self::where('program_name', $programName)
            ->where('is_active', true)
            ->with('coordinator')
            ->first();

        return $assignment?->coordinator;
    }

    /**
     * Get all programs assigned to a coordinator
     */
    public static function getProgramsForCoordinator(int $coordinatorUserId): array
    {
        return self::where('coordinator_user_id', $coordinatorUserId)
            ->where('is_active', true)
            ->pluck('program_name')
            ->toArray();
    }
}

