<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_record_id',
        'school_year',
        'payment_date',
        'defense_status',
        'amount',
    ];

    public function studentRecord()
    {
        return $this->belongsTo(StudentRecord::class);
    }
}
