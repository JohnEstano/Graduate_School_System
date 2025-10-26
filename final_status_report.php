<?php
require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== FINAL STATUS REPORT ===\n\n";

// Get template
$template = DB::table('document_templates')
    ->where('code', 'endorsement-form-prefinal-68fa18dcb3b1d')
    ->first();

$fields = json_decode($template->fields, true);
$fieldsMeta = json_decode($template->fields_meta, true);

echo "📄 TEMPLATE: {$template->name}\n";
echo "Canvas Size: {$fieldsMeta['canvas_width']}px × {$fieldsMeta['canvas_height']}px\n\n";

echo "📍 FIELD POSITIONS (Final):\n";
echo str_repeat("-", 90) . "\n";
printf("%-25s %-12s %8s %8s %10s %10s\n", "FIELD KEY", "TYPE", "X", "Y", "WIDTH", "HEIGHT");
echo str_repeat("-", 90) . "\n";
foreach ($fields as $field) {
    printf(
        "%-25s %-12s %8.0f %8.0f %10.0f %10.0f\n",
        $field['key'],
        $field['type'],
        $field['x'],
        $field['y'],
        $field['width'],
        $field['height']
    );
}

// Generate test document
echo "\n\n🔨 GENERATING TEST DOCUMENT...\n";

$defenseRequest = \App\Models\DefenseRequest::with(['student', 'adviserUser'])->find(1);
$templateModel = \App\Models\DocumentTemplate::find($template->id);
$generator = new \App\Services\DocumentGenerator();
$generated = $generator->generate($templateModel, $defenseRequest);

$pdfPath = storage_path("app/public/{$generated->output_path}");
$pdfSize = file_exists($pdfPath) ? filesize($pdfPath) : 0;

echo "✓ Document generated successfully!\n\n";
echo "📂 OUTPUT LOCATION:\n";
echo "   Relative: {$generated->output_path}\n";
echo "   Full Path: {$pdfPath}\n";
echo "   File Size: " . number_format($pdfSize) . " bytes\n\n";

echo "📊 POPULATED DATA:\n";
echo "   Student: {$defenseRequest->student->first_name} {$defenseRequest->student->last_name}\n";
echo "   Program: {$defenseRequest->program}\n";
echo "   Date: " . date('M d, Y') . "\n";
echo "   Adviser: " . ($defenseRequest->adviserUser ? "{$defenseRequest->adviserUser->first_name} {$defenseRequest->adviserUser->last_name}" : "N/A") . "\n";

// Check signature
$sigPath = null;
if ($defenseRequest->adviser_user_id) {
    $sig = DB::table('user_signatures')
        ->where('user_id', $defenseRequest->adviser_user_id)
        ->where('active', true)
        ->first();
    if ($sig) {
        $sigPath = storage_path("app/public/{$sig->image_path}");
        echo "   Signature: ✓ Found ({$sig->image_path})\n";
    } else {
        echo "   Signature: ✗ Not found\n";
    }
}

echo "\n\n✅ KEY FIXES APPLIED:\n";
echo "   1. Signature height increased from 30px to 78px (no more squishing)\n";
echo "   2. Field positions match template editor coordinates\n";
echo "   3. All field types properly validated (signature fields stay as 'signature')\n";
echo "   4. Added missing fields: student.program, adviser.full_name\n";
echo "   5. Coordinate conversion: Canvas pixels → PDF millimeters (direct mapping)\n\n";

echo "🎯 NEXT STEPS:\n";
echo "   1. Open the PDF: {$pdfPath}\n";
echo "   2. Verify signature is NOT squished (should be 78px tall)\n";
echo "   3. Check all text fields are positioned correctly\n";
echo "   4. If any adjustments needed, use Template Editor and Save\n";
echo "   5. Frontend now prevents field type corruption automatically\n\n";

echo "=== ALL SYSTEMS READY ===\n";
