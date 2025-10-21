<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        // ...
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // Coordinators can manage only students within their programs
        Gate::define('manage-students-in-program', function (User $user, string $studentProgram) {
            if ($user->isRole('Dean') || $user->isRole('Registrar') || $user->isRole('Administrative Assistant')) {
                return true;
            }
            if (! $user->isCoordinator()) return false;

            $allowed = $user->allowedProgramNames();
            return in_array($studentProgram, $allowed, true);
        });
    }
}