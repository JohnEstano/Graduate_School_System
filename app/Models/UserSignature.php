<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSignature extends Model
{
    protected $fillable = ['user_id', 'label', 'image_path', 'natural_width', 'natural_height', 'active'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
