<?php
require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== FIXING SIGNATURE FIELD TYPE ===\n\n";

// Get template
$template = DB::table('document_templates')
    ->where('code', 'endorsement-form-prefinal-68fa18dcb3b1d')
    ->first();

$fields = json_decode($template->fields, true);

echo "Before fix:\n";
foreach ($fields as $field) {
    if (str_contains($field['key'], 'signature')) {
        echo "  {$field['key']}: type={$field['type']}\n";
    }
}

// Fix signature field types
foreach ($fields as &$field) {
    if (str_contains($field['key'], 'signature.')) {
        echo "\nChanging {$field['key']} from type='{$field['type']}' to type='signature'\n";
        $field['type'] = 'signature';
    }
}

// Update database
DB::table('document_templates')
    ->where('id', $template->id)
    ->update(['fields' => json_encode($fields)]);

echo "\nAfter fix:\n";
foreach ($fields as $field) {
    if (str_contains($field['key'], 'signature')) {
        echo "  {$field['key']}: type={$field['type']}\n";
    }
}

echo "\n=== FIX COMPLETE ===\n";
