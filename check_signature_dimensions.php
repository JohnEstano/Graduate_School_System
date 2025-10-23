<?php
require __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\UserSignature;
use App\Models\DocumentTemplate;

echo "=== Signature Dimensions ===\n\n";

$signatures = UserSignature::where('active', true)->get();

foreach ($signatures as $sig) {
    echo "User ID: {$sig->user_id}\n";
    echo "Natural Width: {$sig->natural_width}px\n";
    echo "Natural Height: {$sig->natural_height}px\n";
    echo "Aspect Ratio: " . round($sig->natural_width / $sig->natural_height, 2) . ":1\n";
    echo "Recommended field width on PDF: 150-200px\n";
    echo "Recommended field height on PDF: " . round((150 / $sig->natural_width) * $sig->natural_height) . "-" . round((200 / $sig->natural_width) * $sig->natural_height) . "px\n";
    echo "\n---\n\n";
}

echo "=== Template Signature Field Dimensions ===\n\n";

$templates = DocumentTemplate::all();

foreach ($templates as $tpl) {
    echo "Template: {$tpl->name}\n";
    if ($tpl->fields) {
        foreach ($tpl->fields as $field) {
            if ($field['type'] === 'signature') {
                echo "  Signature Field: {$field['key']}\n";
                echo "    Width: {$field['width']}px\n";
                echo "    Height: {$field['height']}px\n";
                echo "    Aspect Ratio: " . round($field['width'] / $field['height'], 2) . ":1\n";
                
                // Check if dimensions match signature aspect ratio (690x300 = 2.3:1)
                $fieldRatio = $field['width'] / $field['height'];
                $sigRatio = 690 / 300; // 2.3
                if (abs($fieldRatio - $sigRatio) > 0.5) {
                    echo "    ⚠️  WARNING: Field aspect ratio doesn't match signature! Signature may appear distorted.\n";
                    echo "    Recommended: Keep width={$field['width']}, change height to " . round($field['width'] / $sigRatio) . "\n";
                }
                echo "\n";
            }
        }
    }
    echo "\n";
}
