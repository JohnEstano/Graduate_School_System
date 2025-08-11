<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Application Performance Settings
    |--------------------------------------------------------------------------
    |
    | These settings optimize the application for production deployment.
    |
    */

    'cache' => [
        'default_ttl' => env('CACHE_TTL', 3600), // 1 hour default
        'user_cache_ttl' => env('USER_CACHE_TTL', 1800), // 30 minutes
        'conversation_cache_ttl' => env('CONVERSATION_CACHE_TTL', 600), // 10 minutes
        'notification_cache_ttl' => env('NOTIFICATION_CACHE_TTL', 300), // 5 minutes
    ],

    'database' => [
        'query_cache_ttl' => env('DB_QUERY_CACHE_TTL', 3600),
        'connection_timeout' => env('DB_CONNECTION_TIMEOUT', 30),
        'max_connections' => env('DB_MAX_CONNECTIONS', 20),
    ],

    'pagination' => [
        'messages_per_page' => 50,
        'conversations_per_page' => 20,
        'users_per_page' => 100,
        'defense_requests_per_page' => 25,
    ],

    'file_upload' => [
        'max_size' => env('MAX_FILE_SIZE', 10240), // 10MB in KB
        'allowed_types' => ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif'],
    ],

    'security' => [
        'session_lifetime' => env('SESSION_LIFETIME', 120),
        'password_timeout' => env('PASSWORD_TIMEOUT', 3600),
        'max_login_attempts' => env('MAX_LOGIN_ATTEMPTS', 5),
    ],

    'features' => [
        'real_time_messaging' => env('REAL_TIME_MESSAGING', true),
        'file_attachments' => env('FILE_ATTACHMENTS', true),
        'push_notifications' => env('PUSH_NOTIFICATIONS', true),
    ],

];
