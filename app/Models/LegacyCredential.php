<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LegacyCredential extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'legacy_username', 'encrypted_password', 'last_validated_at', 'status', 'last_error'
    ];

    protected $casts = [
        'last_validated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
