<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class PreventBackHistory
{
    /**
     * Handle an incoming request.
     * 
     * Prevents browsers from caching authenticated pages so that
     * after logout, the back button won't show cached content.
     * 
     * This middleware should only be applied to authenticated routes.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Don't apply to CSRF token endpoint or API routes
        if ($request->is('sanctum/csrf-cookie') || $request->is('api/*')) {
            return $response;
        }

        // Set cache control headers to prevent browser caching
        return $response->header('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate')
                        ->header('Pragma', 'no-cache')
                        ->header('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT');
    }
}
