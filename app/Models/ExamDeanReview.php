<?php
// filepath: c:\GSURS\Graduate_School_System-1\app\Models\ExamDeanReview.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamDeanReview extends Model
{
    protected $table = 'exam_dean_reviews';
    protected $fillable = [
        'exam_application_id',
        'status',
        'reason',
        'reviewed_by',
    ];
}