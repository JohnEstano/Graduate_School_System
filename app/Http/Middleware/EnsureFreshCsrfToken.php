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
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Add current CSRF token to response headers for JavaScript access
        // This ensures the frontend always has the correct token
        $response->headers->set('X-CSRF-Token', csrf_token());

        return $response;
    }
}
