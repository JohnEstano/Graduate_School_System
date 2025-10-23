<?php
require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== DEEP ANALYSIS: WHY FIELDS DON'T MATCH ===\n\n";

// Get template
$template = DB::table('document_templates')
    ->where('code', 'endorsement-form-prefinal-68fa18dcb3b1d')
    ->first();

$fields = json_decode($template->fields, true);
$fieldsMeta = json_decode($template->fields_meta, true);

echo "📊 CANVAS DIMENSIONS (Frontend - Template Editor)\n";
echo str_repeat("-", 80) . "\n";
echo "Canvas Width:  {$fieldsMeta['canvas_width']}px\n";
echo "Canvas Height: {$fieldsMeta['canvas_height']}px\n";
echo "Scale: 1.05 (hardcoded in TemplateEditor.tsx)\n\n";

// Analyze actual PDF
$pdfPath = storage_path("app/public/{$template->file_path}");
require_once __DIR__.'/vendor/setasign/fpdi/src/autoload.php';

$pdf = new \setasign\Fpdi\Fpdi();
$pageCount = $pdf->setSourceFile($pdfPath);
$pdf->AddPage();
$tplId = $pdf->importPage(1);
$pdf->useTemplate($tplId);

$pageWidth = $pdf->GetPageWidth();
$pageHeight = $pdf->GetPageHeight();

echo "📄 ACTUAL PDF DIMENSIONS (Backend - FPDI)\n";
echo str_repeat("-", 80) . "\n";
echo "PDF Width:  {$pageWidth}mm\n";
echo "PDF Height: {$pageHeight}mm\n\n";

echo "🔍 THE PROBLEM:\n";
echo str_repeat("-", 80) . "\n";

// Check if canvas matches the PDF
$pdfWidthPx = $pageWidth * (72/25.4); // Convert mm to points (72 DPI)
$pdfHeightPx = $pageHeight * (72/25.4);

echo "PDF in pixels (at 72 DPI):\n";
echo "  Width:  " . round($pdfWidthPx, 2) . "px\n";
echo "  Height: " . round($pdfHeightPx, 2) . "px\n\n";

echo "Canvas used for mapping:\n";
echo "  Width:  {$fieldsMeta['canvas_width']}px\n";
echo "  Height: {$fieldsMeta['canvas_height']}px\n\n";

// Check the viewport scale
echo "Template Editor uses pdf.js with scale: 1.05\n";
echo "This means the canvas is 5% LARGER than the actual PDF!\n\n";

$actualCanvasWidth = $pdfWidthPx * 1.05;
$actualCanvasHeight = $pdfHeightPx * 1.05;

echo "Expected canvas size at 1.05 scale:\n";
echo "  Width:  " . round($actualCanvasWidth, 2) . "px\n";
echo "  Height: " . round($actualCanvasHeight, 2) . "px\n\n";

if (abs($actualCanvasWidth - $fieldsMeta['canvas_width']) > 1) {
    echo "⚠️  MISMATCH DETECTED!\n";
    echo "   Canvas width should be " . round($actualCanvasWidth, 2) . "px but is {$fieldsMeta['canvas_width']}px\n";
    echo "   Difference: " . round($actualCanvasWidth - $fieldsMeta['canvas_width'], 2) . "px\n\n";
}

echo "🔧 COORDINATE CONVERSION ANALYSIS:\n";
echo str_repeat("-", 80) . "\n";

foreach ($fields as $field) {
    echo "\nField: {$field['key']}\n";
    echo "  Canvas position: ({$field['x']}, {$field['y']}) {$field['width']}×{$field['height']}px\n";
    
    // Current conversion (what the code does)
    $currentX = ($field['x'] / $fieldsMeta['canvas_width']) * $pageWidth;
    $currentY = ($field['y'] / $fieldsMeta['canvas_height']) * $pageHeight;
    $currentW = ($field['width'] / $fieldsMeta['canvas_width']) * $pageWidth;
    $currentH = ($field['height'] / $fieldsMeta['canvas_height']) * $pageHeight;
    
    echo "  Current PDF (mm): (" . round($currentX, 2) . ", " . round($currentY, 2) . ") ";
    echo round($currentW, 2) . "×" . round($currentH, 2) . "mm\n";
    
    // What it should be if we account for scale
    $correctX = ($field['x'] / $actualCanvasWidth) * $pageWidth;
    $correctY = ($field['y'] / $actualCanvasHeight) * $pageHeight;
    $correctW = ($field['width'] / $actualCanvasWidth) * $pageWidth;
    $correctH = ($field['height'] / $actualCanvasHeight) * $pageHeight;
    
    echo "  Corrected PDF (mm): (" . round($correctX, 2) . ", " . round($correctY, 2) . ") ";
    echo round($correctW, 2) . "×" . round($correctH, 2) . "mm\n";
    
    $deltaX = $correctX - $currentX;
    $deltaY = $correctY - $currentY;
    
    if (abs($deltaX) > 0.5 || abs($deltaY) > 0.5) {
        echo "  ⚠️  Position error: Δx=" . round($deltaX, 2) . "mm, Δy=" . round($deltaY, 2) . "mm\n";
    }
}

echo "\n\n💡 ROOT CAUSE:\n";
echo str_repeat("-", 80) . "\n";
echo "The canvas dimensions stored in fields_meta don't match the actual\n";
echo "rendered canvas size in the template editor (which uses 1.05 scale).\n\n";
echo "The pdf.js viewport scale of 1.05 makes the canvas 5% larger, but\n";
echo "when we save, we might be using the wrong canvas dimensions.\n\n";

echo "🔧 SOLUTION:\n";
echo str_repeat("-", 80) . "\n";
echo "Option 1: Use the ACTUAL canvas dimensions from pdf.js (recommended)\n";
echo "   - Update fields_meta with: " . round($actualCanvasWidth, 2) . "×" . round($actualCanvasHeight, 2) . "px\n\n";
echo "Option 2: Remove the 1.05 scale and use 1.0 scale in template editor\n";
echo "   - This makes canvas exactly match PDF dimensions\n\n";

echo "=== ANALYSIS COMPLETE ===\n";
