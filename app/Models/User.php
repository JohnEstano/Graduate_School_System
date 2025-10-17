<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
        'legacy_account_id', // Critical: primary key in legacy system
        'student_number_legacy', // Legacy student number from clearance API
        'degree_code', // Degree code from legacy system
        'degree_program_id', // Legacy degree program ID
        'year_level', // Year level from legacy system
        'balance', // Current balance from clearance API
        'clearance_statuscode', // Clearance statuscode (3300=has balance, etc.)
        'legacy_data_synced_at', // Last sync timestamp
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
            'password' => 'hashed',
        ];
    }

    /**
     * Scope to find user by full name with flexible matching.
     * Handles names with or without middle names and normalizes whitespace.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $fullName The full name to search for
     * @param string|null $role Optional role to filter by (e.g., 'Faculty')
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeFindByFullName($query, $fullName, $role = null)
    {
        // Normalize the input: trim and collapse multiple spaces
        $normalizedName = preg_replace('/\s+/', ' ', trim(strtolower($fullName)));
        
        Log::info('User::scopeFindByFullName called', [
            'original_name' => $fullName,
            'normalized_name' => $normalizedName,
            'role' => $role
        ]);
        
        if ($role) {
            $query->where('role', $role);
        }
        
        return $query->where(function($q) use ($normalizedName) {
            // Match 1: Full name with middle name (FirstName MiddleName LastName)
            $q->whereRaw(
                'LOWER(TRIM(REGEXP_REPLACE(CONCAT(first_name, " ", COALESCE(middle_name, ""), " ", last_name), "[[:space:]]+", " "))) = ?',
                [$normalizedName]
            )
            // Match 2: Name without middle name (FirstName LastName)
            ->orWhereRaw(
                'LOWER(TRIM(CONCAT(first_name, " ", last_name))) = ?',
                [$normalizedName]
            )
            // Match 3: Just first and last name concatenated with middle initial
            ->orWhereRaw(
                'LOWER(TRIM(CONCAT(first_name, " ", LEFT(COALESCE(middle_name, ""), 1), " ", last_name))) = ?',
                [$normalizedName]
            );
        });
    }
    
    /**
     * Get the user's full name including middle name if present.
     * 
     * @return string
     */
    public function getFullNameAttribute()
    {
        $parts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name
        ]);
        
        return implode(' ', $parts);
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
    public function getDisplayNameAttribute()
    {
        $firstName = $this->formatProperCase($this->first_name);
        $lastName = $this->formatProperCase($this->last_name);
        $middleInitial = $this->middle_name ? strtoupper(substr($this->middle_name, 0, 1)) . '. ' : '';
        
        return trim("{$firstName} {$middleInitial}{$lastName}");
    }

    /**
     * Generate UIC email format: firstletter_lastname_studentid@uic.edu.ph
     */
    public function generateUicEmail(): string
    {
        if (!$this->first_name || !$this->last_name || !$this->school_id) {
            return $this->email; // Return current email if data is incomplete
        }
        
        $firstLetter = strtolower(substr($this->first_name, 0, 1));
        $lastName = strtolower(str_replace(' ', '', $this->last_name)); // Remove spaces
        $studentId = $this->school_id;
        
        return "{$firstLetter}{$lastName}_{$studentId}@uic.edu.ph";
    }

    /**
     * Format name to proper case (First letter capital, rest lowercase)
     */
    private function formatProperCase(string $name): string
    {
        // Convert to title case while preserving original spacing
        return mb_convert_case(strtolower($name), MB_CASE_TITLE, 'UTF-8');
    }

    /**
     * Update user's email to UIC format if they are a student
     */
    public function updateToUicEmail(): bool
    {
        if ($this->role !== 'Student') {
            return false;
        }
        
        $newEmail = $this->generateUicEmail();
        if ($newEmail !== $this->email) {
            $this->update(['email' => $newEmail]);
            return true;
        }
        
        return false;
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
     * Students advised by this user (when the user is an adviser).
     */
    public function advisedStudents(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'adviser_student',
            'adviser_id',
            'student_id'
        )
        ->withPivot('status', 'requested_by')
        ->withTimestamps();
    }

    /**
     * Advisers for this student (inverse).
     */
    public function advisers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'adviser_student',
            'student_id',
            'adviser_id'
        )
        ->withPivot('status', 'requested_by')
        ->withTimestamps();
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

    protected static function booted()
    {
        static::creating(function ($user) {
            if ($user->isCoordinator() && !$user->coordinator_code) {
                // Just set the code, do NOT call save()
                $user->coordinator_code = strtoupper(bin2hex(random_bytes(4)));
            }
        });

        // When a user is created (e.g. an adviser registers), reconcile any pre-existing Adviser rows
        // created by coordinators using the same email. Attach coordinator pivots and mark adviser rows active.
        static::created(function ($user) {
            try {
                // Only attempt reconciliation for adviser/faculty users
                if (in_array($user->role, ['Faculty', 'Adviser'])) {
                    $adviserRows = \App\Models\Adviser::where('email', $user->email)->get();
                    foreach ($adviserRows as $row) {
                        // Attach coordinator pivot for the newly created user so the adviser "sees" their coordinators
                        if (!empty($row->coordinator_id) && method_exists($user, 'coordinators')) {
                            $user->coordinators()->syncWithoutDetaching([$row->coordinator_id]);
                        }

                        // Link the adviser row to the created user and mark as active
                        $row->user_id = $user->id;
                        $row->status = 'active';
                        $row->save();
                    }
                }
            } catch (\Throwable $e) {
                // Don't block user creation on reconciliation failures. Log for debugging.
                Log::warning('Adviser reconciliation failed for user '.$user->id.': '.$e->getMessage());
            }
        });
    }
}
