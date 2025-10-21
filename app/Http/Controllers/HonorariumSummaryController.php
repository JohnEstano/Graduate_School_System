<?php 

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use App\Models\HonorariumPayment;
use App\Models\Panelist;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Helpers\ProgramLevel;

class HonorariumSummaryController extends Controller
{
    public function index(Request $request)
    {
        Log::info('HonorariumSummaryController@index CALLED');

        // Get all completed defense requests grouped by program
        $completedDefenses = DefenseRequest::where('workflow_state', 'completed')
            ->with(['honorariumPayments.panelist'])
            ->get();

        // Group by program
        $programsData = [];
        foreach ($completedDefenses as $defense) {
            $programKey = $defense->program;
            
            if (!isset($programsData[$programKey])) {
                $programsData[$programKey] = [
                    'id' => $defense->id,
                    'name' => $defense->program,
                    'program' => $defense->program,
                    'category' => ProgramLevel::getLevel($defense->program),
                    'date_edited' => $defense->updated_at->format('Y-m-d'),
                ];
            }
        }

        $records = array_values($programsData);

        return Inertia::render('honorarium/Index', [
            'records' => $records,
        ]);
    }

    public function show($programId)
    {
        Log::info('HonorariumSummaryController@show CALLED', ['programId' => $programId]);

        // Get the program name
        $programName = null;
        
        if (is_numeric($programId)) {
            $firstDefense = DefenseRequest::find($programId);
            if ($firstDefense) {
                $programName = $firstDefense->program;
            }
        } else {
            $programName = $programId;
        }

        if (!$programName) {
            abort(404, 'Program not found');
        }

        // Get all completed defenses for this program WITH their stored honorarium payments
        $defenses = DefenseRequest::where('program', $programName)
            ->where('workflow_state', 'completed')
            ->with(['honorariumPayments.panelist'])
            ->get();

        if ($defenses->isEmpty()) {
            abort(404, 'No completed defenses found for this program');
        }

        $program = $defenses->first()->program;
        $programLevel = ProgramLevel::getLevel($program);

        Log::info('Processing program honorarium', [
            'program' => $program,
            'program_level' => $programLevel,
            'defenses_count' => $defenses->count()
        ]);

        // Group payments by panelist
        $panelistsData = [];
        
        foreach ($defenses as $defense) {
            Log::info('Processing defense for honorarium', [
                'defense_id' => $defense->id,
                'payments_count' => $defense->honorariumPayments->count()
            ]);

            // Use STORED honorarium payments instead of recalculating
            foreach ($defense->honorariumPayments as $payment) {
                $panelist = $payment->panelist;
                
                if (!$panelist) {
                    Log::warning('Honorarium payment missing panelist', [
                        'payment_id' => $payment->id,
                        'panelist_id' => $payment->panelist_id
                    ]);
                    continue;
                }

                // Create unique key for panelist + role combination
                $panelistKey = $payment->panelist_id . '_' . $payment->role . '_' . $defense->defense_type;
                
                if (!isset($panelistsData[$panelistKey])) {
                    $panelistsData[$panelistKey] = [
                        'id' => $panelist->id,
                        'pfirst_name' => $panelist->name,
                        'pmiddle_name' => '',
                        'plast_name' => '',
                        'role' => $payment->role,
                        'defense_type' => $defense->defense_type,
                        'received_date' => $payment->payment_date ?? $defense->updated_at->format('Y-m-d'),
                        'amount' => 0, // Will accumulate
                        'students' => []
                    ];
                }

                Log::info('Adding student payment to panelist', [
                    'panelist_id' => $panelist->id,
                    'panelist_name' => $panelist->name,
                    'role' => $payment->role,
                    'stored_amount' => $payment->amount,
                    'defense_id' => $defense->id,
                    'student' => $defense->first_name . ' ' . $defense->last_name
                ]);

                // Add student with STORED payment amount
                $panelistsData[$panelistKey]['students'][] = [
                    'id' => $defense->id,
                    'first_name' => $defense->first_name,
                    'middle_name' => $defense->middle_name,
                    'last_name' => $defense->last_name,
                    'program' => $defense->program,
                    'course_section' => $defense->defense_type,
                    'school_year' => $defense->created_at->format('Y') . '-' . ($defense->created_at->format('Y') + 1),
                    'or_number' => $defense->reference_no,
                    'defense_date' => $defense->scheduled_date ? $defense->scheduled_date->format('Y-m-d') : null,
                    'defense_type' => $defense->defense_type,
                    'payments' => [
                        [
                            'id' => $payment->id,
                            'defense_status' => 'Completed',
                            'payment_date' => $payment->payment_date ?? $defense->updated_at->format('Y-m-d'),
                            'amount' => floatval($payment->amount) // USE STORED AMOUNT from honorarium_payments table
                        ]
                    ]
                ];

                // Accumulate total amount from STORED payments
                $panelistsData[$panelistKey]['amount'] += floatval($payment->amount);
            }
        }

        $record = [
            'id' => $programId,
            'name' => $program,
            'program' => $program,
            'category' => $programLevel,
            'date_edited' => now()->format('Y-m-d')
        ];

        $panelistsList = array_values($panelistsData);

        Log::info('Honorarium summary prepared', [
            'program' => $program,
            'panelists_count' => count($panelistsList),
            'total_receivables' => array_sum(array_column($panelistsList, 'amount')),
            'sample_panelist' => $panelistsList[0] ?? null
        ]);

        return Inertia::render('honorarium/individual-record', [
            'record' => $record,
            'panelists' => $panelistsList,
        ]);
    }

    public function downloadProgramPdf($programId)
    {
        try {
            $programName = null;
            
            if (is_numeric($programId)) {
                $firstDefense = DefenseRequest::find($programId);
                if ($firstDefense) {
                    $programName = $firstDefense->program;
                }
            } else {
                $programName = $programId;
            }

            if (!$programName) {
                abort(404, 'Program not found');
            }

            $defenses = DefenseRequest::where('program', $programName)
                ->where('workflow_state', 'completed')
                ->with(['honorariumPayments.panelist'])
                ->get();

            if ($defenses->isEmpty()) {
                abort(404, 'No completed defenses found');
            }

            $program = $defenses->first()->program;
            
            $pdf = Pdf::loadView('pdfs.honorarium-summary', [
                'defenses' => $defenses,
                'program_name' => $program,
            ]);

            $filename = "honorarium-{$program}.pdf";
            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('Program PDF Generation Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate program PDF'], 500);
        }
    }
}
