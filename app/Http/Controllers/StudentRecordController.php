<?php

namespace App\Http\Controllers;

use App\Models\StudentRecord;
use App\Models\DefenseRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StudentRecordController extends Controller
{
    public function index(Request $request)
    {
        $records = StudentRecord::with(['payments.panelistRecord'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('first_name', 'like', "%{$search}%")
                      ->orWhere('middle_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_id', 'like', "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        // Transform to group payments by defense
        $records->getCollection()->transform(function ($student) {
            // Find the actual defense requests for this student
            $defenseRequests = DefenseRequest::where('school_id', $student->student_id)
                ->where('workflow_state', 'completed')
                ->get()
                ->keyBy('id');

            // Group payments by payment_date (represents same defense)
            $defenseGroups = $student->payments->groupBy('payment_date')->map(function ($payments) use ($defenseRequests, $student) {
                $firstPayment = $payments->first();
                
                // Try to find matching defense request
                $defenseRequest = $defenseRequests->first(function ($dr) use ($firstPayment) {
                    return $dr->scheduled_date && 
                           date('Y-m-d', strtotime($dr->scheduled_date)) === date('Y-m-d', strtotime($firstPayment->payment_date));
                });

                return [
                    'id' => $firstPayment->id,
                    'defense_date' => $defenseRequest->scheduled_date ?? $firstPayment->payment_date,
                    'defense_type' => $defenseRequest->defense_type ?? 'Proposal',
                    'defense_status' => $firstPayment->defense_status,
                    'or_number' => $defenseRequest->reference_no ?? '-',
                    'payment_date' => $firstPayment->payment_date,
                    'total_amount' => $payments->sum('amount'),
                    'panelists' => $payments->map(function ($payment) {
                        return [
                            'id' => $payment->panelistRecord->id ?? null,
                            'role' => $payment->panelistRecord->role ?? 'Panel',
                            'pfirst_name' => $payment->panelistRecord->pfirst_name ?? 'Unknown',
                            'plast_name' => $payment->panelistRecord->plast_name ?? '',
                            'amount' => $payment->amount,
                        ];
                    })->values()->all(),
                ];
            })->values();

            $student->payments = $defenseGroups;
            return $student;
        });

        return Inertia::render('student-records/Index', [
            'records' => $records,
            'filters' => $request->only(['search'])
        ]);
    }

    public function show($id)
    {
        $studentRecord = StudentRecord::with(['payments.panelistRecord'])
            ->findOrFail($id);

        // Find defense requests
        $defenseRequests = DefenseRequest::where('school_id', $studentRecord->student_id)
            ->where('workflow_state', 'completed')
            ->get()
            ->keyBy('id');

        // Group by defense (same payment_date = same defense)
        $defenseGroups = $studentRecord->payments->groupBy('payment_date')->map(function ($payments) use ($defenseRequests) {
            $firstPayment = $payments->first();
            
            $defenseRequest = $defenseRequests->first(function ($dr) use ($firstPayment) {
                return $dr->scheduled_date && 
                       date('Y-m-d', strtotime($dr->scheduled_date)) === date('Y-m-d', strtotime($firstPayment->payment_date));
            });

            return [
                'id' => $firstPayment->id,
                'defense_date' => $defenseRequest->scheduled_date ?? $firstPayment->payment_date,
                'defense_type' => $defenseRequest->defense_type ?? 'Proposal',
                'defense_status' => $firstPayment->defense_status,
                'or_number' => $defenseRequest->reference_no ?? '-',
                'payment_date' => $firstPayment->payment_date,
                'total_amount' => $payments->sum('amount'),
                'panelists' => $payments->map(function ($payment) {
                    return [
                        'role' => $payment->panelistRecord->role ?? 'Panel',
                        'pfirst_name' => $payment->panelistRecord->pfirst_name ?? 'Unknown',
                        'plast_name' => $payment->panelistRecord->plast_name ?? '',
                        'amount' => $payment->amount,
                    ];
                })->values()->all(),
            ];
        })->values();

        return response()->json([
            'student' => $studentRecord,
            'payments' => $defenseGroups,
        ]);
    }
}