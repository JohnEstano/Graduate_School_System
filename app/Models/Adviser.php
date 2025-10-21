<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Adviser extends Model
{
    use HasFactory;

    protected $fillable = [
        'coordinator_id',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'employee_id',
        'status',
        'user_id',
    ];

    public function coordinator()
    {
        return $this->belongsTo(User::class, 'coordinator_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
