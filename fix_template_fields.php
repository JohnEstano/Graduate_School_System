<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DocumentTemplate;

echo "=== Fixing Template Fields ===\n\n";

$template = DocumentTemplate::where('name', 'like', '%Endorsement%Prefinal%')->first();

if (!$template) {
    echo "Template not found!\n";
    exit;
}

echo "Template: {$template->name}\n";
echo "Current Fields:\n";
foreach ($template->fields ?? [] as $i => $field) {
    echo "  [{$i}] {$field['key']} ({$field['type']}) @ ({$field['x']}, {$field['y']}) size: {$field['width']}x{$field['height']}\n";
}

echo "\n";

// Fix the fields
$fields = $template->fields ?? [];

foreach ($fields as $key => $field) {
    // Fix signature.adviser field - change type from 'text' to 'signature'
    if ($field['key'] === 'signature.adviser' && $field['type'] !== 'signature') {
        echo "Fixing signature.adviser: changing type from '{$field['type']}' to 'signature'\n";
        $fields[$key]['type'] = 'signature';
        // Adjust dimensions for better aspect ratio (2.3:1)
        $fields[$key]['width'] = 200;
        $fields[$key]['height'] = 87;
        echo "  Updated dimensions to 200x87 (2.3:1 ratio)\n";
    }
    
    // Remove duplicate adviser.full_name at same position if it exists
    if ($field['key'] === 'adviser.full_name' && abs($field['y'] - 442) < 10) {
        echo "Removing duplicate adviser.full_name field at position ({$field['x']}, {$field['y']})\n";
        unset($fields[$key]);
    }
}

// Re-index array
$fields = array_values($fields);

// Save the fixed fields
$template->fields = $fields;
$template->save();

echo "\nFixed Fields:\n";
foreach ($template->fields as $i => $field) {
    echo "  [{$i}] {$field['key']} ({$field['type']}) @ ({$field['x']}, {$field['y']}) size: {$field['width']}x{$field['height']}\n";
}

echo "\n✓ Template fields fixed!\n";
