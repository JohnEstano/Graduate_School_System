<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamApplicationSubject extends Model
{
    protected $table = 'exam_application_subject';
    public $timestamps = false;

    protected $fillable = [
        'application_id',
        'subject_name',
        'exam_date',
        'start_time',
        'end_time',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(ExamApplication::class, 'application_id', 'application_id');
    }
}