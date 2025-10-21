<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class LegacyScrapedData extends Model
{
    use HasFactory;

    protected $table = 'legacy_scraped_data';

    protected $fillable = [
        'user_id',
        'school_id',
        'current_semester_id',
        'semesters_data',
        'student_info',
        'init_params',
        'scraping_success',
        'scraping_errors',
        'scraped_at',
    ];

    protected $casts = [
        'semesters_data' => 'array',
        'student_info' => 'array',
        'init_params' => 'array',
        'scraping_errors' => 'array',
        'scraping_success' => 'boolean',
        'scraped_at' => 'datetime',
    ];

    /**
     * Get the user that owns this scraped data
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all clearance data associated with this scraping session
     */
    public function clearanceData(): HasMany
    {
        return $this->hasMany(LegacyClearanceData::class);
    }

    /**
     * Get all grades data associated with this scraping session
     */
    public function gradesData(): HasMany
    {
        return $this->hasMany(LegacyGradesData::class);
    }

    /**
     * Get the latest scraped data for a user
     */
    public static function getLatestForUser(int $userId): ?self
    {
        return static::where('user_id', $userId)
            ->orderBy('scraped_at', 'desc')
            ->first();
    }

    /**
     * Check if the data is considered fresh (less than 1 hour old)
     */
    public function isFresh(): bool
    {
        return $this->scraped_at && $this->scraped_at->diffInMinutes(now()) < 60;
    }
}
