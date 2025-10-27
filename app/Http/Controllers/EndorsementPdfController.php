<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use App\Models\UserSignature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf; // Add this at the top

class EndorsementPdfController extends Controller
{
    /**
     * Generate hardcoded endorsement form PDF
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'defense_request_id' => 'required|exists:defense_requests,id',
            'role' => 'required|in:adviser,coordinator'
        ]);

        $defenseRequestId = $validated['defense_request_id'];
        $role = $validated['role'];

        try {
            $defenseRequest = DefenseRequest::with(['student', 'adviserUser', 'coordinator'])
                ->findOrFail($defenseRequestId);

            $pdf = $this->generateEndorsementPdf($defenseRequest, $role);

            return response($pdf, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="endorsement-form.pdf"',
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating endorsement PDF: ' . $e->getMessage(), [
                'defense_request_id' => $defenseRequestId,
                'role' => $role,
                'exception' => $e
            ]);

            return response()->json([
                'error' => 'Failed to generate endorsement form',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate the endorsement PDF based on defense type
     */
    private function generateEndorsementPdf(DefenseRequest $defenseRequest, string $role): string
    {
        $defenseType = strtolower($defenseRequest->defense_type ?? '');

        if (str_contains($defenseType, 'proposal')) {
            return $this->generateProposalEndorsementPdf($defenseRequest, $role);
        } elseif (str_contains($defenseType, 'pre') || str_contains($defenseType, 'prefinal')) {
            return $this->generatePrefinalEndorsementPdf($defenseRequest, $role);
        } elseif (str_contains($defenseType, 'final')) {
            return $this->generateFinalEndorsementPdf($defenseRequest, $role);
        }

        // Default to proposal if type is unclear
        return $this->generateProposalEndorsementPdf($defenseRequest, $role);
    }

    /**
     * Generate PROPOSAL Defense Endorsement Form
     */
    private function generateProposalEndorsementPdf(DefenseRequest $defenseRequest, string $role): string
    {
        $student_name = $defenseRequest->student->first_name . ' ' . $defenseRequest->student->last_name;
        $defense_date = $defenseRequest->defense_date ? date('F d, Y', strtotime($defenseRequest->defense_date)) : '___________________';
        $program = $defenseRequest->student->program ?? 'N/A';
        $thesis_title = $defenseRequest->manuscript_title ?? '';

        $pdf = Pdf::loadView('pdfs.proposal_endorsement', compact(
            'student_name', 'defense_date', 'program', 'thesis_title'
        ))->setPaper('letter', 'portrait');

        return $pdf->output();
    }

    /**
     * Generate PRE-FINAL Defense Endorsement Form
     */
    private function generatePrefinalEndorsementPdf(DefenseRequest $defenseRequest, string $role): string
    {
        $pdf = new Fpdi('P', 'mm', 'Letter');
        $pdf->AddPage();

        // Logo
        $logoPath = public_path('uic-logo.png');
        if (file_exists($logoPath)) {
            $pdf->Image($logoPath, 15, 15, 25);
        }

        // Header
        $pdf->SetFont('Arial', 'B', 11);
        $pdf->SetXY(45, 15);
        $pdf->Cell(0, 5, 'UNIVERSITY OF THE IMMACULATE CONCEPTION', 0, 1);
        $pdf->SetFont('Arial', '', 10);
        $pdf->SetX(45);
        $pdf->Cell(0, 5, 'Graduate School', 0, 1);
        $pdf->SetX(45);
        $pdf->Cell(0, 5, 'Bonifacio St., Davao City', 0, 1);

        // Title
        $pdf->Ln(15);
        $pdf->SetFont('Arial', 'B', 14);
        $pdf->Cell(0, 8, 'ENDORSEMENT FORM', 0, 1, 'C');
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(0, 6, 'PRE-FINAL DEFENSE', 0, 1, 'C');

        $pdf->Ln(8);

        // Content
        $pdf->SetFont('Arial', '', 11);
        $pdf->Cell(0, 6, 'TO WHOM IT MAY CONCERN:', 0, 1);

        $pdf->Ln(3);

        // Student and program info
        $studentName = $defenseRequest->student->first_name . ' ' . $defenseRequest->student->last_name;
        $programName = $defenseRequest->student->program ?? 'N/A';
        
        $pdf->MultiCell(0, 6, "This is to endorse {$studentName}, a graduate student enrolled in the {$programName} program, for Pre-Final Defense.");
        
        $pdf->Ln(3);

        // Title
        if (!empty($defenseRequest->manuscript_title)) {
            $pdf->SetFont('Arial', 'B', 11);
            $pdf->Cell(0, 6, 'Manuscript Title:', 0, 1);
            $pdf->SetFont('Arial', '', 11);
            $pdf->MultiCell(0, 6, $defenseRequest->manuscript_title);
            $pdf->Ln(3);
        }

        // Date
        $date = $defenseRequest->defense_date ? date('F d, Y', strtotime($defenseRequest->defense_date)) : '___________________';
        $pdf->MultiCell(0, 6, "The pre-final defense is scheduled on {$date}.");

        $pdf->Ln(3);

        // Additional text for pre-final
        $pdf->SetFont('Arial', '', 11);
        $pdf->MultiCell(0, 6, "The student has satisfactorily completed the proposal defense and has made the necessary revisions as recommended by the panel.");

        $pdf->Ln(8);

        // Adviser signature section
        $pdf->SetFont('Arial', '', 11);
        $pdf->Cell(0, 6, 'Respectfully endorsed by:', 0, 1);

        $pdf->Ln(3);

        // Add adviser signature if role is adviser
        if ($role === 'adviser') {
            $adviserSignature = $this->getActiveSignature($defenseRequest->adviser_id);
            if ($adviserSignature) {
                $signaturePath = storage_path('app/public/' . $adviserSignature->image_path);
                if (file_exists($signaturePath)) {
                    $pdf->Image($signaturePath, 15, $pdf->GetY(), 50, 15);
                }
            }
        }

        $pdf->Ln(18);
        
        // Adviser name line
        $adviserName = $defenseRequest->adviserUser 
            ? ($defenseRequest->adviserUser->first_name . ' ' . $defenseRequest->adviserUser->last_name)
            : '___________________';
        $pdf->Cell(80, 0, '', 'B', 0);
        $pdf->Ln(1);
        $pdf->SetFont('Arial', 'B', 11);
        $pdf->Cell(80, 6, $adviserName, 0, 1);
        $pdf->SetFont('Arial', '', 10);
        $pdf->Cell(80, 5, 'Thesis/Dissertation Adviser', 0, 1);

        $pdf->Ln(10);

        // Coordinator section
        $pdf->SetFont('Arial', '', 11);
        $pdf->Cell(0, 6, 'Approved by:', 0, 1);

        $pdf->Ln(3);

        // Add coordinator signature if role is coordinator
        if ($role === 'coordinator' && $defenseRequest->coordinator_user_id) {
            $coordinatorSignature = $this->getActiveSignature($defenseRequest->coordinator_user_id);
            if ($coordinatorSignature) {
                $signaturePath = storage_path('app/public/' . $coordinatorSignature->image_path);
                if (file_exists($signaturePath)) {
                    $pdf->Image($signaturePath, 15, $pdf->GetY(), 50, 15);
                }
            }
        }

        $pdf->Ln(18);

        // Coordinator name line
        $coordinatorName = $defenseRequest->coordinator_user_id 
            ? ($defenseRequest->coordinator->first_name . ' ' . $defenseRequest->coordinator->last_name ?? '___________________')
            : '___________________';
        $pdf->Cell(80, 0, '', 'B', 0);
        $pdf->Ln(1);
        $pdf->SetFont('Arial', 'B', 11);
        $pdf->Cell(80, 6, $coordinatorName, 0, 1);
        $pdf->SetFont('Arial', '', 10);
        $pdf->Cell(80, 5, 'Program Coordinator', 0, 1);

        return $pdf->Output('S');
    }

    /**
     * Generate FINAL Defense Endorsement Form
     */
    private function generateFinalEndorsementPdf(DefenseRequest $defenseRequest, string $role): string
    {
        $pdf = new Fpdi('P', 'mm', 'Letter');
        $pdf->AddPage();

        // Logo
        $logoPath = public_path('uic-logo.png');
        if (file_exists($logoPath)) {
            $pdf->Image($logoPath, 15, 15, 25);
        }

        // Header
        $pdf->SetFont('Arial', 'B', 11);
        $pdf->SetXY(45, 15);
        $pdf->Cell(0, 5, 'UNIVERSITY OF THE IMMACULATE CONCEPTION', 0, 1);
        $pdf->SetFont('Arial', '', 10);
        $pdf->SetX(45);
        $pdf->Cell(0, 5, 'Graduate School', 0, 1);
        $pdf->SetX(45);
        $pdf->Cell(0, 5, 'Bonifacio St., Davao City', 0, 1);

        // Title
        $pdf->Ln(15);
        $pdf->SetFont('Arial', 'B', 14);
        $pdf->Cell(0, 8, 'ENDORSEMENT FORM', 0, 1, 'C');
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(0, 6, 'FINAL DEFENSE', 0, 1, 'C');

        $pdf->Ln(8);

        // Content
        $pdf->SetFont('Arial', '', 11);
        $pdf->Cell(0, 6, 'TO WHOM IT MAY CONCERN:', 0, 1);

        $pdf->Ln(3);

        // Student and program info
        $studentName = $defenseRequest->student->first_name . ' ' . $defenseRequest->student->last_name;
        $programName = $defenseRequest->student->program ?? 'N/A';
        
        $pdf->MultiCell(0, 6, "This is to endorse {$studentName}, a graduate student enrolled in the {$programName} program, for Final Defense.");
        
        $pdf->Ln(3);

        // Title
        if (!empty($defenseRequest->manuscript_title)) {
            $pdf->SetFont('Arial', 'B', 11);
            $pdf->Cell(0, 6, 'Manuscript Title:', 0, 1);
            $pdf->SetFont('Arial', '', 11);
            $pdf->MultiCell(0, 6, $defenseRequest->manuscript_title);
            $pdf->Ln(3);
        }

        // Date
        $date = $defenseRequest->defense_date ? date('F d, Y', strtotime($defenseRequest->defense_date)) : '___________________';
        $pdf->MultiCell(0, 6, "The final defense is scheduled on {$date}.");

        $pdf->Ln(3);

        // Additional text for final
        $pdf->SetFont('Arial', '', 11);
        $pdf->MultiCell(0, 6, "The student has satisfactorily completed all prior defense stages and has incorporated all necessary revisions and recommendations. The manuscript is now ready for final evaluation.");

        $pdf->Ln(8);

        // Adviser signature section
        $pdf->SetFont('Arial', '', 11);
        $pdf->Cell(0, 6, 'Respectfully endorsed by:', 0, 1);

        $pdf->Ln(3);

        // Add adviser signature if role is adviser
        if ($role === 'adviser') {
            $adviserSignature = $this->getActiveSignature($defenseRequest->adviser_id);
            if ($adviserSignature) {
                $signaturePath = storage_path('app/public/' . $adviserSignature->image_path);
                if (file_exists($signaturePath)) {
                    $pdf->Image($signaturePath, 15, $pdf->GetY(), 50, 15);
                }
            }
        }

        $pdf->Ln(18);
        
        // Adviser name line
        $adviserName = $defenseRequest->adviserUser 
            ? ($defenseRequest->adviserUser->first_name . ' ' . $defenseRequest->adviserUser->last_name)
            : '___________________';
        $pdf->Cell(80, 0, '', 'B', 0);
        $pdf->Ln(1);
        $pdf->SetFont('Arial', 'B', 11);
        $pdf->Cell(80, 6, $adviserName, 0, 1);
        $pdf->SetFont('Arial', '', 10);
        $pdf->Cell(80, 5, 'Thesis/Dissertation Adviser', 0, 1);

        $pdf->Ln(10);

        // Coordinator section
        $pdf->SetFont('Arial', '', 11);
        $pdf->Cell(0, 6, 'Approved by:', 0, 1);

        $pdf->Ln(3);

        // Add coordinator signature if role is coordinator
        if ($role === 'coordinator' && $defenseRequest->coordinator_user_id) {
            $coordinatorSignature = $this->getActiveSignature($defenseRequest->coordinator_user_id);
            if ($coordinatorSignature) {
                $signaturePath = storage_path('app/public/' . $coordinatorSignature->image_path);
                if (file_exists($signaturePath)) {
                    $pdf->Image($signaturePath, 15, $pdf->GetY(), 50, 15);
                }
            }
        }

        $pdf->Ln(18);

        // Coordinator name line
        $coordinatorName = $defenseRequest->coordinator_user_id 
            ? ($defenseRequest->coordinator->first_name . ' ' . $defenseRequest->coordinator->last_name ?? '___________________')
            : '___________________';
        $pdf->Cell(80, 0, '', 'B', 0);
        $pdf->Ln(1);
        $pdf->SetFont('Arial', 'B', 11);
        $pdf->Cell(80, 6, $coordinatorName, 0, 1);
        $pdf->SetFont('Arial', '', 10);
        $pdf->Cell(80, 5, 'Program Coordinator', 0, 1);

        return $pdf->Output('S');
    }

    /**
     * Get active signature for a user
     */
    private function getActiveSignature($userId)
    {
        if (!$userId) {
            return null;
        }

        return UserSignature::where('user_id', $userId)
            ->where('active', true)
            ->first();
    }
}
