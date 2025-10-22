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
            ->get();

        // Group by program
        $programsData = [];
        foreach ($completedDefenses as $defense) {
            $programKey = $defense->program;
            
            if (!isset($programsData[$programKey])) {
                $programsData[$programKey] = [
                    'id' => $programKey,
                    'name' => $programKey,
                    'program' => $programKey,
                    'category' => ProgramLevel::getLevel($programKey),
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
            $programName = urldecode($programId);
        }

        if (!$programName) {
            abort(404, 'Program not found');
        }

        // Get all completed defenses for this program
        $defenses = DefenseRequest::where('program', $programName)
            ->where('workflow_state', 'completed')
            ->get();

        if ($defenses->isEmpty()) {
            abort(404, 'No completed defenses found for this program');
        }

        $program = $defenses->first()->program;
        $programLevel = ProgramLevel::getLevel($program);

        // Get all honorarium payments for these defenses
        $payments = HonorariumPayment::whereIn('defense_request_id', $defenses->pluck('id'))
            ->with('panelist', 'defenseRequest')
            ->get();

        // Group payments by panelist
        $panelistsData = [];
        
        foreach ($payments as $payment) {
            $panelist = $payment->panelist;
            
            if (!$panelist) {
                continue;
            }

            $defense = $payment->defenseRequest;
            $key = $panelist->id;
            
            if (!isset($panelistsData[$key])) {
                $panelistsData[$key] = [
                    'id' => $panelist->id,
                    'pfirst_name' => $panelist->name,
                    'pmiddle_name' => '',
                    'plast_name' => '',
                    'role' => $payment->role,
                    'defense_type' => $defense->defense_type ?? 'N/A',
                    'received_date' => $payment->payment_date,
                    'students' => [],
                    'amount' => 0,
                ];
            }
            
            // Format defense date properly
            $defenseDate = null;
            if ($defense->scheduled_date) {
                $defenseDate = $defense->scheduled_date instanceof \Carbon\Carbon 
                    ? $defense->scheduled_date->format('m/d/Y')
                    : \Carbon\Carbon::parse($defense->scheduled_date)->format('m/d/Y');
            } elseif ($defense->date_of_defense) {
                $defenseDate = $defense->date_of_defense instanceof \Carbon\Carbon
                    ? $defense->date_of_defense->format('m/d/Y')
                    : \Carbon\Carbon::parse($defense->date_of_defense)->format('m/d/Y');
            }

            // Add student payment data
            $panelistsData[$key]['students'][] = [
                'id' => $defense->id,
                'first_name' => $defense->first_name,
                'middle_name' => $defense->middle_name,
                'last_name' => $defense->last_name,
                'course_section' => $defense->program,
                'school_year' => date('Y'),
                'payments' => [
                    [
                        'id' => $payment->id,
                        'payment_date' => $payment->payment_date ?? $defense->updated_at->format('m/d/Y'),
                        'defense_date' => $defenseDate, // ✅ FIX: Add defense date
                        'defense_type' => $defense->defense_type, // ✅ FIX: Add defense type
                        'defense_status' => $defense->workflow_state,
                        'panelist_role' => $payment->role, // ✅ FIX: Add panelist role
                        'amount' => (float)$payment->amount,
                        'or_number' => $defense->reference_no ?? null, // ✅ FIX: Add OR number
                    ]
                ]
            ];
            
            // Sum total amount
            $panelistsData[$key]['amount'] += (float)$payment->amount;
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
                ->get();

            if ($defenses->isEmpty()) {
                abort(404, 'No completed defenses found');
            }

            $program = $defenses->first()->program;
            $programLevel = ProgramLevel::getLevel($program);

            // Get all honorarium payments
            $payments = HonorariumPayment::whereIn('defense_request_id', $defenses->pluck('id'))
                ->with('panelist', 'defenseRequest')
                ->get();

            $panelistsData = [];
            
            foreach ($payments as $payment) {
                $panelist = $payment->panelist;
                
                if (!$panelist) continue;

                $key = $panelist->id;
                
                if (!isset($panelistsData[$key])) {
                    $panelistsData[$key] = [
                        'id' => $panelist->id,
                        'name' => $panelist->name, // Add this
                        'pfirst_name' => $panelist->name, // For compatibility
                        'pmiddle_name' => '',
                        'plast_name' => '',
                        'role' => $payment->role,
                        'defense_type' => $payment->defenseRequest->defense_type ?? 'N/A',
                        'amount' => 0,
                        'received_date' => $payment->payment_date,
                    ];
                }
                
                $panelistsData[$key]['amount'] += (float) $payment->amount;
                
                if ($payment->payment_date) {
                    $currentDate = $panelistsData[$key]['received_date'];
                    if (!$currentDate || $payment->payment_date > $currentDate) {
                        $panelistsData[$key]['received_date'] = $payment->payment_date;
                    }
                }
            }

            $panelistsList = array_values($panelistsData);

            $pdf = Pdf::loadView('pdfs.honorarium-program', [
                'program' => $program,
                'programLevel' => $programLevel,
                'panelists' => $panelistsList,
                'totalAmount' => array_sum(array_column($panelistsList, 'amount')),
            ]);

            return $pdf->download("honorarium-{$program}.pdf");

        } catch (\Exception $e) {
            Log::error('PDF generation failed', ['error' => $e->getMessage()]);
            abort(500, 'Failed to generate PDF');
        }
    }
}
