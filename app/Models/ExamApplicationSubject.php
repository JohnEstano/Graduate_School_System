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
        'offering_id',
        'subject_name',
        'score',
        'exam_date',
        'start_time',
        'end_time',
    ];

    protected $casts = [
        'score' => 'integer',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(ExamApplication::class, 'application_id', 'application_id');
    }

    public function offering(): BelongsTo
    {
        return $this->belongsTo(ExamSubjectOffering::class, 'offering_id', 'id');
    }
}