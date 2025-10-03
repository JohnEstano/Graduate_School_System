<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GeneratedDocument extends Model
{
    protected $fillable = [
        'defense_request_id', 'document_template_id', 'template_version_used',
        'output_path', 'payload', 'status', 'sha256'
    ];

    protected $casts = ['payload' => 'array'];

    public function template()
    {
        return $this->belongsTo(DocumentTemplate::class, 'document_template_id');
    }

    public function defenseRequest()
    {
        return $this->belongsTo(DefenseRequest::class);
    }
}
