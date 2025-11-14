<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFreshCsrfToken
{
    /**
     * Handle an incoming request.
     *
     * Ensures that every response includes the current CSRF token in headers.
     * This allows JavaScript to always have access to the current token.
     * For auth pages, regenerate token on each visit to prevent stale tokens.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Regenerate CSRF token on auth pages to prevent stale tokens
        if ($request->is('login*') || $request->is('register')) {
            $request->session()->regenerateToken();
        }
        
        $response = $next($request);

        // Add current CSRF token to response headers for JavaScript access
        // This ensures the frontend always has the correct token
        $response->headers->set('X-CSRF-Token', csrf_token());

        return $response;
    }
}
