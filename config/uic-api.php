<?php

return [

    /*
    |--------------------------------------------------------------------------
    | UIC API v2 Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for UIC Educational Portal API v2 integration.
    | This is used for primary authentication and accessing UIC API endpoints.
    |
    */

    'base_url' => env('UIC_API_BASE_URL', 'https://api.uic.edu.ph/api/v2'),

    'client_id' => env('UIC_API_CLIENT_ID'),

    'client_secret' => env('UIC_API_CLIENT_SECRET'),

    'timeout' => env('UIC_API_TIMEOUT', 30),

    'token_cache_minutes' => env('UIC_API_TOKEN_CACHE_MINUTES', 1440), // 24 hours default

    /*
    |--------------------------------------------------------------------------
    | Authentication Endpoints
    |--------------------------------------------------------------------------
    */

    'endpoints' => [
        'login' => '/accounts/auth/login',
        'verify' => '/accounts/auth/verify',
        'logout' => '/accounts/auth/logout',
    ],

    /*
    |--------------------------------------------------------------------------
    | Request Headers
    |--------------------------------------------------------------------------
    */

    'headers' => [
        'Content-Type' => 'application/json',
        'Accept' => 'application/json',
    ],

];
