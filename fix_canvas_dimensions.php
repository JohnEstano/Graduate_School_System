<?php
require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== FIXING CANVAS DIMENSIONS AND FIELD POSITIONS ===\n\n";

// Get template
$template = DB::table('document_templates')
    ->where('code', 'endorsement-form-prefinal-68fa18dcb3b1d')
    ->first();

$fields = json_decode($template->fields, true);
$oldFieldsMeta = json_decode($template->fields_meta, true);

// Calculate correct canvas dimensions at scale 1.0
$pdfPath = storage_path("app/public/{$template->file_path}");
require_once __DIR__.'/vendor/setasign/fpdi/src/autoload.php';

$pdf = new \setasign\Fpdi\Fpdi();
$pdf->setSourceFile($pdfPath);
$pdf->AddPage();
$pdf->importPage(1);

$pageWidth = $pdf->GetPageWidth();
$pageHeight = $pdf->GetPageHeight();

// Convert mm to pixels at 72 DPI (same as pdf.js default)
$correctCanvasWidth = round($pageWidth * (72/25.4), 2);
$correctCanvasHeight = round($pageHeight * (72/25.4), 2);

echo "OLD Canvas dimensions: {$oldFieldsMeta['canvas_width']}×{$oldFieldsMeta['canvas_height']}px\n";
echo "NEW Canvas dimensions: {$correctCanvasWidth}×{$correctCanvasHeight}px\n\n";

// Recalculate field positions
// Old positions were based on wrong canvas, need to convert them
$scaleX = $correctCanvasWidth / $oldFieldsMeta['canvas_width'];
$scaleY = $correctCanvasHeight / $oldFieldsMeta['canvas_height'];

echo "Scale factors: X={$scaleX}, Y={$scaleY}\n\n";

echo "Recalculating field positions:\n";
echo str_repeat("-", 80) . "\n";
printf("%-25s %15s %20s\n", "FIELD", "OLD (px)", "NEW (px)");
echo str_repeat("-", 80) . "\n";

foreach ($fields as &$field) {
    $oldX = $field['x'];
    $oldY = $field['y'];
    $oldW = $field['width'];
    $oldH = $field['height'];
    
    // Scale positions
    $field['x'] = round($oldX * $scaleX, 2);
    $field['y'] = round($oldY * $scaleY, 2);
    $field['width'] = round($oldW * $scaleX, 2);
    $field['height'] = round($oldH * $scaleY, 2);
    
    printf(
        "%-25s (%4.0f,%4.0f) %3.0f×%-2.0f   (%4.0f,%4.0f) %3.0f×%-2.0f\n",
        $field['key'],
        $oldX, $oldY, $oldW, $oldH,
        $field['x'], $field['y'], $field['width'], $field['height']
    );
}

// Update database
$newFieldsMeta = [
    'canvas_width' => $correctCanvasWidth,
    'canvas_height' => $correctCanvasHeight
];

DB::table('document_templates')
    ->where('id', $template->id)
    ->update([
        'fields' => json_encode($fields),
        'fields_meta' => json_encode($newFieldsMeta)
    ]);

echo "\n✓ Template updated with correct canvas dimensions!\n";
echo "✓ All field positions recalculated!\n\n";

echo "=== UPDATE COMPLETE ===\n";
echo "\nNext: Refresh the template editor page to see the changes.\n";
echo "The fields should now match exactly!\n";
