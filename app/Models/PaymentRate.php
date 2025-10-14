<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentRate extends Model
{
    protected $fillable = [
        'program_level', 'type', 'defense_type', 'amount'
    ];
}
