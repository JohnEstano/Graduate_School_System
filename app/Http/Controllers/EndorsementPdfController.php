<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use App\Models\UserSignature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class EndorsementPdfController extends Controller
{
    /**
     * Generate endorsement form PDF with all fields filled and e-signatures
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
        $data = $this->prepareEndorsementData($defenseRequest, $role);
        
        $pdf = Pdf::loadView('pdfs.proposal_endorsement', $data)
            ->setPaper('letter', 'portrait');

        return $pdf->output();
    }

    /**
     * Generate PRE-FINAL Defense Endorsement Form
     */
    private function generatePrefinalEndorsementPdf(DefenseRequest $defenseRequest, string $role): string
    {
        $data = $this->prepareEndorsementData($defenseRequest, $role);
        
        $pdf = Pdf::loadView('pdfs.prefinal_endorsement_form', $data)
            ->setPaper('letter', 'portrait');

        return $pdf->output();
    }

    /**
     * Generate FINAL Defense Endorsement Form
     */
    private function generateFinalEndorsementPdf(DefenseRequest $defenseRequest, string $role): string
    {
        $data = $this->prepareEndorsementData($defenseRequest, $role);
        
        $pdf = Pdf::loadView('pdfs.final_endorsement_form', $data)
            ->setPaper('letter', 'portrait');

        return $pdf->output();
    }

    /**
     * Prepare all data needed for endorsement form - All fields properly filled
     */
    private function prepareEndorsementData(DefenseRequest $defenseRequest, string $role): array
    {
        // Student information - always filled
        $student_name = $defenseRequest->student 
            ? trim(($defenseRequest->student->first_name ?? '') . ' ' . ($defenseRequest->student->middle_name ?? '') . ' ' . ($defenseRequest->student->last_name ?? ''))
            : 'N/A';
        
        // Defense date - always filled
        $defense_date = $defenseRequest->defense_date 
            ? \Carbon\Carbon::parse($defenseRequest->defense_date)->format('F d, Y')
            : now()->format('F d, Y');
        
        // Program - always filled
        $program = $defenseRequest->student->program ?? 'N/A';
        
        // Thesis/Dissertation title - always filled
        $thesis_title = $defenseRequest->thesis_title ?? 'Untitled Manuscript';

        // Adviser information - always filled
        $adviser_name = $defenseRequest->adviserUser 
            ? trim(($defenseRequest->adviserUser->first_name ?? '') . ' ' . ($defenseRequest->adviserUser->middle_name ?? '') . ' ' . ($defenseRequest->adviserUser->last_name ?? ''))
            : 'Thesis / Dissertation Adviser';
        
        // Adviser signature - ALWAYS show if available (not just when adviser is generating)
        $adviser_signature_path = null;
        $adviser_id = $defenseRequest->adviser_id ?? $defenseRequest->adviser_user_id;
        
        if ($adviser_id) {
            $adviserSignature = $this->getActiveSignature($adviser_id);
            if ($adviserSignature && $adviserSignature->image_path) {
                $fullPath = storage_path('app/public/' . $adviserSignature->image_path);
                
                if (file_exists($fullPath)) {
                    $adviser_signature_path = $fullPath;
                } else {
                    Log::warning('Adviser signature file not found', [
                        'path' => $fullPath,
                        'user_id' => $adviser_id
                    ]);
                }
            }
        }

        // Coordinator information - get from authenticated user when role is coordinator
        $coordinator_name = null;
        $coordinator_title = null;
        $coordinator_signature_path = null;
        
        if ($role === 'coordinator') {
            // Get coordinator from authenticated user
            $coordinator = auth()->user();
            if ($coordinator) {
                $coordinator_name = trim(($coordinator->first_name ?? '') . ' ' . ($coordinator->middle_name ?? '') . ' ' . ($coordinator->last_name ?? ''));
                $coordinator_title = 'Program Coordinator';
                
                $coordinatorSignature = $this->getActiveSignature($coordinator->id);
                if ($coordinatorSignature && $coordinatorSignature->image_path) {
                    $fullPath = storage_path('app/public/' . $coordinatorSignature->image_path);
                    
                    if (file_exists($fullPath)) {
                        $coordinator_signature_path = $fullPath;
                    } else {
                        Log::warning('Coordinator signature file not found', [
                            'path' => $fullPath,
                            'user_id' => $coordinator->id
                        ]);
                    }
                }
            }
        }

        // Default approver (Dean) - used in the "Dear" section
        $approver_name = 'Dr. Mary Jane B. Amoguis';
        $approver_title = 'Dean, Graduate School';

        return compact(
            'student_name',
            'defense_date',
            'program',
            'thesis_title',
            'adviser_name',
            'adviser_signature_path',
            'coordinator_name',
            'coordinator_title',
            'coordinator_signature_path',
            'approver_name',
            'approver_title'
        );
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
