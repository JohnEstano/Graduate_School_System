<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_record_id',
        'panelist_record_id',
        'school_year',
        'payment_date',
        'defense_status',
        'amount',
    ];

    protected $casts = [
        'payment_date' => 'datetime',
        'amount' => 'decimal:2',
    ];

    /**
     * Get the current school year (e.g., "2025-2026")
     */
    public static function getCurrentSchoolYear(): string
    {
        $currentMonth = now()->month;
        $currentYear = now()->year;
        
        // School year starts in August (month 8)
        if ($currentMonth >= 8) {
            return $currentYear . '-' . ($currentYear + 1);
        } else {
            return ($currentYear - 1) . '-' . $currentYear;
        }
    }

    // Relationships
    public function studentRecord()
    {
        return $this->belongsTo(StudentRecord::class);
    }

    public function panelistRecord()
    {
        return $this->belongsTo(PanelistRecord::class);
    }
}
