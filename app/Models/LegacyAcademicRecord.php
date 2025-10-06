<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LegacyAcademicRecord extends Model
{
    protected $table = 'legacy_academic_records';
    protected $fillable = [
        'user_id',
        'semester_id',
        'course_code',
        'course_title',
        'units',
        'type',
        'prelim',
        'midterm',
        'finals',
        'average',
        'units_earned',
        'section',
        'is_complete',
    ];
    public function user() { return $this->belongsTo(User::class); }
}
