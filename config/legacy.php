<?php
return [
    'enabled' => env('LEGACY_ENABLED', true),
    'base_url' => rtrim(env('LEGACY_BASE_URL', 'https://my.uic.edu.ph'), '/'),
    // Path fragments including leading slash
    'login_path' => env('LEGACY_LOGIN_PATH', '/index.cfm'),
    'login_params' => [
        'fa' => env('LEGACY_LOGIN_FA', 'login.login_process'),
    ],
    // Future endpoints (placeholders)
    'grades_path' => env('LEGACY_GRADES_PATH', '/index.cfm?fa=student.grades'),
    'timeout' => env('LEGACY_TIMEOUT', 15),
    'user_agent' => env('LEGACY_USER_AGENT', 'GraduatePortalBot/1.0'),
    // Cache TTL (minutes) for record types
    'cache_ttl' => [
        'grades' => env('LEGACY_GRADES_CACHE_TTL', 30),
    ],
];
