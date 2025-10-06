<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class LegacyClearanceData extends Model
{
    use HasFactory;

    protected $fillable = [
        'legacy_scraped_data_id',
        'user_id',
        'semester_id',
        'semester_label',
        'clearance_id',
        'clearance_area_id',
        'clearance_area_label',
        'sort_order',
        'status_code',
        'requirements',
        'total_requirements',
        'cleared_requirements',
        'completion_percentage',
        'all_cleared',
        'scraped_at',
    ];

    protected $casts = [
        'requirements' => 'array',
        'total_requirements' => 'integer',
        'cleared_requirements' => 'integer',
        'completion_percentage' => 'decimal:2',
        'all_cleared' => 'boolean',
        'scraped_at' => 'datetime',
    ];

    /**
     * Get the parent scraped data record
     */
    public function scrapedData(): BelongsTo
    {
        return $this->belongsTo(LegacyScrapedData::class, 'legacy_scraped_data_id');
    }

    /**
     * Get the user that owns this clearance data
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get clearance data for a specific user and semester
     */
    public static function getForUserAndSemester(int $userId, string $semesterId)
    {
        return static::where('user_id', $userId)
            ->where('semester_id', $semesterId)
            ->orderBy('scraped_at', 'desc')
            ->get();
    }

    /**
     * Check if all clearance requirements are satisfied for a user
     */
    public static function isUserClearanceComplete(int $userId, ?string $semesterId = null): bool
    {
        $query = static::where('user_id', $userId);
        
        if ($semesterId) {
            $query->where('semester_id', $semesterId);
        }
        
        // Get the latest clearance data
        $latestData = $query->orderBy('scraped_at', 'desc')->get();
        
        // If no data found, assume not complete
        if ($latestData->isEmpty()) {
            return false;
        }
        
        // Check if all areas are cleared
        return $latestData->every(fn($area) => $area->all_cleared);
    }
}
