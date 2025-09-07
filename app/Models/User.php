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
    public function getNameAttribute()
    {
        $middleInitial = $this->middle_name ? strtoupper(substr($this->middle_name, 0, 1)).'. ' : '';

        return trim("{$this->first_name} {$middleInitial}{$this->last_name}");
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
     * Get all conversations for this user.
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
     * Get user's full name for display
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->name;
    }

    public function role()
    {
        return $this->belongsTo(\App\Models\Role::class);
    }

    public function coordinatorPrograms()
    {
        return $this->hasMany(\App\Models\CoordinatorProgram::class, 'coordinator_id');
    }

    public function isRole(string $name): bool
    {
        return strcasecmp($this->role->name ?? '', $name) === 0
            || strcasecmp($this->attributes['role'] ?? '', $name) === 0; // legacy support
    }

    public function isCoordinator(): bool
    {
        return $this->isRole('Coordinator');
    }

    public function allowedProgramNames(): array
    {
        if (! $this->isCoordinator()) return [];
        return $this->coordinatorPrograms()->pluck('program')->all();
    }
}
