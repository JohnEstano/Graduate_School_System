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
        'student_number',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'password',
        'role', // legacy single role for backward compatibility
        'program',
        'school_id',
    'employee_id',
    'employee_department_code',
    'employee_photo_url',
    'employee_profile_fetched_at',
        'google_verified_at',
        'extra_role_title',
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
            'google_verified_at' => 'datetime',
            'employee_profile_fetched_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function markGoogleVerified(): void
    {
        if (!$this->google_verified_at) {
            $this->google_verified_at = now();
            $this->save();
        }
    }

    /**
     * Roles relationship (multi-role support).
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    /**
     * Attach a role if not already present.
     */
    public function addRole(string $name): void
    {
        $role = Role::firstOrCreate(['name' => $name]);
        if (!$this->roles->contains($role->id)) {
            $this->roles()->attach($role->id);
        }
    }

    /**
     * Determine if user has a given role name (multi-role or legacy column).
     */
    public function hasRole(string $name): bool
    {
        if (strcasecmp($this->role ?? '', $name) === 0) return true; // legacy
        return $this->roles()->where('name', $name)->exists();
    }

    /**
     * Get all role names (legacy + pivot) unique.
     */
    public function allRoleNames(): array
    {
        $names = $this->roles()->pluck('name')->all();
        if ($this->role && !in_array($this->role, $names)) $names[] = $this->role;
        return $names;
    }

    // Messaging relations removed

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

    /**
     * For Adviser: Get all students
     */
    public function advisedStudents()
    {
        return $this->belongsToMany(User::class, 'adviser_student', 'adviser_id', 'student_id');
    }

    // For Student: Get all advisers
    public function advisers()
    {
        return $this->belongsToMany(
            User::class,
            'adviser_student',
            'student_id',
            'adviser_id'
        )->select('users.id', 'users.first_name', 'users.middle_name', 'users.last_name', 'users.email', 'users.adviser_code');
    }

    public function generateAdviserCode(): void
    {
        if ($this->adviser_code) return;
        do {
            $code = strtoupper(bin2hex(random_bytes(4)));
        } while (User::where('adviser_code', $code)->exists());
        $this->adviser_code = $code;
        $this->save();
    }

    public function generateCoordinatorCode()
    {
        $this->coordinator_code = strtoupper(bin2hex(random_bytes(4)));
        $this->save();
    }

    // Relationship: Advisers assigned to this coordinator
    public function coordinatedAdvisers()
    {
        return $this->belongsToMany(User::class, 'adviser_coordinator', 'coordinator_id', 'adviser_id');
    }

    // Relationship: Coordinator(s) for this adviser
    public function coordinators()
    {
        return $this->belongsToMany(User::class, 'adviser_coordinator', 'adviser_id', 'coordinator_id');
    }
}
