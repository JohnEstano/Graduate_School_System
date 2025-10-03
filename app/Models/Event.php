<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Event extends Model
{
    protected $guarded = [];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at'   => 'datetime',
        'all_day'  => 'boolean',
    ];

    public function user() {
        return $this->belongsTo(User::class,'created_by');
    }

    public function scopeBetween(Builder $q, $from, $to): Builder {
        return $q->where(function($qq) use ($from,$to){
            $qq->whereBetween('start_at', [$from,$to])
               ->orWhereBetween('end_at', [$from,$to])
               ->orWhere(function($qx) use ($from,$to){
                   $qx->where('start_at','<=',$from)->where('end_at','>=',$to);
               });
        });
    }
}
