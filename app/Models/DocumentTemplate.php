<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentTemplate extends Model
{
    protected $fillable = [
        'name', 'code', 'defense_type', 'file_path', 'page_count', 'version', 'fields', 'fields_meta', 'created_by'
    ];

    protected $casts = [
        'fields' => 'array',
        'fields_meta' => 'array',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
