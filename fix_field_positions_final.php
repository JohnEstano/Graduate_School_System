<?php
require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== FIXING FIELD POSITIONS FROM SCREENSHOTS ===\n\n";

// From your screenshot, the actual positions are:
// student.full_name: (71, 184) - currently wrong
// today.date: (373, 188) - currently wrong  
// signature.adviser: (73, 397) with size 200x78 - currently squished at 200x30

$correctFields = [
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
        'height' => 78,  // Fixed height to prevent squishing
        'type' => 'signature',
    ],
];

// Update template
$template = DB::table('document_templates')
    ->where('code', 'endorsement-form-prefinal-68fa18dcb3b1d')
    ->first();

if (!$template) {
    echo "Template not found!\n";
    exit(1);
}

echo "Updating field positions to match template editor screenshot...\n\n";

echo "OLD POSITIONS:\n";
echo str_repeat("-", 80) . "\n";
printf("%-25s %8s %8s %8s %8s\n", "KEY", "X", "Y", "WIDTH", "HEIGHT");
echo str_repeat("-", 80) . "\n";
foreach (json_decode($template->fields, true) as $field) {
    printf("%-25s %8.0f %8.0f %8.0f %8.0f\n", $field['key'], $field['x'], $field['y'], $field['width'], $field['height']);
}

echo "\nNEW POSITIONS (from screenshot):\n";
echo str_repeat("-", 80) . "\n";
printf("%-25s %8s %8s %8s %8s\n", "KEY", "X", "Y", "WIDTH", "HEIGHT");
echo str_repeat("-", 80) . "\n";
foreach ($correctFields as $field) {
    printf("%-25s %8.0f %8.0f %8.0f %8.0f\n", $field['key'], $field['x'], $field['y'], $field['width'], $field['height']);
}

DB::table('document_templates')
    ->where('id', $template->id)
    ->update([
        'fields' => json_encode($correctFields)
    ]);

echo "\n✓ Field positions updated!\n";
echo "\n=== UPDATE COMPLETE ===\n";
