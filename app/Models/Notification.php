<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Events\NotificationCreated;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'type', 'title', 'message', 'link', 'read'];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::created(function (Notification $notification) {
            // Broadcast the notification creation event
            broadcast(new NotificationCreated($notification))->toOthers();
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}