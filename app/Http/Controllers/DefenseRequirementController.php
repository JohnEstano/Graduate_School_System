<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use App\Models\DefenseRequestCancellation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DefenseRequirementController extends Controller
{
    public function index(Request $request)
    {
        // Get all defense requests for the current user
        $requirements = DefenseRequest::where('submitted_by', Auth::id())->get();
        $defenseRequest = DefenseRequest::where('school_id', Auth::user()->school_id)
            ->latest()
            ->first();

        return inertia('student/submissions/defense-requirements/Index', [
            'defenseRequirements' => $requirements,
            'defenseRequest' => $defenseRequest,
        ]);
    }

    public function all(Request $request)
    {
        $user = Auth::user();
        if (!$user) abort(401);

        $coordinatorRoles = ['Coordinator','Administrative Assistant','Dean'];
        if (in_array($user->role, $coordinatorRoles)) {
            // Coordinator: ONLY post‑adviser
            $requests = DefenseRequest::whereIn('workflow_state', [
                'adviser-approved','coordinator-review','coordinator-approved',
                'coordinator-rejected','panels-assigned','scheduled','completed'
            ])->orderByDesc('created_at')->get();

            return inertia('adviser/defense-requirements/Index', [
                'defenseRequirements' => [],
                'defenseRequests' => $requests,
            ]);
        }

        if (!in_array($user->role, ['Faculty','Adviser'])) {
            return inertia('adviser/defense-requirements/Index', [
                'defenseRequirements' => [],
                'defenseRequests' => [],
            ]);
        }

        $norm = fn(string $v) => preg_replace('/\s+/',' ', trim(strtolower($v)));
        $first = $norm($user->first_name);
        $last  = $norm($user->last_name);

        // Fetch anything tied by IDs OR textual adviser match, limited to early/adviser states
        $requests = DefenseRequest::where(function($q) use ($user,$first,$last) {
                $q->where('adviser_user_id', $user->id)
                  ->orWhere('assigned_to_user_id', $user->id)
                  ->orWhere(function($sub) use ($first,$last) {
                      $sub->whereNull('adviser_user_id')
                          ->whereNull('assigned_to_user_id')
                          ->whereNotNull('defense_adviser')
                          ->whereRaw('LOWER(defense_adviser) LIKE ?', ["%$first%"])
                          ->whereRaw('LOWER(defense_adviser) LIKE ?', ["%$last%"]);
                  });
            })
            ->whereIn('workflow_state', [
                'submitted','adviser-review','adviser-approved','adviser-rejected'
            ])
            ->orderByDesc('created_at')
            ->get();

        // Retro-map ONLY if unassigned & textual match
        foreach ($requests as $r) {
            if (!$r->adviser_user_id && !$r->assigned_to_user_id) {
                $name = $norm($r->defense_adviser ?? '');
                if ($name && str_contains($name,$first) && str_contains($name,$last)) {
                    $r->forceFill([
                        'adviser_user_id' => $user->id,
                        'assigned_to_user_id' => $user->id,
                        // Keep 'submitted' unless already touched
                        'workflow_state' => in_array($r->workflow_state, [null,'']) ? 'submitted' : $r->workflow_state,
                    ])->save();
                }
            }
        }

        // Re-query after possible mapping
        $requests = DefenseRequest::where(function($q) use ($user,$first,$last) {
                $q->where('adviser_user_id', $user->id)
                  ->orWhere('assigned_to_user_id', $user->id)
                  ->orWhere(function($sub) use ($first,$last) {
                      $sub->whereNull('adviser_user_id')
                          ->whereNull('assigned_to_user_id')
                          ->whereNotNull('defense_adviser')
                          ->whereRaw('LOWER(defense_adviser) LIKE ?', ["%$first%"])
                          ->whereRaw('LOWER(defense_adviser) LIKE ?', ["%$last%"]);
                  });
            })
            ->whereIn('workflow_state', [
                'submitted','adviser-review','adviser-approved','adviser-rejected'
            ])
            ->orderByDesc('created_at')
            ->get();

        return inertia('adviser/defense-requirements/Index', [
            'defenseRequirements' => [],
            'defenseRequests' => $requests,
        ]);
    }

    public function store(Request $request)
    {
        // Check for upload errors before validation
        if ($request->hasAny(['rec_endorsement', 'proof_of_payment', 'manuscript_proposal', 'similarity_index'])) {
            foreach (['rec_endorsement', 'proof_of_payment', 'manuscript_proposal', 'similarity_index'] as $fileField) {
                if ($request->hasFile($fileField)) {
                    $file = $request->file($fileField);
                    $uploadError = $file->getError();
                    
                    if ($uploadError !== UPLOAD_ERR_OK) {
                        $errorMessages = [
                            UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the server upload limit.',
                            UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the form upload limit.',
                            UPLOAD_ERR_PARTIAL => 'The file was only partially uploaded. Please try again.',
                            UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
                            UPLOAD_ERR_NO_TMP_DIR => 'Server error: Missing temporary folder.',
                            UPLOAD_ERR_CANT_WRITE => 'Server error: Failed to write file to disk.',
                            UPLOAD_ERR_EXTENSION => 'Server error: File upload stopped by extension.',
                        ];
                        
                        $message = $errorMessages[$uploadError] ?? 'Unknown upload error occurred.';
                        return back()->withErrors([$fileField => $message])->withInput();
                    }
                }
            }
        }

        $maxFileSize = config('upload.max_file_size_kb', 204800); // Default to 200MB if config not found
        $allowedMimes = implode(',', config('upload.allowed_extensions', ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']));

        $data = $request->validate([
            'first_name' => 'required|string',
            'middle_name' => 'nullable|string',
            'last_name' => 'required|string',
            'school_id' => 'required|string',
            'program' => 'required|string',
            'thesis_title' => 'required|string',
            'adviser' => 'required|string',
            'defense_type' => 'required|string', 
            // Professional file validation for academic documents using config values
            'rec_endorsement' => "nullable|file|mimes:{$allowedMimes}|max:{$maxFileSize}",
            'proof_of_payment' => "nullable|file|mimes:{$allowedMimes}|max:{$maxFileSize}",
            'reference_no' => 'nullable|string',
            'manuscript_proposal' => "nullable|file|mimes:pdf,doc,docx|max:{$maxFileSize}", // Manuscripts only accept documents
            'similarity_index' => "nullable|file|mimes:{$allowedMimes}|max:{$maxFileSize}",
        ]);

        // Handle file uploads with professional error handling
        foreach (['rec_endorsement', 'proof_of_payment', 'manuscript_proposal', 'similarity_index'] as $file) {
            if ($request->hasFile($file)) {
                try {
                    $uploadedFile = $request->file($file);
                    
                    // Log file upload attempt for monitoring
                    Log::info("Academic file upload attempt", [
                        'file_field' => $file,
                        'original_name' => $uploadedFile->getClientOriginalName(),
                        'size_mb' => round($uploadedFile->getSize() / 1024 / 1024, 2),
                        'mime_type' => $uploadedFile->getMimeType(),
                        'user_id' => Auth::id(),
                    ]);
                    
                    $data[$file] = $uploadedFile->store('defense_requirements', 'public');
                    
                } catch (\Exception $e) {
                    Log::error("File upload failed", [
                        'file_field' => $file,
                        'error' => $e->getMessage(),
                        'user_id' => Auth::id(),
                    ]);
                    
                    return back()->withErrors([
                        $file => "Failed to upload {$file}. Please ensure the file is under 200MB and try again."
                    ])->withInput();
                }
            }
        }

        // Save to the consolidated defense_requests table
        try {
            $defenseRequestData = [
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'] ?? null,
                'last_name' => $data['last_name'],
                'school_id' => $data['school_id'],
                'program' => $data['program'],
                'thesis_title' => $data['thesis_title'],
                'defense_type' => $data['defense_type'],
                'defense_adviser' => $data['adviser'],
                'rec_endorsement' => $data['rec_endorsement'] ?? null,
                'proof_of_payment' => $data['proof_of_payment'] ?? null,
                'reference_no' => $data['reference_no'] ?? null,
                'manuscript_proposal' => $data['manuscript_proposal'] ?? null,
                'similarity_index' => $data['similarity_index'] ?? null,
                'submitted_by' => Auth::id(),
                'submitted_at' => now(),
                'status' => 'Pending',
                'priority' => 'Medium',
                'workflow_state' => 'submitted', // New workflow: submitted → adviser-review
            ];

            // Try to map adviser name to user ID
            if ($defenseRequestData['defense_adviser']) {
                $adviserName = trim($defenseRequestData['defense_adviser']);
                $normalized = preg_replace('/\s+/',' ', strtolower($adviserName));

                $userMatch = \App\Models\User::whereIn('role',['Faculty','Adviser'])
                    ->get()
                    ->first(function($u) use ($normalized) {
                        $combo1 = strtolower($u->first_name.' '.$u->last_name);
                        $combo2 = strtolower($u->last_name.', '.$u->first_name);
                        return str_contains($normalized,$combo1) || str_contains($normalized,$combo2);
                    });

                if ($userMatch) {
                    $defenseRequestData['adviser_user_id'] = $userMatch->id;
                    $defenseRequestData['assigned_to_user_id'] = $userMatch->id;
                    $defenseRequestData['workflow_state'] = 'adviser-review';
                }
            }

            // Ensure initial workflow_state is 'submitted' only.
            $defenseRequestData['workflow_state'] = 'submitted';

            // If adviser matched earlier code may have set adviser_user_id; DO NOT escalate visibility.
            // Remove any accidental adviser-approved / coordinator-* states.
            unset($defenseRequestData['status']); // optional: let it default (or set $defenseRequestData['status'] = 'pending';)
            $defenseRequestData['status'] = $defenseRequestData['status'] ?? 'pending';

            // Now create
            $defenseRequest = DefenseRequest::create($defenseRequestData);
            
            // Add workflow history entry
            $defenseRequest->addWorkflowEntry(
                'submitted',
                'Defense request submitted by student',
                Auth::id()
            )->save();
            
        } catch (\Exception $e) {
            Log::error('Failed to create defense request: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to submit defense requirements. Please try again.');
        }

        return redirect()->back()->with('success', 'Defense requirements submitted successfully!');
    }

    public function unsubmit(Request $request, $id)
    {
        $defenseRequest = DefenseRequest::findOrFail($id);

        if ($defenseRequest->submitted_by !== Auth::id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $allowedStates = ['pending', 'submitted', 'adviser-review'];
        $currentState = strtolower($defenseRequest->workflow_state ?? '');
        $currentStatus = strtolower($defenseRequest->status ?? '');

        if (!in_array($currentState, $allowedStates) && $currentStatus !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'You can only unsubmit requirements that are still pending or under adviser review.'
            ], 403);
        }

        $reason = $request->input('reason');

        // Create cancellation record
        DefenseRequestCancellation::create([
            'defense_request_id' => $defenseRequest->id,
            'cancelled_by' => Auth::id(),
            'reason' => $reason,
        ]); 

        // Update the defense request status
        $defenseRequest->status = 'Cancelled';
        $defenseRequest->workflow_state = 'cancelled';
        $defenseRequest->save();

        return response()->json(['success' => true]);
    }
}
