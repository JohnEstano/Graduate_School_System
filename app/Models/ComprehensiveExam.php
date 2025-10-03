<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComprehensiveExam extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'student_id',
        'first_name',
        'middle_initial',
        'last_name',
        'school_year',
        'program',
        'office_address',
        'mobile_no',
        'telephone_no',
        'email',
        'subjects',
        'status',
    ];

    protected $casts = [
        'subjects' => 'array',
    ];
}