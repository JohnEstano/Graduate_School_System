<?php
// filepath: c:\GSURS\Graduate_School_System-1\app\Models\ExamSubjectOffering.php
// ...existing code...
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamSubjectOffering extends Model
{
    protected $table = 'exam_subject_offerings';

    protected $fillable = [
        'program',
        'school_year',
        'subject_code',
        'subject_name',
        'exam_date',
        'start_time',
        'end_time',
        'venue',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'exam_date' => 'date',
    ];
}