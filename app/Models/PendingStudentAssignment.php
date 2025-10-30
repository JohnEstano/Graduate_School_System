<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PendingStudentAssignment extends Model
{
    protected $fillable = [
        'student_email',
        'adviser_id',
        'coordinator_id',
        'invitation_sent',
        'invitation_sent_at',
    ];

    protected $casts = [
        'invitation_sent' => 'boolean',
        'invitation_sent_at' => 'datetime',
    ];

    public function adviser(): BelongsTo
    {
        return $this->belongsTo(Adviser::class);
    }

    public function coordinator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coordinator_id');
    }
}
