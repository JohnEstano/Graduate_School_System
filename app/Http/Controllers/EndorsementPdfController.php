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
            // Clear any model cache and fetch fresh from database
            $defenseRequest = DefenseRequest::with(['student', 'adviserUser', 'coordinator'])
                ->findOrFail($defenseRequestId);
            
            // Force refresh from database to ensure we have latest data
            $defenseRequest->refresh();
            
            // Log the actual data we're working with
            Log::info('Generating PDF for defense request', [
                'id' => $defenseRequest->id,
                'scheduled_date' => $defenseRequest->scheduled_date,
                'scheduled_time' => $defenseRequest->scheduled_time,
                'defense_chairperson' => $defenseRequest->defense_chairperson,
                'defense_panelist1' => $defenseRequest->defense_panelist1,
                'defense_panelist2' => $defenseRequest->defense_panelist2,
                'defense_panelist3' => $defenseRequest->defense_panelist3,
                'defense_panelist4' => $defenseRequest->defense_panelist4,
            ]);

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
        
        $pdf = Pdf::loadView('pdfs.prefinal_endorsement', $data)
            ->setPaper('letter', 'portrait');

        return $pdf->output();
    }

    /**
     * Generate FINAL Defense Endorsement Form
     */
    private function generateFinalEndorsementPdf(DefenseRequest $defenseRequest, string $role): string
    {
        $data = $this->prepareEndorsementData($defenseRequest, $role);
        
        $pdf = Pdf::loadView('pdfs.final_endorsement', $data)
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
                // Normalize path - strip any prefixes to avoid double paths
                $imagePath = $adviserSignature->image_path;
                $imagePath = str_replace('app/public/', '', $imagePath);
                $imagePath = str_replace('storage/', '', $imagePath);
                $imagePath = str_replace('public/', '', $imagePath);
                $imagePath = ltrim($imagePath, '/');
                
                $fullPath = storage_path('app/public/' . $imagePath);
                
                if (file_exists($fullPath)) {
                    $adviser_signature_path = $fullPath;
                } else {
                    Log::warning('Adviser signature file not found', [
                        'original_path' => $adviserSignature->image_path,
                        'normalized_path' => $imagePath,
                        'full_path' => $fullPath,
                        'user_id' => $adviser_id
                    ]);
                }
            }
        }

        // Coordinator information - get from authenticated user when role is coordinator
        $coordinator_name = null;
        $coordinator_title = null;
        $coordinator_signature_path = null;
        $approver_name = null; // Initialize approver_name
        
        if ($role === 'coordinator') {
            // Get coordinator from authenticated user
            $coordinator = auth()->user();
            if ($coordinator) {
                $coordinator_name = trim(($coordinator->first_name ?? '') . ' ' . ($coordinator->middle_name ?? '') . ' ' . ($coordinator->last_name ?? ''));
                $coordinator_title = 'Program Coordinator, Graduate School';
                $approver_name = $coordinator_name; // Use coordinator's name in "Dear" section
                
                $coordinatorSignature = $this->getActiveSignature($coordinator->id);
                if ($coordinatorSignature && $coordinatorSignature->image_path) {
                    // Normalize path - strip any prefixes to avoid double paths
                    $imagePath = $coordinatorSignature->image_path;
                    $imagePath = str_replace('app/public/', '', $imagePath);
                    $imagePath = str_replace('storage/', '', $imagePath);
                    $imagePath = str_replace('public/', '', $imagePath);
                    $imagePath = ltrim($imagePath, '/');
                    
                    $fullPath = storage_path('app/public/' . $imagePath);
                    
                    if (file_exists($fullPath)) {
                        $coordinator_signature_path = $fullPath;
                    } else {
                        Log::warning('Coordinator signature file not found', [
                            'original_path' => $coordinatorSignature->image_path,
                            'normalized_path' => $imagePath,
                            'full_path' => $fullPath,
                            'user_id' => $coordinator->id
                        ]);
                    }
                }
            }
        }

        // If coordinator info not available, use stored coordinator from defense request
        if (!$approver_name && $defenseRequest->coordinator) {
            $approver_name = trim(($defenseRequest->coordinator->first_name ?? '') . ' ' . 
                                 ($defenseRequest->coordinator->middle_name ?? '') . ' ' . 
                                 ($defenseRequest->coordinator->last_name ?? ''));
        }
        
        // Final fallback
        if (!$approver_name) {
            $approver_name = 'Program Coordinator';
        }
        
        $approver_title = 'Program Coordinator, Graduate School';

        // Defense schedule and panel information
        $defense_time = $defenseRequest->scheduled_time 
            ? \Carbon\Carbon::parse($defenseRequest->scheduled_time)->format('g:i A')
            : null;
        
        $scheduled_date = $defenseRequest->scheduled_date 
            ? \Carbon\Carbon::parse($defenseRequest->scheduled_date)->format('F d, Y')
            : null;
        
        $panel_chair = $defenseRequest->defense_chairperson ?? null;
        $panel_member_1 = $defenseRequest->defense_panelist1 ?? null;
        $panel_member_2 = $defenseRequest->defense_panelist2 ?? null;
        $panel_member_3 = $defenseRequest->defense_panelist3 ?? null;
        $panel_member_4 = $defenseRequest->defense_panelist4 ?? null;

        // Log schedule and panel data for debugging
        Log::info('Endorsement PDF data prepared', [
            'defense_request_id' => $defenseRequest->id,
            'role' => $role,
            'scheduled_date' => $scheduled_date,
            'defense_time' => $defense_time,
            'panel_chair' => $panel_chair,
            'panel_members' => [
                'member_1' => $panel_member_1,
                'member_2' => $panel_member_2,
                'member_3' => $panel_member_3,
                'member_4' => $panel_member_4,
            ]
        ]);

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
            'approver_title',
            'defense_time',
            'scheduled_date',
            'panel_chair',
            'panel_member_1',
            'panel_member_2',
            'panel_member_3',
            'panel_member_4'
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
