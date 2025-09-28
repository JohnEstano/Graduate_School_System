<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentRecord extends Model
{
    protected $table = 'payment_records';

    protected $fillable = [
        'student_record_id',
        'school_year',
        'payment_date',
        'defense_status',
        'amount',
        'panelist_record_id', 
    ];

public function studentRecord(): BelongsTo
{
    return $this->belongsTo(StudentRecord::class, 'student_record_id');
}

public function panelist()
{
    return $this->belongsTo(\App\Models\PanelistRecord::class, 'panelist_record_id');
}


}
