<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PanelistRecord;

echo "Testing Panelist PDF Data Preparation\n";
echo "=====================================\n\n";

// Get a sample panelist with students
$panelist = PanelistRecord::with(['students.payments', 'program'])
    ->whereHas('students')
    ->first();

if (!$panelist) {
    echo "No panelist found with students.\n";
    exit;
}

echo "Panelist: {$panelist->pfirst_name} {$panelist->plast_name}\n";
echo "Role: {$panelist->role}\n";
echo "Program: " . ($panelist->program->name ?? 'N/A') . "\n\n";

echo "Students and Payments:\n";
echo "---------------------\n";

$totalHonorarium = 0;
$students = [];

foreach ($panelist->students as $student) {
    $payment = $student->payments->where('panelist_record_id', $panelist->id)->first();
    
    if ($payment) {
        $studentData = [
            'name' => trim("{$student->first_name} {$student->middle_name} {$student->last_name}"),
            'defense_type' => $student->defense_type ?? 'N/A',
            'defense_date' => $student->defense_date ?? 'N/A',
            'or_number' => $student->or_number ?? 'N/A',
            'amount' => floatval($payment->amount)
        ];
        
        $students[] = $studentData;
        $totalHonorarium += floatval($payment->amount);
        
        echo "{$studentData['name']}\n";
        echo "  Defense: {$studentData['defense_type']} on {$studentData['defense_date']}\n";
        echo "  OR: {$studentData['or_number']}\n";
        echo "  Amount: ₱" . number_format($studentData['amount'], 2) . "\n\n";
    }
}

echo "---------------------\n";
echo "Total Honorarium: ₱" . number_format($totalHonorarium, 2) . "\n";
echo "Total Students: " . count($students) . "\n\n";

echo "✓ PDF data preparation successful!\n";
echo "You can now download the PDF at:\n";
echo "/honorarium/panelist/{$panelist->id}/download-pdf\n";
