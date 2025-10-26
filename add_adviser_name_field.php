<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DocumentTemplate;

echo "=== Adding Adviser Name Field ===\n\n";

$template = DocumentTemplate::where('name', 'like', '%Endorsement%Prefinal%')->first();

if (!$template) {
    echo "Template not found!\n";
    exit;
}

echo "Template: {$template->name}\n";

$fields = $template->fields ?? [];

// Add adviser.full_name field BELOW the signature
// Signature is at (76, 442) with height 87, so name should be at around (76, 535)
$adviserNameField = [
    'id' => uniqid('field_'),
    'key' => 'adviser.full_name',
    'page' => 1,
    'x' => 76,
    'y' => 535,  // Below the signature
    'width' => 200,
    'height' => 20,
    'type' => 'text',
    'font_size' => 10
];

$fields[] = $adviserNameField;

$template->fields = $fields;
$template->save();

echo "Added adviser.full_name field below signature\n";
echo "\nAll Fields:\n";
foreach ($template->fields as $i => $field) {
    echo "  [{$i}] {$field['key']} ({$field['type']}) @ ({$field['x']}, {$field['y']}) size: {$field['width']}x{$field['height']}\n";
}

echo "\n✓ Template updated!\n";
