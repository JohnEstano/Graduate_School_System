<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\{DefenseRequest, DocumentTemplate};
use App\Services\DocumentGenerator;

echo "=== Testing Signature in Document Generation ===\n\n";

// Find a defense request with an adviser
$request = DefenseRequest::whereNotNull('adviser_user_id')->first();

if (!$request) {
    echo "No defense request found with adviser_user_id\n";
    exit(1);
}

echo "Defense Request ID: {$request->id}\n";
echo "Student: {$request->first_name} {$request->last_name}\n";
echo "Adviser User ID: {$request->adviser_user_id}\n";

// Find a template
$template = DocumentTemplate::first();

if (!$template) {
    echo "No document template found\n";
    exit(1);
}

echo "Template: {$template->name}\n";
echo "Template has fields: " . (is_array($template->fields) ? count($template->fields) : 0) . "\n\n";

// Check if template has signature fields
if (is_array($template->fields)) {
    $sigFields = array_filter($template->fields, function($f) {
        return isset($f['type']) && $f['type'] === 'signature';
    });
    
    if (!empty($sigFields)) {
        echo "Signature fields in template:\n";
        foreach ($sigFields as $sf) {
            echo "  - {$sf['key']} (page {$sf['page']})\n";
        }
    } else {
        echo "⚠ No signature fields found in template\n";
    }
}

echo "\nAttempting to generate document...\n";

try {
    $generator = new DocumentGenerator();
    $generated = $generator->generate($template, $request);
    
    echo "\n✓ Document generated successfully!\n";
    echo "Output path: {$generated->output_path}\n";
    
    $fullPath = storage_path('app/public/' . $generated->output_path);
    echo "Full path: {$fullPath}\n";
    echo "File exists: " . (file_exists($fullPath) ? "Yes" : "No") . "\n";
    
    if (file_exists($fullPath)) {
        echo "File size: " . filesize($fullPath) . " bytes\n";
    }
    
    echo "\nCheck the Laravel log for signature processing details:\n";
    echo "  storage\\logs\\laravel.log\n";
    
} catch (\Throwable $e) {
    echo "\n✗ Error generating document:\n";
    echo "  {$e->getMessage()}\n";
    echo "\nFull trace:\n";
    echo $e->getTraceAsString() . "\n";
}
