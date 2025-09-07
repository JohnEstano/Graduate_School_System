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
     * If your users table uses a `role_id` foreign key, this will behave as a normal hasMany(User::class).
     * If your users table stores role as a string in a `role` column (e.g. 'Student', 'Coordinator'),
     * this method will return users where users.role = roles.name.
     *
     * This keeps the Role model flexible across both database designs so the merge won't break either branch.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function users(): HasMany
    {
        // If users table has role_id, use conventional hasMany by foreign key role_id
        if (Schema::hasColumn('users', 'role_id')) {
            return $this->hasMany(User::class, 'role_id', 'id');
        }

        // Otherwise assume users.role stores the role name and match users.role => roles.name
        // localKey (roles.name) -> foreignKey (users.role)
        return $this->hasMany(User::class, 'role', 'name');
    }

    /**
     * Roles often don't need timestamps — set to false to match whichever branch expected that.
     */
    public $timestamps = false;
}
