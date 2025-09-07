<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
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

        // Define role-based access
        $coordinatorRoles = ['Coordinator', 'Administrative Assistant', 'Dean'];
        $isCoordinator = in_array($user->role, $coordinatorRoles);
        $isFaculty = $user->role === 'Faculty';

        if ($isCoordinator) {
            // Coordinators can only see requests that have been approved by advisers
            $requirements = DefenseRequest::with(['user' => function($query) {
                $query->select('id', 'first_name', 'last_name', 'school_id', 'program');
            }])
            ->whereIn('workflow_state', ['adviser-approved', 'coordinator-review', 'coordinator-approved', 'coordinator-rejected', 'scheduled', 'completed'])
            ->get();
            
            $requests = DefenseRequest::with(['adviserUser', 'assignedTo', 'adviserReviewer'])
                ->whereIn('workflow_state', ['adviser-approved', 'coordinator-review', 'coordinator-approved', 'coordinator-rejected', 'scheduled', 'completed'])
                ->orderByDesc('created_at')
                ->get();
                
        } elseif ($isFaculty) {
            // Faculty/Advisers: only see requests assigned to them
            $requirements = DefenseRequest::with(['user' => function($query) {
                $query->select('id', 'first_name', 'last_name', 'school_id', 'program');
            }])
                ->where(function($q) use ($user){
                    $q->where('adviser_user_id', $user->id)
                      ->orWhere('assigned_to_user_id', $user->id);
                })
                ->get();

            $requests = DefenseRequest::with(['adviserUser', 'assignedTo', 'adviserReviewer'])
                ->where(function($q) use ($user){
                    $q->where('adviser_user_id', $user->id)
                      ->orWhere('assigned_to_user_id', $user->id);
                })
                ->orderByDesc('created_at')
                ->get();
        } else {
            // Other roles have no access
            $requirements = collect();
            $requests = collect();
        }

        return inertia('adviser/defense-requirements/Index', [
            'defenseRequirements' => $requirements,
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
                $adviserUser = \App\Models\User::where(function($query) use ($adviserName) {
                    $query->whereRaw('CONCAT(first_name, " ", last_name) = ?', [$adviserName])
                          ->orWhereRaw('CONCAT(last_name, ", ", first_name) = ?', [$adviserName]);
                    
                    $nameParts = preg_split('/\s+/', $adviserName);
                    if (count($nameParts) >= 2) {
                        $firstName = $nameParts[0];
                        $lastName = end($nameParts);
                        
                        $query->orWhere(function($q) use ($firstName, $lastName) {
                            $q->where('first_name', 'LIKE', '%' . $firstName . '%')
                              ->where('last_name', 'LIKE', '%' . $lastName . '%');
                        });
                    }
                })
                ->where('role', 'Faculty')
                ->first();
                
                if ($adviserUser) {
                    $defenseRequestData['adviser_user_id'] = $adviserUser->id;
                    $defenseRequestData['assigned_to_user_id'] = $adviserUser->id;
                    $defenseRequestData['workflow_state'] = 'adviser-review'; // Automatically route to adviser
                }
            }

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
}
