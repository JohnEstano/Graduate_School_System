<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // School SSO (custom OAuth2 / OIDC) configuration
    'school' => [
        'client_id' => env('SCHOOL_CLIENT_ID'),
        'client_secret' => env('SCHOOL_CLIENT_SECRET'),
        'redirect' => env('SCHOOL_REDIRECT_URI'), // e.g. https://your-domain.com/auth/school/callback
        // Optional OIDC issuer / discovery URL (set if using OpenID Connect)
        'issuer' => env('SCHOOL_OIDC_ISSUER'),
    ],

];
