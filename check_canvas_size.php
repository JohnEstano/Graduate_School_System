<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$t = \App\Models\DocumentTemplate::first();
echo "Canvas dimensions in template:\n";
echo "Width: " . ($t->fields_meta['canvas_width'] ?? 'NULL') . "\n";
echo "Height: " . ($t->fields_meta['canvas_height'] ?? 'NULL') . "\n";

// Get actual PDF size
$pdfPath = storage_path('app/public/' . $t->file_path);
echo "\nPDF Path: $pdfPath\n";
echo "File exists: " . (file_exists($pdfPath) ? 'YES' : 'NO') . "\n";

// Show field positions
echo "\nField positions in database:\n";
foreach ($t->fields ?? [] as $field) {
    echo "  {$field['key']}: ({$field['x']}, {$field['y']}) size {$field['width']}x{$field['height']}\n";
}
