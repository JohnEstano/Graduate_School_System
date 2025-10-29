<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Configuration\Exceptions;

// + any middleware you add
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\PreventDuplicateCompreApplication;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\EnsureFreshCsrfToken;
use App\Http\Middleware\PreventBackHistory;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // alias middleware
        $middleware->alias([
            'no-duplicate-compre' => PreventDuplicateCompreApplication::class,
            'role' => CheckRole::class,
        ]);

        // add web middleware
        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            EnsureFreshCsrfToken::class, // Ensure CSRF token is always fresh
            PreventBackHistory::class, // Prevent back button after logout
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // handle/report exceptions here
    })
    ->create();
