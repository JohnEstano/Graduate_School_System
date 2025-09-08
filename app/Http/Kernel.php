<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * The application's route middleware.
     *
     * These middleware may be assigned to groups or used individually.
     *
     * @var array
     */
    protected $routeMiddleware = [
        // ...existing...
        // Prevent duplicate application when latest is pending/approved
        'no-duplicate-compre' => \App\Http\Middleware\PreventDuplicateCompreApplication::class,
    ];
}