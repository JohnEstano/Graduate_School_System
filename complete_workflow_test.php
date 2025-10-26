<?php
require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Services\DocumentGenerator;
use App\Models\{DocumentTemplate, DefenseRequest};

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== COMPLETE WORKFLOW TEST ===\n\n";

// 1. Check Template State
echo "1. TEMPLATE STATE\n";
echo str_repeat("-", 80) . "\n";
$template = DocumentTemplate::where('code', 'endorsement-form-prefinal-68fa18dcb3b1d')->first();
echo "Template: {$template->name}\n";
echo "Canvas: {$template->fields_meta['canvas_width']}x{$template->fields_meta['canvas_height']}px\n\n";

echo "Fields in Database:\n";
printf("%-25s %-12s %8s %8s %8s %8s\n", "KEY", "TYPE", "X", "Y", "WIDTH", "HEIGHT");
echo str_repeat("-", 80) . "\n";
foreach ($template->fields as $field) {
    printf(
        "%-25s %-12s %8.0f %8.0f %8.0f %8.0f\n",
        $field['key'],
        $field['type'],
        $field['x'],
        $field['y'],
        $field['width'],
        $field['height']
    );
}

// 2. Check Defense Request
echo "\n\n2. DEFENSE REQUEST DATA\n";
echo str_repeat("-", 80) . "\n";
$request = DefenseRequest::with(['student', 'adviserUser', 'coordinator'])->find(1);
echo "Request ID: {$request->id}\n";
echo "Student: {$request->student->first_name} {$request->student->last_name}\n";
echo "Adviser User ID: {$request->adviser_user_id}\n";
echo "Adviser Name: " . ($request->adviserUser ? "{$request->adviserUser->first_name} {$request->adviserUser->last_name}" : "N/A") . "\n";

// 3. Check Signatures
echo "\n\n3. SIGNATURE FILES\n";
echo str_repeat("-", 80) . "\n";
$signatures = DB::table('user_signatures')->where('active', true)->get();
foreach ($signatures as $sig) {
    $fullPath = storage_path("app/public/{$sig->image_path}");
    $exists = file_exists($fullPath);
    $size = $exists ? filesize($fullPath) : 0;
    echo "User {$sig->user_id}: {$sig->image_path} " . ($exists ? "✓ ({$size} bytes)" : "✗ NOT FOUND") . "\n";
}

// 4. Generate Document
echo "\n\n4. DOCUMENT GENERATION\n";
echo str_repeat("-", 80) . "\n";
$generator = new DocumentGenerator();
$generated = $generator->generate($template, $request);

$pdfPath = storage_path("app/public/{$generated->output_path}");
$pdfExists = file_exists($pdfPath);
$pdfSize = $pdfExists ? filesize($pdfPath) : 0;

echo "Output: {$generated->output_path}\n";
echo "File exists: " . ($pdfExists ? "✓" : "✗") . "\n";
echo "File size: " . number_format($pdfSize) . " bytes\n";

// 5. Verify PDF Coordinate Conversion
echo "\n\n5. COORDINATE CONVERSION VERIFICATION\n";
echo str_repeat("-", 80) . "\n";

require_once __DIR__.'/vendor/setasign/fpdi/src/autoload.php';
$pdf = new \setasign\Fpdi\Fpdi();
$srcPath = storage_path("app/public/{$template->file_path}");
$pdf->setSourceFile($srcPath);
$pdf->AddPage();
$tplId = $pdf->importPage(1);
$pdf->useTemplate($tplId);

$pageWidth = $pdf->GetPageWidth();
$pageHeight = $pdf->GetPageHeight();
$canvasWidth = $template->fields_meta['canvas_width'];
$canvasHeight = $template->fields_meta['canvas_height'];

echo "PDF Page: {$pageWidth}mm x {$pageHeight}mm\n";
echo "Canvas: {$canvasWidth}px x {$canvasHeight}px\n";
echo "Scale Factor X: " . round($pageWidth / $canvasWidth, 4) . " mm/px\n";
echo "Scale Factor Y: " . round($pageHeight / $canvasHeight, 4) . " mm/px\n\n";

echo "Field Conversion Examples:\n";
echo str_repeat("-", 80) . "\n";
printf("%-25s %20s %20s\n", "FIELD", "CANVAS (px)", "PDF (mm)");
echo str_repeat("-", 80) . "\n";

foreach ($template->fields as $field) {
    $pdfX = ($field['x'] / $canvasWidth) * $pageWidth;
    $pdfY = ($field['y'] / $canvasHeight) * $pageHeight;
    $pdfW = ($field['width'] / $canvasWidth) * $pageWidth;
    $pdfH = ($field['height'] / $canvasHeight) * $pageHeight;
    
    printf(
        "%-25s (%5.0f,%5.0f) %4.0fx%-3.0f   (%6.1f,%6.1f) %5.1fx%-4.1f\n",
        $field['key'],
        $field['x'], $field['y'], $field['width'], $field['height'],
        $pdfX, $pdfY, $pdfW, $pdfH
    );
}

// 6. Check logs for errors
echo "\n\n6. RECENT LOG ENTRIES\n";
echo str_repeat("-", 80) . "\n";
$logPath = storage_path('logs/laravel.log');
if (file_exists($logPath)) {
    $lines = file($logPath);
    $recentLines = array_slice($lines, -20);
    foreach ($recentLines as $line) {
        if (str_contains($line, 'DocumentGenerator') || str_contains($line, 'Signature')) {
            echo trim($line) . "\n";
        }
    }
} else {
    echo "Log file not found\n";
}

echo "\n\n=== WORKFLOW TEST COMPLETE ===\n";
echo "\nNEXT STEPS:\n";
echo "1. Open the PDF at: {$pdfPath}\n";
echo "2. Verify signature is visible\n";
echo "3. Check if text fields are positioned correctly\n";
echo "4. If positions are wrong, adjust in Template Editor and click Save\n";
echo "5. Re-run this test to verify changes\n\n";
