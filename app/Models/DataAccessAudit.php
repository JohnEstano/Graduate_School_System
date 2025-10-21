<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DataAccessAudit extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'action', 'target_system', 'purpose', 'status', 'meta', 'occurred_at'
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
        'meta' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
