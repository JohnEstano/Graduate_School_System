<?php

namespace App\Http\Controllers;

use App\Models\StudentRecord;
use App\Models\PanelistRecord;
use App\Models\PaymentRecord; 
use Illuminate\Http\Request;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

class StudentRecordController extends Controller
{
    // Existing index method
    public function index(Request $request)
    {
        $records = StudentRecord::with('payments') // eager load payments
            ->when($request->input('search'), function ($query, $search) {
                $query->where('first_name', 'like', "%{$search}%")
                      ->orWhere('middle_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_id', 'like', "%{$search}%");
            })
            ->when($request->input('year'), function ($query, $year) {
                $query->where('school_year', $year);
            })
            ->when($request->input('program'), function ($query, $program) {
                $query->where('program', $program);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('student-records/Index', [
            'records' => $records,
            'filters' => $request->only(['search', 'year', 'program'])
        ]);
    }

    // Show individual record page
public function show($id)
{
    // Load the student with all payments and panelists
    $studentRecord = StudentRecord::with([
        'payments' => function($query) {
            $query->with('panelist')->orderBy('payment_date', 'desc');
        }
    ])->findOrFail($id);

    // Transform payments to include a panelists array
    $studentRecord->payments->transform(function ($payment) {
        return [
            'id' => $payment->id,
            'payment_date' => $payment->payment_date,
            'defense_status' => $payment->defense_status,
            'amount' => $payment->amount,
            'panelists' => $payment->panelist ? [
                [
                    'id' => $payment->panelist->id,
                    'role' => $payment->panelist->role,
                    'pfirst_name' => $payment->panelist->pfirst_name,
                    'plast_name' => $payment->panelist->plast_name,
                    'amount' => $payment->amount,
                ]
            ] : [],
            'total_amount' => $payment->amount // Will be the same as individual amount since one panelist per payment
        ];
    });

    // Return JSON response for React/Inertia
    return response()->json($studentRecord);
}




    // Update a record
    public function update(Request $request, StudentRecord $studentRecord)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => 'nullable|string|max:255',
            'program' => 'required|string|max:255',
            'school_year' => 'nullable|string|max:255',
            'student_id' => 'nullable|string|max:255',
            'course_section' => 'nullable|string|max:255',
            'birthdate' => 'nullable|date',
            'academic_status' => 'nullable|string|max:255',
            'or_number' => 'required|string|max:255',
            'payment_date' => 'required|date',
        ]);

        $studentRecord->update($request->all());

        return redirect()->back()->with('success', 'Record updated successfully.');
    }

    // Delete a record
    public function destroy(StudentRecord $studentRecord)
    {
        $studentRecord->delete();

        return redirect()->back()->with('success', 'Record deleted successfully.');
    }

    // 🔹 NEW: API endpoint for React modal to fetch student records by program
    public function getByProgram(string $program)
    {
        $records = StudentRecord::where('program', $program)
            ->orderBy('payment_date', 'desc')
            ->get();

        return response()->json($records);
    }

    // 🔹 NEW: API endpoint to fetch panelist names + roles (for ViewPanelist modal)
    public function getPanelists()
    {
        $panelists = PanelistRecord::select(
                'pfirst_name',
                'pmiddle_name',
                'plast_name',
                'role'
            )
            ->orderBy('role', 'asc')
            ->get()
            ->map(function ($panelist) {
                return [
                    'name' => trim($panelist->pfirst_name . ' ' . ($panelist->pmiddle_name ? $panelist->pmiddle_name . ' ' : '') . $panelist->plast_name),
                    'role' => $panelist->role,
                ];
            });

        return response()->json($panelists);
    }

public function downloadPdf($id)
{
    try {
        $payment = PaymentRecord::with('studentRecord')->findOrFail($id);
        $student = $payment->studentRecord;

        if (!$student) {
            Log::error('Student record not found for payment ID: ' . $id);
            return response()->json(['error' => 'Student record not found'], 404);
        }

        // Convert images to base64
        $uicLogo = $this->getImageAsBase64('logoUIC.png');
        $tuvLogo = $this->getImageAsBase64('managementSystemLogo.jpg');
        $location = $this->getImageAsBase64('location.png');
        $phone    = $this->getImageAsBase64('phone.png');
        $printer   = $this->getImageAsBase64('printer.png');
        $internet = $this->getImageAsBase64('internet.png');
        $email    = $this->getImageAsBase64('email.png');

        $data = [
            'student' => $student,
            'payment' => $payment,
            'uicLogo' => $uicLogo,
            'tuvLogo' => $tuvLogo,
            'locationIcon' => $location,
            'phoneIcon' => $phone, 
            'printerIcon' => $printer,
            'internetIcon' => $internet,
            'emailIcon' => $email,
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.payment-summary', $data);
        $pdf->getDomPDF()->set_option('isRemoteEnabled', true);
        $pdf->getDomPDF()->set_option('isHtml5ParserEnabled', true);

        $fileName = "payment-{$payment->id}.pdf";

        // ✅ Return clean response for fetch()
        return response($pdf->output(), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="'.$fileName.'"');

    } catch (\Exception $e) {
        Log::error('PDF generation failed: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to generate PDF. Please try again.'], 500);
    }
}

protected function getImageAsBase64($path)
{
    $fullPath = public_path($path);
    if (!file_exists($fullPath)) {
        return '';
    }

    $type = pathinfo($fullPath, PATHINFO_EXTENSION);
    $data = file_get_contents($fullPath);
    return 'data:image/' . $type . ';base64,' . base64_encode($data);
}

}    