<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AaPaymentVerification extends Model
{
    protected $fillable = [
        'defense_request_id', 'assigned_to', 'batch_id', 'status', 'remarks'
    ];

    public function defenseRequest()
    {
        return $this->belongsTo(DefenseRequest::class);
    }

    public function batch()
    {
        return $this->belongsTo(AaPaymentBatch::class, 'batch_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
