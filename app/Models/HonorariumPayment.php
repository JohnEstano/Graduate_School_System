<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HonorariumPayment extends Model
{
    protected $fillable = [
        'defense_request_id',
        'panelist_id',
        'panelist_type', // 'Panelist' or 'Faculty'
        'role', // Chairperson/Panel Member
        'amount',
        'payment_date',
        'status', // Paid/Unpaid
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
