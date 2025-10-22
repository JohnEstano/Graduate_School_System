<?php

namespace App\Http\Controllers;

use App\Models\StudentRecord;
use App\Models\DefenseRequest;
use App\Models\PaymentRecord;
use App\Models\HonorariumPayment;
use App\Models\PaymentRate;
use App\Helpers\ProgramLevel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StudentRecordController extends Controller
{
    public function index(Request $request)
    {
        $records = StudentRecord::query()
            ->when($request->input('search'), function ($query, $search) {
                $query->where('first_name', 'like', "%{$search}%")
                      ->orWhere('middle_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_id', 'like', "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        // Transform to group by actual defense requests
        $records->getCollection()->transform(function ($student) {
            // Get all completed defense requests for this student
            $defenseRequests = DefenseRequest::where('school_id', $student->student_id)
                ->where('workflow_state', 'completed')
                ->orderBy('scheduled_date', 'desc')
                ->get();

            // Map each defense to its payment breakdown
            $student->payments = $defenseRequests->map(function ($defense) use ($student) {
                return $this->buildDefensePaymentData($defense, $student);
            })->values();

            return $student;
        });

        return Inertia::render('student-records/Index', [
            'records' => $records,
            'filters' => $request->only(['search'])
        ]);
    }

    public function show($id)
    {
        $studentRecord = StudentRecord::findOrFail($id);

        // Get all completed defense requests for this student
        $defenseRequests = DefenseRequest::where('school_id', $studentRecord->student_id)
            ->where('workflow_state', 'completed')
            ->orderBy('scheduled_date', 'desc')
            ->get();

        // Map each defense to its payment breakdown
        $defenseGroups = $defenseRequests->map(function ($defense) use ($studentRecord) {
            return $this->buildDefensePaymentData($defense, $studentRecord);
        })->values();

        return response()->json([
            'student' => $studentRecord,
            'payments' => $defenseGroups,
        ]);
    }

    /**
     * Helper function to split full name into first and last name
     */
    private function splitName($fullName)
    {
        if (!$fullName) {
            return ['first' => 'Unknown', 'last' => ''];
        }

        $parts = explode(' ', trim($fullName));
        
        if (count($parts) === 1) {
            return ['first' => $parts[0], 'last' => ''];
        }
        
        // Last part is last name, everything else is first name
        $lastName = array_pop($parts);
        $firstName = implode(' ', $parts);
        
        return ['first' => $firstName, 'last' => $lastName];
    }

    /**
     * Build complete payment data for a defense request
     */
    private function buildDefensePaymentData(DefenseRequest $defense, StudentRecord $student)
    {
        $programLevel = ProgramLevel::getLevel($defense->program);
        
        // Get all payment rates for this defense
        $rates = PaymentRate::where('program_level', $programLevel)
            ->where('defense_type', $defense->defense_type)
            ->get()
            ->keyBy('type');

        Log::info('Building defense payment data', [
            'defense_id' => $defense->id,
            'program' => $defense->program,
            'program_level' => $programLevel,
            'defense_type' => $defense->defense_type,
            'rates_found' => $rates->count(),
            'adviser' => $defense->defense_adviser,
            'chairperson' => $defense->defense_chairperson,
        ]);

        // Build panelists array with their roles and amounts
        $panelists = [];

        // 1. Adviser
        if ($defense->defense_adviser) {
            $adviserRate = $rates->get('Adviser');
            $nameParts = $this->splitName($defense->defense_adviser);
            
            $panelists[] = [
                'id' => null,
                'role' => 'Adviser',
                'pfirst_name' => $nameParts['first'],
                'plast_name' => $nameParts['last'],
                'amount' => $adviserRate ? $adviserRate->amount : 0,
            ];
        }

        // 2. Panel Chair
        if ($defense->defense_chairperson) {
            $chairRate = $rates->get('Panel Chair');
            $nameParts = $this->splitName($defense->defense_chairperson);
            
            $panelists[] = [
                'id' => null,
                'role' => 'Panel Chair',
                'pfirst_name' => $nameParts['first'],
                'plast_name' => $nameParts['last'],
                'amount' => $chairRate ? $chairRate->amount : 0,
            ];
        }

        // 3. Panel Members
        $memberRate = $rates->get('Panel Member 1') ?? $rates->get('Panel Member'); // fallback
        
        if ($defense->defense_panelist1) {
            $nameParts = $this->splitName($defense->defense_panelist1);
            $panelists[] = [
                'id' => null,
                'role' => 'Panel Member',
                'pfirst_name' => $nameParts['first'],
                'plast_name' => $nameParts['last'],
                'amount' => $memberRate ? $memberRate->amount : 0,
            ];
        }
        
        if ($defense->defense_panelist2) {
            $nameParts = $this->splitName($defense->defense_panelist2);
            $panelists[] = [
                'id' => null,
                'role' => 'Panel Member',
                'pfirst_name' => $nameParts['first'],
                'plast_name' => $nameParts['last'],
                'amount' => $memberRate ? $memberRate->amount : 0,
            ];
        }
        
        if ($defense->defense_panelist3) {
            $nameParts = $this->splitName($defense->defense_panelist3);
            $panelists[] = [
                'id' => null,
                'role' => 'Panel Member',
                'pfirst_name' => $nameParts['first'],
                'plast_name' => $nameParts['last'],
                'amount' => $memberRate ? $memberRate->amount : 0,
            ];
        }
        
        if ($defense->defense_panelist4) {
            $nameParts = $this->splitName($defense->defense_panelist4);
            $panelists[] = [
                'id' => null,
                'role' => 'Panel Member',
                'pfirst_name' => $nameParts['first'],
                'plast_name' => $nameParts['last'],
                'amount' => $memberRate ? $memberRate->amount : 0,
            ];
        }

        // Calculate total amount from panelists
        $totalAmount = collect($panelists)->sum('amount');

        // Use defense request amount if available, otherwise use calculated total
        $finalAmount = $defense->amount ?? $totalAmount;

        Log::info('Defense payment data built', [
            'defense_id' => $defense->id,
            'panelists_count' => count($panelists),
            'calculated_total' => $totalAmount,
            'defense_amount' => $defense->amount,
            'final_amount' => $finalAmount
        ]);

        return [
            'id' => $defense->id,
            'defense_date' => $defense->scheduled_date ? $defense->scheduled_date->format('Y-m-d') : null,
            'defense_type' => $defense->defense_type,
            'defense_status' => 'completed',
            'or_number' => $defense->reference_no ?? '-',
            'payment_date' => $defense->scheduled_date ? $defense->scheduled_date->format('Y-m-d') : null,
            'amount' => $finalAmount,
            'total_amount' => $finalAmount,
            'panelists' => $panelists,
        ];
    }

    public function downloadPdf($id)
    {
        // Existing PDF download logic
        return response()->json(['message' => 'PDF download not yet implemented']);
    }
}