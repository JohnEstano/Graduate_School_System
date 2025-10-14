<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AaPaymentBatch extends Model
{
    protected $fillable = ['name', 'created_by', 'status'];

    public function verifications()
    {
        return $this->hasMany(AaPaymentVerification::class, 'batch_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
