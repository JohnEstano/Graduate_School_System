<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentRecord extends Model
{
    use HasFactory;

        protected $fillable = [
            'first_name',
            'middle_name',
            'last_name',
            'gender',
            'program',
            'school_year',
            'student_id',
            'course_section',
            'birthdate',
            'academic_status',
            'or_number',
            'payment_date',
            'defense_date',     
            'defense_type',   
        ];

        protected $casts = [
            'birthdate' => 'date',
            'payment_date' => 'date',
            'defense_date' => 'date',
    ];

    public function program()
    {
        return $this->belongsTo(ProgramRecord::class, 'program_record_id');
    }

    public function payments()
    {
        return $this->hasMany(PaymentRecord::class, 'student_record_id');
    }

    public function panelists()
    {
    return $this->belongsToMany(
        PanelistRecord::class, 
            'panelist_student_records', 
            'student_id', 
            'panelist_id')
                ->withPivot('role')
                ->withTimestamps();
    }
}
