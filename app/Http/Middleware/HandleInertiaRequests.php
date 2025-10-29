<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use Closure;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Handle the incoming request.
     * Add cache control headers to prevent back button access after logout.
     */
    public function handle(Request $request, Closure $next)
    {
        $response = parent::handle($request, $next);

        // Only apply cache prevention to authenticated users
        if ($request->user()) {
            $response->headers->set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT');
        }

        return $response;
    }

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Determines if the request should be handled by Inertia.
     * Exclude API routes from Inertia to prevent JSON response errors.
     */
    public function shouldHandle(Request $request): bool
    {
        // Exclude routes starting with /api/ from Inertia handling
        if ($request->is('api/*')) {
            return false;
        }

        return parent::shouldHandle($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $u = $request->user();

        $sharedUser = $u ? [
            'id'         => $u->id,
            'name'       => $u->display_name ?? ($u->first_name . ' ' . $u->last_name),
            'first_name' => $u->first_name ?? '',
            'last_name'  => $u->last_name ?? '',
            'email'      => $u->email,
            'role'       => $u->role,
            'school_id'  => $u->school_id ?? '',
            'program'    => $u->program ?? '',
        ] : null;

        return array_merge(parent::share($request), [
            'auth' => ['user' => $sharedUser],
            'user' => $sharedUser, // legacy
            'first_login' => $request->session()->pull('first_login', false), // Get and remove the flag
            'csrf_token' => csrf_token(), // Share CSRF token with every Inertia response
        ]);
    }
}
