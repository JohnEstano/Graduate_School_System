<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentRate;

echo "=== Adding Pre-final Defense Payment Rates ===" . PHP_EOL . PHP_EOL;

$rates = [
    [
        'program_level' => 'Masteral',
        'defense_type' => 'Pre-final',
        'type' => 'Adviser',
        'amount' => 5000, // Example amount - adjust as needed
    ],
    [
        'program_level' => 'Masteral',
        'defense_type' => 'Pre-final',
        'type' => 'Panel Chair',
        'amount' => 4000, // Example amount - adjust as needed
    ],
    [
        'program_level' => 'Masteral',
        'defense_type' => 'Pre-final',
        'type' => 'Panelist',
        'amount' => 3000, // Example amount - adjust as needed
    ],
    [
        'program_level' => 'Doctorate',
        'defense_type' => 'Pre-final',
        'type' => 'Adviser',
        'amount' => 7000, // Example amount - adjust as needed
    ],
    [
        'program_level' => 'Doctorate',
        'defense_type' => 'Pre-final',
        'type' => 'Panel Chair',
        'amount' => 6000, // Example amount - adjust as needed
    ],
    [
        'program_level' => 'Doctorate',
        'defense_type' => 'Pre-final',
        'type' => 'Panelist',
        'amount' => 5000, // Example amount - adjust as needed
    ],
];

foreach ($rates as $rateData) {
    $rate = PaymentRate::updateOrCreate(
        [
            'program_level' => $rateData['program_level'],
            'defense_type' => $rateData['defense_type'],
            'type' => $rateData['type'],
        ],
        [
            'amount' => $rateData['amount'],
        ]
    );

    echo "✓ {$rate->program_level} - {$rate->type} - {$rate->defense_type}: ₱{$rate->amount}" . PHP_EOL;
}

echo PHP_EOL . "=== All Pre-final rates added successfully! ===" . PHP_EOL;
