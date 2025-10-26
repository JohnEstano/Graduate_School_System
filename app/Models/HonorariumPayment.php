<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HonorariumPayment extends Model
{
    protected $fillable = [
        'defense_request_id',
        'panelist_id',
        'panelist_name',      // ✅ ALREADY THERE
        'panelist_type',
        'role',
        'amount',
        'payment_date',
        'payment_status',     // ✅ ALREADY THERE
        'defense_date',       // ✅ ADD THIS
        'student_name',       // ✅ ADD THIS
        'program',            // ✅ ADD THIS
        'defense_type',       // ✅ ADD THIS
    ];

    public function defenseRequest()
    {
        return $this->belongsTo(DefenseRequest::class);
    }

    public function panelist()
    {
        return $this->belongsTo(Panelist::class);
    }
}
