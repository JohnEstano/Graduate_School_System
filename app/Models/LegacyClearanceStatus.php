<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LegacyClearanceStatus extends Model
{
    protected $table = 'legacy_clearance_statuses';
    protected $fillable = [
        'user_id',
        'semester_id',
        'area',
        'status',
        'details',
    ];
    public function user() { return $this->belongsTo(User::class); }
}
