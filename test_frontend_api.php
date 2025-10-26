<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║     FRONTEND API RESPONSE SIMULATION                        ║\n";
echo "╚══════════════════════════════════════════════════════════════╝\n\n";

// Simulate Honorarium Index
echo "1. GET /honorarium (Index Page)\n";
echo str_repeat("═", 60) . "\n";

$records = \App\Models\ProgramRecord::orderBy('date_edited', 'desc')->get();
$response = $records->map(function($record) {
    return [
        'id' => $record->id,
        'name' => $record->name,
        'category' => $record->category,
        'date_edited' => $record->date_edited->format('Y-m-d'),
    ];
});

echo json_encode(['records' => $response], JSON_PRETTY_PRINT);

// Simulate Honorarium Show
echo "\n\n2. GET /honorarium/individual-record/1 (Program Details)\n";
echo str_repeat("═", 60) . "\n";

$record = \App\Models\ProgramRecord::with([
    'panelists.students.payments',
    'panelists.payments'
])->find(1);

$panelists = $record->panelists->map(function($panelist) {
    $roles = $panelist->students->pluck('pivot.role')->filter()->unique()->values()->all();
    $roleSummary = count($roles) === 1 ? $roles[0] : (count($roles) > 1 ? implode(', ', $roles) : $panelist->role);
    
    return [
        'id' => $panelist->id,
        'pfirst_name' => $panelist->pfirst_name,
        'pmiddle_name' => $panelist->pmiddle_name ?? '',
        'plast_name' => $panelist->plast_name,
        'role' => $roleSummary,
        'students' => $panelist->students->map(function($student) use ($panelist) {
            return [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'middle_name' => $student->middle_name ?? '',
                'last_name' => $student->last_name,
                'program' => $student->program,
                'defense_date' => $student->defense_date ? date('Y-m-d', strtotime($student->defense_date)) : null,
                'defense_type' => $student->defense_type ?? 'N/A',
                'or_number' => $student->or_number ?? 'N/A',
                'assigned_role' => $student->pivot->role ?? 'N/A',
                'payments' => $student->payments->where('panelist_record_id', $panelist->id)->map(function($payment) use ($student) {
                    return [
                        'id' => $payment->id,
                        'payment_date' => $payment->payment_date ? date('Y-m-d', strtotime($payment->payment_date)) : null,
                        'defense_status' => $payment->defense_status ?? 'N/A',
                        'amount' => (float) $payment->amount,
                        'defense_date' => $student->defense_date ? date('Y-m-d', strtotime($student->defense_date)) : null,
                        'defense_type' => $student->defense_type ?? 'N/A',
                        'or_number' => $student->or_number ?? 'N/A',
                        'panelist_role' => $student->pivot->role ?? 'N/A',
                    ];
                })->values()
            ];
        })
    ];
});

$response = [
    'record' => [
        'id' => $record->id,
        'name' => $record->name,
    ],
    'panelists' => $panelists
];

echo json_encode($response, JSON_PRETTY_PRINT);

// Simulate Student Records Show
echo "\n\n3. GET /student-records/2 (Program Students)\n";
echo str_repeat("═", 60) . "\n";

$program = \App\Models\ProgramRecord::findOrFail(2);
$students = \App\Models\StudentRecord::where('program_record_id', 2)
    ->with(['payments.panelist'])
    ->get();

$studentsResponse = $students->map(function($student) {
    return [
        'id' => $student->id,
        'first_name' => $student->first_name,
        'middle_name' => $student->middle_name,
        'last_name' => $student->last_name,
        'student_id' => $student->student_id,
        'program' => $student->program,
        'payments' => $student->payments->map(function($payment) {
            return [
                'id' => $payment->id,
                'payment_date' => $payment->payment_date ? date('Y-m-d', strtotime($payment->payment_date)) : null,
                'defense_status' => $payment->defense_status,
                'amount' => (float) $payment->amount,
                'panelist' => [
                    'name' => trim("{$payment->panelist->pfirst_name} {$payment->panelist->pmiddle_name} {$payment->panelist->plast_name}"),
                    'role' => $payment->panelist->role,
                ]
            ];
        })
    ];
});

$response = [
    'program' => [
        'id' => $program->id,
        'name' => $program->name,
    ],
    'students' => $studentsResponse
];

echo json_encode($response, JSON_PRETTY_PRINT);

echo "\n\n✅ All API responses simulated successfully!\n";
echo "Frontend should be able to display this data correctly.\n";
