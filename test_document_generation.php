<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DefenseRequest;
use App\Models\DocumentTemplate;
use App\Services\DocumentGenerator;

echo "=== Testing Document Generation ===\n\n";

// Get a defense request
$request = DefenseRequest::with(['student', 'adviserUser', 'coordinator'])->first();

if (!$request) {
    echo "No defense requests found!\n";
    exit;
}

echo "Defense Request ID: {$request->id}\n";
echo "Student: " . ($request->student ? "{$request->student->first_name} {$request->student->last_name}" : "N/A") . "\n";
echo "Program: {$request->program}\n";
echo "Adviser User ID: " . ($request->adviser_user_id ?? 'NULL') . "\n";
echo "Coordinator User ID: " . ($request->coordinator_user_id ?? 'NULL') . "\n\n";

// Get a template
$template = DocumentTemplate::first();

if (!$template) {
    echo "No templates found!\n";
    exit;
}

echo "Template: {$template->name}\n";
echo "Fields count: " . count($template->fields ?? []) . "\n\n";

// Show template fields
if ($template->fields) {
    echo "Template Fields:\n";
    foreach ($template->fields as $field) {
        echo "  - {$field['key']} ({$field['type']}) @ ({$field['x']}, {$field['y']}) size: {$field['width']}x{$field['height']}\n";
    }
    echo "\n";
}

// Generate document
echo "Generating document...\n";

try {
    $generator = new DocumentGenerator();
    $generated = $generator->generate($template, $request);
    
    echo "✓ Document generated successfully!\n";
    echo "  Output: {$generated->output_path}\n";
    echo "  Status: {$generated->status}\n";
    echo "  Size: " . filesize(storage_path('app/public/' . $generated->output_path)) . " bytes\n";
    
    // Show the payload
    $payload = $generated->payload;
    if (is_string($payload)) {
        $payload = json_decode($payload, true);
    }
    echo "\nPayload Data:\n";
    echo "  Student Name: " . ($payload['student']['full_name'] ?? 'N/A') . "\n";
    echo "  Student Program: " . ($payload['student']['program'] ?? 'N/A') . "\n";
    echo "  Adviser Name: " . ($payload['adviser']['full_name'] ?? 'N/A') . "\n";
    echo "  Coordinator Name: " . ($payload['coordinator']['full_name'] ?? 'N/A') . "\n";
    echo "  Dean Name: " . ($payload['dean']['full_name'] ?? 'N/A') . "\n";
    echo "  Today's Date: " . ($payload['today']['date'] ?? 'N/A') . "\n";
    
} catch (\Exception $e) {
    echo "✗ Error generating document!\n";
    echo "  Error: " . $e->getMessage() . "\n";
    echo "  File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n=== Test Complete ===\n";
