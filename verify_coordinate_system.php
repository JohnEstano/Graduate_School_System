<?php
require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== COORDINATE SYSTEM VERIFICATION ===\n\n";

// Get template
$template = DB::table('document_templates')
    ->where('code', 'endorsement-form-prefinal-68fa18dcb3b1d')
    ->first();

if (!$template) {
    echo "Template not found!\n";
    exit(1);
}

echo "Template: {$template->name}\n";
echo "Code: {$template->code}\n\n";

$fields = json_decode($template->fields, true);
$fieldsMeta = json_decode($template->fields_meta, true);

echo "Canvas Size:\n";
echo "  Width: {$fieldsMeta['canvas_width']}px\n";
echo "  Height: {$fieldsMeta['canvas_height']}px\n\n";

echo "Current Fields in Database:\n";
echo str_repeat("-", 80) . "\n";
printf("%-25s %-10s %10s %10s %10s %10s\n", "KEY", "TYPE", "X", "Y", "WIDTH", "HEIGHT");
echo str_repeat("-", 80) . "\n";

foreach ($fields as $field) {
    printf(
        "%-25s %-10s %10.1f %10.1f %10.1f %10.1f\n",
        $field['key'],
        $field['type'],
        $field['x'],
        $field['y'],
        $field['width'],
        $field['height']
    );
}

echo "\n\n=== COORDINATE SYSTEM EXPLANATION ===\n\n";
echo "Both Canvas (frontend) and PDF (backend) use TOP-LEFT origin:\n";
echo "  Canvas:  (0,0) = top-left corner\n";
echo "  PDF:     (0,0) = top-left corner\n\n";

echo "Conversion Formula (px to mm):\n";
echo "  pdf_x = (canvas_x / canvas_width) * pdf_page_width\n";
echo "  pdf_y = (canvas_y / canvas_height) * pdf_page_height\n\n";

echo "NO INVERSION NEEDED - Coordinates map directly!\n\n";

// Test PDF dimensions
$pdfPath = storage_path("app/public/{$template->file_path}");
if (file_exists($pdfPath)) {
    require_once __DIR__.'/vendor/setasign/fpdi/src/autoload.php';
    
    $pdf = new \setasign\Fpdi\Fpdi();
    $pageCount = $pdf->setSourceFile($pdfPath);
    $pdf->AddPage();
    $tplId = $pdf->importPage(1);
    $pdf->useTemplate($tplId);
    
    $pageWidth = $pdf->GetPageWidth();
    $pageHeight = $pdf->GetPageHeight();
    
    echo "PDF Page Size:\n";
    echo "  Width: {$pageWidth}mm\n";
    echo "  Height: {$pageHeight}mm\n\n";
    
    echo "Example Conversion (signature.adviser field):\n";
    $sigField = array_values(array_filter($fields, fn($f) => $f['key'] === 'signature.adviser'))[0] ?? null;
    if ($sigField) {
        $pdfX = ($sigField['x'] / $fieldsMeta['canvas_width']) * $pageWidth;
        $pdfY = ($sigField['y'] / $fieldsMeta['canvas_height']) * $pageHeight;
        $pdfW = ($sigField['width'] / $fieldsMeta['canvas_width']) * $pageWidth;
        $pdfH = ($sigField['height'] / $fieldsMeta['canvas_height']) * $pageHeight;
        
        echo "  Canvas: x={$sigField['x']}px, y={$sigField['y']}px, w={$sigField['width']}px, h={$sigField['height']}px\n";
        echo "  PDF:    x=" . round($pdfX, 2) . "mm, y=" . round($pdfY, 2) . "mm, w=" . round($pdfW, 2) . "mm, h=" . round($pdfH, 2) . "mm\n";
    }
}

echo "\n=== VERIFICATION COMPLETE ===\n";
