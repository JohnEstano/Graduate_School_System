<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'participants',
        'last_message_at',
    ];

    protected $casts = [
        'participants' => 'array',
        'last_message_at' => 'datetime',
    ];

    /**
     * Get all messages for this conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    /**
     * Get the latest message for this conversation.
     */
    public function latestMessage(): HasMany
    {
        return $this->hasMany(Message::class)->latest()->limit(1);
    }

    /**
     * Get all participants of this conversation.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'message_participants')
                    ->withPivot(['joined_at', 'last_read_at', 'is_admin'])
                    ->withTimestamps();
    }

    /**
     * Get participants with their details
     */
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'message_participants')
                    ->withPivot(['joined_at', 'last_read_at', 'is_admin'])
                    ->withTimestamps();
    }

    /**
     * Check if user is participant
     */
    public function hasParticipant($userId): bool
    {
        return in_array($userId, $this->participants ?? []);
    }

    /**
     * Add participant to conversation
     */
    public function addParticipant($userId, $isAdmin = false)
    {
        if (!$this->hasParticipant($userId)) {
            $participants = $this->participants ?? [];
            $participants[] = $userId;
            $this->update(['participants' => $participants]);
            
            $this->users()->attach($userId, [
                'is_admin' => $isAdmin,
                'joined_at' => now(),
            ]);
        }
    }

    /**
     * Remove participant from conversation
     */
    public function removeParticipant($userId)
    {
        $participants = $this->participants ?? [];
        $participants = array_filter($participants, fn($id) => $id != $userId);
        $this->update(['participants' => array_values($participants)]);
        
        $this->users()->detach($userId);
    }

    /**
     * Get unread message count for a user
     */
    public function getUnreadCountForUser($userId): int
    {
        $participant = $this->users()->where('user_id', $userId)->first();
        if (!$participant) {
            return 0;
        }

        $lastReadAt = $participant->pivot->last_read_at;
        if (!$lastReadAt) {
            return $this->messages()->count();
        }

        return $this->messages()->where('created_at', '>', $lastReadAt)->count();
    }

    /**
     * Mark conversation as read for user
     */
    public function markAsReadForUser($userId)
    {
        $this->users()->updateExistingPivot($userId, [
            'last_read_at' => now(),
        ]);
    }
}
