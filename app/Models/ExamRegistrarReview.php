<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamRegistrarReview extends Model
{
    protected $table = 'exam_registrar_reviews';

    protected $fillable = [
        'exam_application_id',
        'doc_photo_clear',
        'doc_transcript',
        'doc_psa_birth',
        'doc_honorable_dismissal',
        'doc_prof_exam',
        'doc_marriage_cert',
        'documents_complete',
        'grades_complete',
        'status',
        'reason',
        'reviewed_by',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(ExamApplication::class, 'exam_application_id', 'application_id');
    }
}