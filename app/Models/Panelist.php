<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Panelist extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'email', 'role', 'status'];

    public function honorariumPayments()
    {
        return $this->hasMany(HonorariumPayment::class);
    }
}
