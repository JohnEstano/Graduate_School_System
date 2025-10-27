<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class CoordinatorProgramAssignment extends Model
{
    // ensure this matches your DB table name
    protected $table = 'coordinator_program_assignments';

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
    public function coordinator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coordinator_user_id');
    }

    /**
     * Get the user who assigned this program
     */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    /**
     * Get the coordinator for a specific program (case-insensitive)
     */
    public static function getCoordinatorForProgram(string $programName): ?User
    {
        $p = mb_strtolower(trim(preg_replace('/\s+/', ' ', $programName)));

        $assignment = self::whereRaw("LOWER(TRIM(REGEXP_REPLACE(program_name, '\\s+', ' '))) = ?", [$p])
            ->where('is_active', true)
            ->with('coordinator')
            ->first();

        return $assignment?->coordinator;
    }

    /**
     * Get all programs assigned to a coordinator (normalized)
     */
    public static function getProgramsForCoordinator(int $coordinatorUserId): array
    {
        $programs = self::where('coordinator_user_id', $coordinatorUserId)
            ->where('is_active', true)
            ->pluck('program_name')
            ->toArray();

        // normalize whitespace and trim
        return array_values(array_unique(array_map(function ($p) {
            return trim(preg_replace('/\s+/', ' ', (string) $p));
        }, $programs)));
    }
}

