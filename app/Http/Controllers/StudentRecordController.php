<?php

namespace App\Http\Controllers;

use App\Models\StudentRecord;
use App\Models\ProgramRecord;
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
    // Display all programs (first page)
    public function index(Request $request)
    {
        $records = ProgramRecord::orderBy('date_edited', 'desc')->get();

        return Inertia::render('student-records/Index', [
            'records' => $records
        ]);
    }

    // API endpoint to get students by program (used by frontend)
    public function getByProgram($programId)
    {
        $program = ProgramRecord::findOrFail($programId);
        
        $students = StudentRecord::where('program_record_id', $programId)
            ->with(['payments.panelist'])
            ->orderBy('last_name', 'asc')
            ->get();

        return response()->json([
            'program' => $program,
            'students' => $students
        ]);
    }

    // Display students under a specific program (second page)
    public function showProgramStudents(Request $request, $programId)
    {
        $program = ProgramRecord::findOrFail($programId);
        
        $students = StudentRecord::where('program_record_id', $programId)
            ->with(['payments.panelist']) // Eager load payments with panelist info
            ->when($request->input('search'), function ($query, $search) {
                $query->where('first_name', 'like', "%{$search}%")
                      ->orWhere('middle_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_id', 'like', "%{$search}%");
            })
            ->orderBy('last_name', 'asc')
            ->paginate(15)
            ->withQueryString();

        // Transform payments to include panelist breakdown
        $students->getCollection()->transform(function ($student) {
            // Group payments by defense details to consolidate
            $groupedPayments = [];
            
            // Store original payments to iterate
            $originalPayments = $student->payments;
            
            foreach ($originalPayments as $payment) {
                // Create a unique key for this defense (date + type)
                $defenseDate = $student->defense_date ? date('Y-m-d', strtotime($student->defense_date)) : null;
                $key = $defenseDate . '_' . $student->defense_type;
                
                if (!isset($groupedPayments[$key])) {
                    $groupedPayments[$key] = [
                        'id' => $payment->id,
                        'defense_date' => $defenseDate,
                        'defense_type' => $student->defense_type,
                        'defense_status' => $payment->defense_status,
                        'or_number' => $student->or_number,
                        'payment_date' => $payment->payment_date ? date('Y-m-d', strtotime($payment->payment_date)) : null,
                        'amount' => 0,
                        'panelists' => []
                    ];
                }
                
                // Add to total amount
                $groupedPayments[$key]['amount'] += floatval($payment->amount);
                
                // Add panelist info with role from payment record (more accurate than panelist record role)
                if ($payment->panelist) {
                    $groupedPayments[$key]['panelists'][] = [
                        'name' => trim("{$payment->panelist->pfirst_name} {$payment->panelist->pmiddle_name} {$payment->panelist->plast_name}"),
                        'role' => $payment->role ?? $payment->panelist->role, // Use payment.role first, fallback to panelist.role
                        'amount' => $payment->amount
                    ];
                }
            }
            
            // Determine program level (Masteral or Doctorate)
            $isDoctorate = str_starts_with($student->program, 'DBM') || 
                           str_starts_with($student->program, 'PHDED') ||
                           stripos($student->program, 'Doctor') !== false || 
                           stripos($student->program, 'Doctorate') !== false ||
                           stripos($student->program, 'PhD') !== false;
            $programLevel = $isDoctorate ? 'Doctorate' : 'Masteral';
            
            // Add REC FEE, SCHOOL SHARE, and calculate TOTAL for each payment
            foreach ($groupedPayments as &$payment) {
                $panelistTotal = floatval($payment['amount']);
                
                // Get REC FEE and SCHOOL SHARE from payment_rates table
                $recFeeRate = PaymentRate::where('program_level', $programLevel)
                    ->where('defense_type', $payment['defense_type'])
                    ->where('type', 'REC Fee')
                    ->first();
                
                $schoolShareRate = PaymentRate::where('program_level', $programLevel)
                    ->where('defense_type', $payment['defense_type'])
                    ->where('type', 'School Share')
                    ->first();
                
                $recFee = $recFeeRate ? floatval($recFeeRate->amount) : 0;
                $schoolShare = $schoolShareRate ? floatval($schoolShareRate->amount) : 0;
                
                // Always add REC FEE to panelists array (show even if 0)
                $payment['panelists'][] = [
                    'name' => '-',
                    'role' => 'REC FEE',
                    'amount' => $recFee > 0 ? number_format($recFee, 2, '.', '') : '-'
                ];
                
                // Always add SCHOOL SHARE to panelists array (show even if 0)
                $payment['panelists'][] = [
                    'name' => '-',
                    'role' => 'SCHOOL SHARE',
                    'amount' => $schoolShare > 0 ? number_format($schoolShare, 2, '.', '') : '-'
                ];
                
                // Calculate grand total
                $grandTotal = $panelistTotal + $recFee + $schoolShare;
                
                // Update the amount to show grand total (what student actually pays)
                $payment['amount'] = $grandTotal;
                
                // Store breakdown totals
                $payment['panelist_total'] = $panelistTotal;
                $payment['rec_fee'] = $recFee;
                $payment['school_share'] = $schoolShare;
                $payment['grand_total'] = $grandTotal;
            }
            
            // Format student dates
            $student->defense_date = $student->defense_date ? date('Y-m-d', strtotime($student->defense_date)) : null;
            $student->payment_date = $student->payment_date ? date('Y-m-d', strtotime($student->payment_date)) : null;
            
            // Convert to array to avoid Laravel collection serialization issues
            $studentArray = $student->toArray();
            $studentArray['payments'] = array_values($groupedPayments);
            
            return $studentArray;
        });

        return Inertia::render('student-records/program-students', [
            'program' => $program,
            'students' => $students,
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

        // 3. Panel Members (Each panel member has their own numbered rate)
        if ($defense->defense_panelist1) {
            $memberRate1 = $rates->get('Panel Member 1') ?? $rates->get('Panel Member'); // fallback
            $nameParts = $this->splitName($defense->defense_panelist1);
            $panelists[] = [
                'id' => null,
                'role' => 'Panel Member 1',
                'pfirst_name' => $nameParts['first'],
                'plast_name' => $nameParts['last'],
                'amount' => $memberRate1 ? $memberRate1->amount : 0,
            ];
        }
        
        if ($defense->defense_panelist2) {
            $memberRate2 = $rates->get('Panel Member 2') ?? $rates->get('Panel Member 1') ?? $rates->get('Panel Member'); // fallback
            $nameParts = $this->splitName($defense->defense_panelist2);
            $panelists[] = [
                'id' => null,
                'role' => 'Panel Member 2',
                'pfirst_name' => $nameParts['first'],
                'plast_name' => $nameParts['last'],
                'amount' => $memberRate2 ? $memberRate2->amount : 0,
            ];
        }
        
        if ($defense->defense_panelist3) {
            $memberRate3 = $rates->get('Panel Member 3') ?? $rates->get('Panel Member 1') ?? $rates->get('Panel Member'); // fallback
            $nameParts = $this->splitName($defense->defense_panelist3);
            $panelists[] = [
                'id' => null,
                'role' => 'Panel Member 3',
                'pfirst_name' => $nameParts['first'],
                'plast_name' => $nameParts['last'],
                'amount' => $memberRate3 ? $memberRate3->amount : 0,
            ];
        }
        
        if ($defense->defense_panelist4) {
            $memberRate4 = $rates->get('Panel Member 4') ?? $rates->get('Panel Member 1') ?? $rates->get('Panel Member'); // fallback
            $nameParts = $this->splitName($defense->defense_panelist4);
            $panelists[] = [
                'id' => null,
                'role' => 'Panel Member 4',
                'pfirst_name' => $nameParts['first'],
                'plast_name' => $nameParts['last'],
                'amount' => $memberRate4 ? $memberRate4->amount : 0,
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

    public function downloadPdf(Request $request, $id)
    {
        $student = StudentRecord::with(['payments.panelist', 'program'])->findOrFail($id);
        $paymentId = $request->query('payment_id');
        
        Log::info('Generating PDF for student', [
            'student_id' => $id,
            'payment_id' => $paymentId,
            'student_record_student_id' => $student->student_id,
        ]);
        
        // Try to get defense request for this student
        $defenseRequest = DefenseRequest::where('school_id', $student->student_id)
            ->where('workflow_state', 'completed')
            ->orderBy('scheduled_date', 'desc')
            ->first();
        
        Log::info('Found defense request', [
            'defense_request_id' => $defenseRequest?->id,
            'adviser' => $defenseRequest?->defense_adviser,
            'chairperson' => $defenseRequest?->defense_chairperson,
            'panelist1' => $defenseRequest?->defense_panelist1,
            'panelist2' => $defenseRequest?->defense_panelist2,
            'panelist3' => $defenseRequest?->defense_panelist3,
            'panelist4' => $defenseRequest?->defense_panelist4,
        ]);
        
        // If we have a defense request, build panel members from it
        $panelists = [];
        if ($defenseRequest) {
            $programLevel = ProgramLevel::getLevel($defenseRequest->program);
            
            // Get payment rates
            $rates = PaymentRate::where('program_level', $programLevel)
                ->where('defense_type', $defenseRequest->defense_type)
                ->get()
                ->keyBy('type');
            
            // Adviser
            if ($defenseRequest->defense_adviser) {
                $adviserRate = $rates->get('Adviser');
                $nameParts = $this->splitName($defenseRequest->defense_adviser);
                $panelists[] = [
                    'name' => $defenseRequest->defense_adviser,
                    'role' => 'Adviser',
                    'amount' => $adviserRate ? $adviserRate->amount : 0,
                ];
            }
            
            // Panel Chair
            if ($defenseRequest->defense_chairperson) {
                $chairRate = $rates->get('Panel Chair');
                $panelists[] = [
                    'name' => $defenseRequest->defense_chairperson,
                    'role' => 'Panel Chair',
                    'amount' => $chairRate ? $chairRate->amount : 0,
                ];
            }
            
            // Panel Members (all use same rate)
            $memberRate = $rates->get('Panel Chair'); // Panel members use Panel Chair rate
            
            if ($defenseRequest->defense_panelist1) {
                $panelists[] = [
                    'name' => $defenseRequest->defense_panelist1,
                    'role' => 'Panel Member',
                    'amount' => $memberRate ? $memberRate->amount : 0,
                ];
            }
            
            if ($defenseRequest->defense_panelist2) {
                $panelists[] = [
                    'name' => $defenseRequest->defense_panelist2,
                    'role' => 'Panel Member',
                    'amount' => $memberRate ? $memberRate->amount : 0,
                ];
            }
            
            if ($defenseRequest->defense_panelist3) {
                $panelists[] = [
                    'name' => $defenseRequest->defense_panelist3,
                    'role' => 'Panel Member',
                    'amount' => $memberRate ? $memberRate->amount : 0,
                ];
            }
            
            if ($defenseRequest->defense_panelist4) {
                $panelists[] = [
                    'name' => $defenseRequest->defense_panelist4,
                    'role' => 'Panel Member',
                    'amount' => $memberRate ? $memberRate->amount : 0,
                ];
            }
            
            Log::info('Built panelists from defense request', [
                'panelists_count' => count($panelists),
                'panelists' => $panelists,
            ]);
        }
        
        // Fallback: Get payments from student record if no defense request
        if (empty($panelists)) {
            $payments = $student->payments;
            
            foreach ($payments as $payment) {
                if ($payment->panelist) {
                    $panelists[] = [
                        'name' => trim("{$payment->panelist->pfirst_name} {$payment->panelist->pmiddle_name} {$payment->panelist->plast_name}"),
                        'role' => $payment->panelist->role,
                        'amount' => $payment->amount
                    ];
                }
            }
            
            Log::info('Built panelists from payment records', [
                'panelists_count' => count($panelists),
            ]);
        }
        
        // Determine program level
        $isDoctorate = str_starts_with($student->program, 'DBM') || 
                       str_starts_with($student->program, 'PHDED') ||
                       stripos($student->program, 'Doctor') !== false || 
                       stripos($student->program, 'Doctorate') !== false ||
                       stripos($student->program, 'PhD') !== false;
        $programLevel = $isDoctorate ? 'Doctorate' : 'Masteral';
        
        // Calculate panelist total
        $panelistTotal = collect($panelists)->sum('amount');
        
        // Get REC FEE and SCHOOL SHARE
        $defenseType = $defenseRequest ? $defenseRequest->defense_type : $student->defense_type;
        
        $recFeeRate = PaymentRate::where('program_level', $programLevel)
            ->where('defense_type', $defenseType)
            ->where('type', 'REC Fee')
            ->first();
        
        $schoolShareRate = PaymentRate::where('program_level', $programLevel)
            ->where('defense_type', $defenseType)
            ->where('type', 'School Share')
            ->first();
        
        $recFee = $recFeeRate ? floatval($recFeeRate->amount) : 0;
        $schoolShare = $schoolShareRate ? floatval($schoolShareRate->amount) : 0;
        $grandTotal = $panelistTotal + $recFee + $schoolShare;
        
        // Get program name from relationship
        $programName = $student->program()->first()->name ?? $student->program;
        
        // Prepare data for the blade template
        $data = [
            'student_name' => strtoupper("{$student->first_name} {$student->middle_name} {$student->last_name}"),
            'program' => $student->program,
            'program_name' => $programName,
            'defense_type' => $defenseType ?? '',
            'defense_mode' => $defenseRequest?->defense_mode ?? $student->defense_mode ?? 'Onsite',
            'defense_date' => $defenseRequest?->scheduled_date?->format('Y-m-d') ?? $student->defense_date ?? '',
            'or_number' => $defenseRequest?->reference_no ?? $student->or_number ?? '',
            'panelists' => $panelists,
            'rec_fee' => $recFee,
            'school_share' => $schoolShare,
            'grand_total' => $grandTotal,
            'today_date' => now()->format('F d, Y'),
        ];
        
        Log::info('PDF data prepared', [
            'panelists_count' => count($data['panelists']),
            'grand_total' => $data['grand_total'],
        ]);
        
        // Render the blade view to HTML
        $html = view('pdfs.payment-summary', $data)->render();
        
        // Use dompdf to generate PDF
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'portrait');
        
        return $pdf->download("payment_receipt_{$student->student_id}.pdf");
    }
}