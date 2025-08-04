<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Supabase Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Supabase integration with your Laravel application.
    | Make sure to set these environment variables in your .env file.
    |
    */

    'url' => env('SUPABASE_URL'),
    'anon_key' => env('SUPABASE_ANON_KEY'),
    'service_role_key' => env('SUPABASE_SERVICE_ROLE_KEY'),
    
    /*
    |--------------------------------------------------------------------------
    | Database Configuration for Supabase
    |--------------------------------------------------------------------------
    |
    | When using Supabase, you'll want to update your database configuration
    | to point to your Supabase PostgreSQL instance.
    |
    */
    
    'database' => [
        'host' => env('SUPABASE_DB_HOST'),
        'port' => env('SUPABASE_DB_PORT', 5432),
        'database' => env('SUPABASE_DB_DATABASE'),
        'username' => env('SUPABASE_DB_USERNAME'),
        'password' => env('SUPABASE_DB_PASSWORD'),
        'sslmode' => env('SUPABASE_DB_SSLMODE', 'require'),
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Real-time Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Supabase real-time features
    |
    */
    
    'realtime' => [
        'enabled' => env('SUPABASE_REALTIME_ENABLED', true),
        'channels' => [
            'messaging' => [
                'table' => 'messages',
                'filter' => 'conversation_id=eq.*',
            ],
            'defense_requests' => [
                'table' => 'defense_requests', 
                'filter' => 'status=eq.*',
            ],
        ],
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Storage Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Supabase Storage buckets
    |
    */
    
    'storage' => [
        'buckets' => [
            'avatars' => 'user-avatars',
            'documents' => 'defense-documents',
            'attachments' => 'message-attachments',
        ],
        'url' => env('SUPABASE_STORAGE_URL'),
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Authentication Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Supabase Auth
    |
    */
    
    'auth' => [
        'enabled' => env('SUPABASE_AUTH_ENABLED', false), // Set to true if using Supabase Auth
        'jwt_secret' => env('SUPABASE_JWT_SECRET'),
        'redirect_urls' => [
            'login' => env('APP_URL') . '/auth/callback',
            'logout' => env('APP_URL') . '/login',
        ],
    ],
];
