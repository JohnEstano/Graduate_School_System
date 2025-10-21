<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\DefenseRequestController;
use App\Models\User;

echo "=== TESTING DEFENSE REQUEST SUBMISSION ===\n\n";

// Simulate authentication as a student
$student = User::where('role', 'Student')->first();
if (!$student) {
    echo "No student user found. Creating test student...\n";
    $student = User::create([
        'first_name' => 'Test',
        'middle_name' => 'S',
        'last_name' => 'Student',
        'email' => 'test.student@university.edu',
        'password' => bcrypt('password'),
        'role' => 'Student',
        'school_id' => '2025-TEST-001',
        'program' => 'Master of Science in Computer Science'
    ]);
    echo "Created student: {$student->first_name} {$student->last_name} (ID: {$student->id})\n";
} else {
    // Update existing student with required fields if missing
    if (!$student->school_id || !$student->program) {
        $student->update([
            'school_id' => $student->school_id ?: '2025-TEST-' . $student->id,
            'program' => $student->program ?: 'Master of Science in Computer Science'
        ]);
        echo "Updated student data for required fields\n";
    }
}

Auth::login($student);
echo "Authenticated as: {$student->first_name} {$student->last_name} (Role: {$student->role})\n";
echo "School ID: {$student->school_id} | Program: {$student->program}\n\n";

// Create a mock request
$requestData = [
    'firstName' => $student->first_name,
    'middleName' => $student->middle_name,
    'lastName' => $student->last_name,
    'schoolId' => $student->school_id,
    'program' => $student->program,
    'thesisTitle' => 'Test Thesis: Advanced AI Systems',
    'defenseType' => 'Proposal',
    'defenseAdviser' => 'Muslimin B. Ontong',
    'referenceNo' => 'TEST-2025-002'
];

// Create temporary files for testing
$tempDir = sys_get_temp_dir();
$testFile1 = $tempDir . DIRECTORY_SEPARATOR . 'test_endorsement.pdf';
$testFile2 = $tempDir . DIRECTORY_SEPARATOR . 'test_payment.pdf';

file_put_contents($testFile1, 'Test PDF content for adviser endorsement');
file_put_contents($testFile2, 'Test PDF content for proof of payment');

echo "Test data prepared:\n";
foreach ($requestData as $key => $value) {
    echo "  {$key}: {$value}\n";
}

echo "\nAttempting to create defense request...\n";

try {
    $controller = new DefenseRequestController();
    
    // Create a mock HTTP request
    $request = Request::create('/defense-request', 'POST', $requestData);
    $request->headers->set('Accept', 'application/json');
    $request->query->set('json', '1');
    
    // Mock file uploads
    $uploadedFile1 = new \Illuminate\Http\Testing\File('rec_endorsement.pdf', fopen($testFile1, 'r'));
    $uploadedFile2 = new \Illuminate\Http\Testing\File('proof_payment.pdf', fopen($testFile2, 'r'));
    
    $request->files->set('recEndorsement', $uploadedFile1);
    $request->files->set('proofOfPayment', $uploadedFile2);
    
    $response = $controller->store($request);
    
    echo "Response Status: " . $response->getStatusCode() . "\n";
    echo "Response Content: " . $response->getContent() . "\n";
    
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

// Clean up temp files
unlink($testFile1);
unlink($testFile2);

echo "\n=== END TEST ===\n";
