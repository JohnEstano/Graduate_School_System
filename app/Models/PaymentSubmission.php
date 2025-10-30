<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentSubmission extends Model
{
    protected $table = 'payment_submissions';
    protected $primaryKey = 'payment_id';

    protected $fillable = [
        'student_id',
        'payment_type',
        'or_number',
        'amount_paid',
        'payment_date',
        'receipt_image',
        'status',
        'remarks',
        'checked_by',
        'checked_at',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'checked_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        // Change to Student::class if you use a dedicated students table
        return $this->belongsTo(\App\Models\User::class, 'student_id');
    }

    public function checker(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'checked_by');
    }
}