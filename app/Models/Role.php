<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;

class Role extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    /**
     * Get users for this role.
     * Supports both role_id (FK) and string-based role assignment.
     */
    public function users(): HasMany
    {
        if (Schema::hasColumn('users', 'role_id')) {
            return $this->hasMany(User::class, 'role_id', 'id');
        }
        return $this->hasMany(User::class, 'role', 'name');
    }

    /**
     * Disable timestamps if not needed.
     */
    public $timestamps = false;
}
