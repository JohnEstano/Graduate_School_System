<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DocumentTemplate;

echo "=== COMPLETE TEMPLATE RESET AND FIX ===\n\n";

$template = DocumentTemplate::first();

echo "Current fields:\n";
foreach ($template->fields ?? [] as $i => $field) {
    echo "  [$i] {$field['key']} ({$field['type']}) @ ({$field['x']}, {$field['y']}) {$field['width']}x{$field['height']}\n";
}

// RESET: Create proper fields from scratch
$newFields = [
    [
        'id' => 'field_' . uniqid(),
        'key' => 'student.full_name',
        'page' => 1,
        'x' => 180,
        'y' => 155,
        'width' => 250,
        'height' => 20,
        'type' => 'text',
        'font_size' => 11
    ],
    [
        'id' => 'field_' . uniqid(),
        'key' => 'student.program',
        'page' => 1,
        'x' => 180,
        'y' => 200,
        'width' => 300,
        'height' => 20,
        'type' => 'text',
        'font_size' => 11
    ],
    [
        'id' => 'field_' . uniqid(),
        'key' => 'today.date',
        'page' => 1,
        'x' => 480,
        'y' => 155,
        'width' => 120,
        'height' => 20,
        'type' => 'text',
        'font_size' => 11
    ],
    [
        'id' => 'field_' . uniqid(),
        'key' => 'signature.adviser',
        'page' => 1,
        'x' => 200,
        'y' => 435,
        'width' => 180,
        'height' => 78,  // 2.3:1 aspect ratio
        'type' => 'signature'
    ],
    [
        'id' => 'field_' . uniqid(),
        'key' => 'adviser.full_name',
        'page' => 1,
        'x' => 200,
        'y' => 520,
        'width' => 200,
        'height' => 15,
        'type' => 'text',
        'font_size' => 10
    ]
];

$template->fields = $newFields;
$template->save();

echo "\n✓ Template reset with new fields:\n";
foreach ($template->fields as $i => $field) {
    echo "  [$i] {$field['key']} ({$field['type']}) @ ({$field['x']}, {$field['y']}) {$field['width']}x{$field['height']}\n";
}

echo "\n=== DONE ===\n";
