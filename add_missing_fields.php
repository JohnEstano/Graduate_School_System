<?php
require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== ADDING MISSING FIELDS ===\n\n";

// Get current template
$template = DB::table('document_templates')
    ->where('code', 'endorsement-form-prefinal-68fa18dcb3b1d')
    ->first();

$fields = json_decode($template->fields, true);

echo "Current fields:\n";
foreach ($fields as $field) {
    echo "  - {$field['key']}\n";
}

// Add missing fields based on the form
$newFields = [
    [
        'id' => (string)\Illuminate\Support\Str::uuid(),
        'key' => 'student.full_name',
        'page' => 1,
        'x' => 71,
        'y' => 184,
        'width' => 200,
        'height' => 30,
        'type' => 'text',
        'font_size' => 11
    ],
    [
        'id' => (string)\Illuminate\Support\Str::uuid(),
        'key' => 'student.program',
        'page' => 1,
        'x' => 71,
        'y' => 218,
        'width' => 300,
        'height' => 30,
        'type' => 'text',
        'font_size' => 11
    ],
    [
        'id' => (string)\Illuminate\Support\Str::uuid(),
        'key' => 'today.date',
        'page' => 1,
        'x' => 373,
        'y' => 188,
        'width' => 200,
        'height' => 30,
        'type' => 'text',
        'font_size' => 11
    ],
    [
        'id' => (string)\Illuminate\Support\Str::uuid(),
        'key' => 'signature.adviser',
        'page' => 1,
        'x' => 73,
        'y' => 397,
        'width' => 200,
        'height' => 78,
        'type' => 'signature',
    ],
    [
        'id' => (string)\Illuminate\Support\Str::uuid(),
        'key' => 'adviser.full_name',
        'page' => 1,
        'x' => 73,
        'y' => 482,
        'width' => 200,
        'height' => 15,
        'type' => 'text',
        'font_size' => 10
    ],
];

DB::table('document_templates')
    ->where('id', $template->id)
    ->update([
        'fields' => json_encode($newFields)
    ]);

echo "\nAdded fields:\n";
foreach ($newFields as $field) {
    echo "  - {$field['key']} ({$field['type']}) @ ({$field['x']}, {$field['y']}) size: {$field['width']}x{$field['height']}\n";
}

echo "\n✓ Fields updated!\n";
