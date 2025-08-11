<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'password',
        'role',
        'program',
        'school_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    /**
     * Get the user's full name with optimized caching
     */
    public function getNameAttribute()
    {
        // Cache the computed name to avoid repeated string operations
        return cache()->remember(
            "user_name_{$this->id}_{$this->updated_at}", 
            now()->addHours(24), 
            function () {
                $middleInitial = $this->middle_name ? strtoupper(substr($this->middle_name, 0, 1)).'. ' : '';
                return trim("{$this->first_name} {$middleInitial}{$this->last_name}");
            }
        );
    }

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get all conversations for this user with optimized loading.
     */
    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'message_participants')
                    ->withPivot(['joined_at', 'last_read_at', 'is_admin'])
                    ->withTimestamps()
                    ->orderBy('last_message_at', 'desc');
    }

    /**
     * Get all messages sent by this user.
     */
    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get notifications for this user.
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Get unread notifications count with caching.
     */
    public function unreadNotificationsCount()
    {
        return cache()->remember(
            "user_unread_notifications_{$this->id}",
            now()->addMinutes(5),
            fn() => $this->notifications()->where('read', false)->count()
        );
    }

    /**
     * Get defense requests for this user (for students).
     */
    public function defenseRequests()
    {
        return $this->hasMany(DefenseRequest::class, 'school_id', 'school_id');
    }

    /**
     * Scope for active users.
     */
    public function scopeActive($query)
    {
        return $query->whereNotNull('email_verified_at');
    }

    /**
     * Scope for users by role.
     */
    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope for search functionality.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('first_name', 'ILIKE', "%{$search}%")
              ->orWhere('last_name', 'ILIKE', "%{$search}%")
              ->orWhere('email', 'ILIKE', "%{$search}%")
              ->orWhere('school_id', 'ILIKE', "%{$search}%");
        });
    }

    /**
     * Get user's full name for display
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->name;
    }
}
