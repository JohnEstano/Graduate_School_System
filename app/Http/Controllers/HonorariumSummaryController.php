<?php 

namespace App\Http\Controllers;

use App\Models\ProgramRecord;
use App\Models\DefenseRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HonorariumSummaryController extends Controller
{
    public function index(Request $request)
    {
        // Add this line at the top:
        \Log::info('HonorariumSummaryController@index CALLED');

        // Get all programs
        $programs = \App\Models\ProgramRecord::all();

        // Get all defense requests with payments
        $defenseRequests = \App\Models\DefenseRequest::with(['honorariumPayments', 'user'])->get();

        // Group payments by program
        $records = [];
        foreach ($programs as $program) {
            $programPayments = [];
            foreach ($defenseRequests as $dr) {
                if ($dr->program === $program->program) {
                    if ($dr->honorariumPayments) {
                        foreach ($dr->honorariumPayments as $payment) {
                            $programPayments[] = [
                                'id' => $payment->id,
                                'school_year' => $dr->created_at ? $dr->created_at->format('Y') . '-' . ($dr->created_at->format('Y') + 1) : '',
                                'payment_date' => $payment->payment_date ?? '',
                                'defense_status' => $dr->workflow_state_display ?? $dr->workflow_state ?? '',
                                'amount' => $payment->amount ?? '',
                                'panelist_name' => $payment->panelist->name ?? '',
                                'role' => $payment->role ?? '',
                            ];
                        }
                    }
                }
            }
            $records[] = [
                'id' => $program->id,
                'name' => $program->name,
                'program' => $program->program,
                'category' => $program->category,
                'date_edited' => $program->date_edited,
                'payments' => $programPayments,
            ];
        }

        // --- Add this dummy record for testing ---
        $records[] = [
            'id' => 999,
            'name' => 'Test Program',
            'program' => 'BSCOMP',
            'category' => 'Bachelors',
            'date_edited' => '2025-08-08',
            'payments' => [
                [
                    'id' => 1,
                    'school_year' => '2024-2025',
                    'payment_date' => '2025-08-08',
                    'defense_status' => 'Completed',
                    'amount' => '1000',
                    'panelist_name' => 'John Doe',
                    'role' => 'Panelist',
                ]
            ],
        ];
        // --- End dummy record ---

        return Inertia::render('honorarium/honorarium-summary/Index', [
            'records' => $records
        ]);
    }

    public function download(ProgramRecord $record)
    {
        // Get all defense requests for this program
        $defenseRequests = \App\Models\DefenseRequest::where('program', $record->program)->get();

        // Collect all honorarium payments for these defense requests
        $payments = [];
        foreach ($defenseRequests as $dr) {
            foreach ($dr->honorariumPayments as $payment) {
                $payments[] = [
                    'school_year' => $dr->created_at ? $dr->created_at->format('Y') . '-' . ($dr->created_at->format('Y') + 1) : '',
                    'payment_date' => $payment->payment_date ? $payment->payment_date : '',
                    'defense_status' => $dr->workflow_state_display ?? $dr->workflow_state,
                    'amount' => $payment->amount,
                    'panelist_name' => $payment->panelist?->name ?? '',
                    'role' => $payment->role,
                ];
            }
        }

        $filename = $record->name . '_payments.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function () use ($payments) {
            $handle = fopen('php://output', 'w');
            // CSV header
            fputcsv($handle, ['School Year', 'Payment Date', 'Defense Status', 'Panelist', 'Role', 'Amount']);

            foreach ($payments as $payment) {
                fputcsv($handle, [
                    $payment['school_year'],
                    $payment['payment_date'],
                    $payment['defense_status'],
                    $payment['panelist_name'],
                    $payment['role'],
                    $payment['amount'],
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
