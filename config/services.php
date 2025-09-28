<?php

// app/Services/HonorariumService.php

namespace App\Services;

class HonorariumService {
    public static function computeReceivables($level, $defense) {
        $rates = self::getRates()[$level][$defense];
        $total = 0;
        $breakdown = [];

        foreach ($rates as $role => $value) {
            if (is_array($value)) {
                $sum = array_sum($value);
                $breakdown[$role] = $sum;
                $total += $sum;
            } else {
                $breakdown[$role] = $value;
                $total += $value;
            }
        }

        return [
            'breakdown' => $breakdown,
            'totalReceivables' => $total,
        ];
    }

    private static function getRates() {
        return [
            "masteral" => [
                "proposal" => [
                    "ADVISER" => 3000,
                    "PANEL CHAIR" => 2000,
                    "PANEL MEMBER" => [1200, 1200, 1200],
                    "REC FEE" => 2200,
                    "SCHOOL SHARE" => 450,
                ],
                // ...
            ],
            "doctorate" => [
                // ...
            ],
        ];
    }
}


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
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
