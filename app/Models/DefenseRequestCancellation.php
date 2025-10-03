<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefenseRequestCancellation extends Model
{
    protected $fillable = [
        'defense_request_id',
        'cancelled_by',
        'reason',
    ];

    public function defenseRequest()
    {
        return $this->belongsTo(DefenseRequest::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }
}
