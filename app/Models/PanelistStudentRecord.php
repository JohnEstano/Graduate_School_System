<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PanelistStudentRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'panelist_id',
        'student_id',
    ];

    // Relationships
    public function panelist()
    {
        return $this->belongsTo(PanelistRecord::class, 'panelist_id');
    }

    public function student()
    {
        return $this->belongsTo(StudentRecord::class, 'student_id');
    }
}
