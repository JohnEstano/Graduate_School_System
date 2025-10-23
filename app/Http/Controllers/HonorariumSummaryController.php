<?php 

namespace App\Http\Controllers;

use App\Models\ProgramRecord;
use App\Models\PaymentRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\HonorariumService;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class HonorariumSummaryController extends Controller
{
   public function index(Request $request)
    {
        $records = ProgramRecord::query()
            ->when($request->year, fn($q) => $q->whereYear('date_edited', $request->year))
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->search, fn($q) => $q->where('name', 'like', '%'.$request->search.'%'))
            ->orderBy('date_edited', 'desc')
            ->get();

        return Inertia::render('honorarium/Index', [
            'records' => $records,
        ]);
    }

    // This method renders the individual record page (Page 2)
public function show($programId)
{
    // Fetch the program record with panelists and their related data
    $record = ProgramRecord::with([
        'panelists.students.payments',
        'panelists.payments'
    ])->findOrFail($programId);

    // Format panelists data with students and payments
    $panelists = $record->panelists->map(function($panelist) {
        return [
            'id' => $panelist->id,
            'pfirst_name' => $panelist->pfirst_name,
            'pmiddle_name' => $panelist->pmiddle_name ?? '',
            'plast_name' => $panelist->plast_name,
            'role' => $panelist->role,
            'defense_type' => 'Proposal', // Default value since column doesn't exist in DB
            'received_date' => $panelist->received_date ? date('Y-m-d', strtotime($panelist->received_date)) : null,
            'students' => $panelist->students->map(function($student) use ($panelist) {
                return [
                    'id' => $student->id,
                    'first_name' => $student->first_name,
                    'middle_name' => $student->middle_name ?? '',
                    'last_name' => $student->last_name,
                    'program' => $student->program,
                    'course_section' => $student->course_section ?? 'Regular',
                    'school_year' => $student->school_year ?? '2024-2025',
                    'defense_date' => $student->defense_date ? date('Y-m-d', strtotime($student->defense_date)) : null,
                    'defense_type' => $student->defense_type ?? 'N/A',
                    'or_number' => $student->or_number ?? 'N/A',
                    'payments' => $student->payments->where('panelist_record_id', $panelist->id)->map(function($payment) use ($student, $panelist) {
                        return [
                            'id' => $payment->id,
                            'payment_date' => $payment->payment_date ? date('Y-m-d', strtotime($payment->payment_date)) : null,
                            'defense_status' => $payment->defense_status ?? 'N/A',
                            'amount' => (float) $payment->amount,
                            // Include student data in payment for easier access in frontend
                            'defense_date' => $student->defense_date ? date('Y-m-d', strtotime($student->defense_date)) : null,
                            'defense_type' => $student->defense_type ?? 'N/A',
                            'or_number' => $student->or_number ?? 'N/A',
                            'panelist_role' => $panelist->role,
                        ];
                    })->values()
                ];
            })
        ];
    });
  
    return Inertia::render('honorarium/individual-record', [
        'record'    => $record,
        'panelists' => $panelists,
    ]);
}



public function storePanelist(Request $request, $programId)
{
    $program = ProgramRecord::findOrFail($programId);

    $validated = $request->validate([
        'pfirst_name'   => 'required|string|max:255',
        'pmiddle_name'  => 'nullable|string|max:255',
        'plast_name'    => 'required|string|max:255',
        'role'          => 'required|string',
        'defense_type'  => 'required|string',
        'received_date' => 'required|date|before_or_equal:today',
    ]);

    $panelist = $program->panelists()->create($validated);
    $panelist->load('program');

    return response()->json([
        'message' => 'Panelist added successfully!',
        'panelist' => $panelist
    ], 201);
}



public function downloadCSV(ProgramRecord $record)
    {
        $filename = $record->name . '_payments.csv';

        // Collect all payments for students under this program
        $payments = $record->studentRecords()
            ->with('payments')
            ->get()
            ->flatMap(fn($student) => $student->payments);

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function () use ($payments) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['School Year', 'Payment Date', 'Defense Status', 'Amount']);

            foreach ($payments as $payment) {
                fputcsv($handle, [
                    $payment->school_year,
                    $payment->payment_date,
                    $payment->defense_status,
                    $payment->amount,
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function students($programId)
    {
        // Get all students for this program, with their payments
        $students = \App\Models\StudentRecord::with('payments')
            ->where('program_record_id', $programId)
            ->get();

        return response()->json(['students' => $students]);
    }

    // Add this method for the PDF download functionality from your React component
    public function downloadProgramPdf($programId)
    {
        try {
            $record = ProgramRecord::with([
                'panelists.students.payments',
                'studentRecords.payments',
            ])->findOrFail($programId);

            $pdf = Pdf::loadView('pdfs.honorarium-summary', [
                'record' => $record,
                'panelists' => $record->panelists,
                'program_name' => $record->name,
                'program_level' => $record->program,
            ]);

            $filename = "honorarium-{$record->name}.pdf";

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('Program PDF Generation Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate program PDF'], 500);
        }
    }

    public function downloadPdfApi(Request $request, $programId)
    {
        try {
            // 1. Load program with relationships
            $record = ProgramRecord::with([
                'panelists.students.payments',
                'studentRecords.payments',
            ])->findOrFail($programId);

            if (!$record) {
                throw new \Exception("Program record not found");
            }

            // 2. Filter panelists if array provided
            if ($request->has('panelists') && !empty($request->panelists)) {
                $panelistIds = $request->panelists;
                $filteredPanelists = $record->panelists->filter(function ($panelist) use ($panelistIds) {
                    return in_array($panelist->id, $panelistIds);
                });

                // Replace relation safely
                $record->setRelation('panelists', $filteredPanelists);
            }

            // 3. Ensure Blade template exists
            if (!view()->exists('pdfs.honorarium-summary')) {
                throw new \Exception("PDF template not found");
            }

            // 4. Prepare data for view
            $viewData = [
                'record' => $record,
                'panelists' => $record->panelists,
                'generated_at' => now()->format('Y-m-d H:i:s'),
            ];

            // 5. Generate PDF
            $pdf = Pdf::loadView('pdfs.honorarium-summary', $viewData);
            $pdf->setPaper('a4', 'portrait');
            $pdf->setOption(['dpi' => 150, 'defaultFont' => 'sans-serif']);

            // 6. Safe filename
            $safeName = preg_replace('/[^A-Za-z0-9\-]/', '-', $record->name);
            $filename = "honorarium-{$safeName}-" . date('Y-m-d') . ".pdf";

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('API PDF Generation Error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'error' => 'Failed to generate PDF',
                'message' => $e->getMessage(),
                'trace' => app()->environment('local') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    public function downloadPanelistPdf(Request $request, $panelistId)
    {
        try {
            // Load panelist with students and payments
            $panelist = \App\Models\PanelistRecord::with([
                'students.payments',
                'program'
            ])->findOrFail($panelistId);

            // Get program name
            $programName = $panelist->program->name ?? 'Office of the Dean of Graduate School';

            // Prepare student payments data
            $students = [];
            $totalHonorarium = 0;

            foreach ($panelist->students as $student) {
                $payment = $student->payments->where('panelist_record_id', $panelist->id)->first();
                
                if ($payment) {
                    $students[] = [
                        'name' => trim("{$student->first_name} {$student->middle_name} {$student->last_name}"),
                        'defense_type' => $student->defense_type ?? 'N/A',
                        'defense_date' => $student->defense_date ? date('F d, Y', strtotime($student->defense_date)) : '-',
                        'or_number' => $student->or_number ?? 'N/A',
                        'amount' => floatval($payment->amount)
                    ];
                    
                    $totalHonorarium += floatval($payment->amount);
                }
            }

            // Prepare data for view
            $data = [
                'panelist_name' => strtoupper(trim("{$panelist->pfirst_name} {$panelist->pmiddle_name} {$panelist->plast_name}")),
                'role' => $panelist->role,
                'program_name' => $programName,
                'students' => $students,
                'total_honorarium' => $totalHonorarium,
                'today_date' => now()->format('F d, Y')
            ];

            // Generate PDF
            $html = view('pdfs.panelist-honorarium-summary', $data)->render();
            $pdf = Pdf::loadHTML($html);
            $pdf->setPaper('a4', 'portrait');

            $filename = "panelist_honorarium_" . strtolower(str_replace(' ', '_', $panelist->plast_name)) . "_" . date('Y-m-d') . ".pdf";
            
            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('Panelist PDF Generation Error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'error' => 'Failed to generate PDF',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

