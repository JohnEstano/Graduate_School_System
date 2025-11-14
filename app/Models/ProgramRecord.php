<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgramRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'program',
        'category',
        'recently_updated',
        'time_last_opened',
        'date_edited',
    ];

    protected $casts = [
        'date_edited' => 'datetime',
        'time_last_opened' => 'datetime',
    ];

    /**
     * Automatically set or update the date_edited field
     */
    protected static function booted()
    {
        // When creating a new record
        static::creating(function ($program) {
            $program->date_edited = now();
        });

        // When updating an existing record
        static::updating(function ($program) {
            $program->date_edited = now();
        });
    }

    /**
     * Relationships
     */
    public function studentRecords()
    {
        return $this->hasMany(StudentRecord::class, 'program_record_id');
    }

    public function panelists()
    {
        return $this->hasMany(PanelistRecord::class, 'program_record_id');
    }
}
