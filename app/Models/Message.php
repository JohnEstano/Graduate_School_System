<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'content',
        'type',
        'metadata',
        'read_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'read_at' => 'datetime',
    ];

    /**
     * Get the conversation that owns this message.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the user who sent this message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if message is read by user
     */
    public function isReadBy($userId): bool
    {
        $participant = $this->conversation->users()->where('user_id', $userId)->first();
        if (!$participant || !$participant->pivot->last_read_at) {
            return false;
        }

        return $this->created_at <= $participant->pivot->last_read_at;
    }

    /**
     * Get formatted timestamp
     */
    public function getFormattedTimeAttribute(): string
    {
        return $this->created_at->format('g:i A');
    }

    /**
     * Get formatted date
     */
    public function getFormattedDateAttribute(): string
    {
        if ($this->created_at->isToday()) {
            return 'Today';
        } elseif ($this->created_at->isYesterday()) {
            return 'Yesterday';
        } else {
            return $this->created_at->format('M j, Y');
        }
    }
}
