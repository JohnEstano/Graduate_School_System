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
    ];

    // Example payments relationship
    public function payments()
    {
        return $this->hasMany(PaymentRecord::class);
    }
}
