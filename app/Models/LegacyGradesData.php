<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class LegacyGradesData extends Model
{
    use HasFactory;

    protected $fillable = [
        'legacy_scraped_data_id',
        'user_id',
        'semester_id',
        'semester_label',
        'course_code',
        'course_title',
        'rating_show',
        'rating_numeric',
        'is_incomplete',
        'section',
        'unit_type',
        'prelim',
        'midterm',
        'finals',
        'raw_grade_data',
        'scraped_at',
    ];

    protected $casts = [
        'rating_numeric' => 'decimal:2',
        'is_incomplete' => 'boolean',
        'prelim' => 'decimal:2',
        'midterm' => 'decimal:2',
        'finals' => 'decimal:2',
        'raw_grade_data' => 'array',
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
     * Get the user that owns this grades data
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get grades data for a specific user and semester
     */
    public static function getForUserAndSemester(int $userId, string $semesterId)
    {
        return static::where('user_id', $userId)
            ->where('semester_id', $semesterId)
            ->orderBy('course_code')
            ->get();
    }

    /**
     * Check if user has any incomplete grades (grade "40" or empty)
     */
    public static function hasIncompleteGrades(int $userId): bool
    {
        return static::where('user_id', $userId)
            ->where('is_incomplete', true)
            ->exists();
    }

    /**
     * Get all incomplete grades for a user
     */
    public static function getIncompleteGrades(int $userId)
    {
        return static::where('user_id', $userId)
            ->where('is_incomplete', true)
            ->orderBy('semester_id')
            ->orderBy('course_code')
            ->get();
    }

    /**
     * Get completion percentage for a user across all semesters
     */
    public static function getCompletionPercentage(int $userId): float
    {
        $totalGrades = static::where('user_id', $userId)->count();
        
        if ($totalGrades === 0) {
            return 100.0; // No grades found, assume complete
        }
        
        $incompleteGrades = static::where('user_id', $userId)
            ->where('is_incomplete', true)
            ->count();
        
        $completeGrades = $totalGrades - $incompleteGrades;
        
        return round(($completeGrades / $totalGrades) * 100, 2);
    }
}
