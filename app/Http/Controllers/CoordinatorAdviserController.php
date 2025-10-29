<?php

namespace App\Http\Controllers;

use App\Models\Adviser;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;  // ✅ ADD THIS LINE
use App\Mail\AdviserInvitation;

class CoordinatorAdviserController extends Controller
{
    // List all advisers for this coordinator
    public function index(Request $request)
    {
        $coordinator = $request->user();

        // Load all adviser rows for this coordinator
        $adviserRows = Adviser::where('coordinator_id', $coordinator->id)->get();
        
        Log::info('Fetching advisers for coordinator', [
            'coordinator_id' => $coordinator->id,
            'adviser_count' => $adviserRows->count(),
            'advisers' => $adviserRows->toArray()
        ]);

        // Preload any matching users by email to avoid N+1
        $emails = $adviserRows->pluck('email')->filter()->unique()->values()->all();
        
        Log::info('Emails to lookup', ['emails' => $emails]);
        
        $usersByEmail = [];
        if (!empty($emails)) {
            $usersByEmail = User::whereIn('email', $emails)->get()->keyBy('email');
        }

        $advisers = [];

        foreach ($adviserRows as $row) {
            $matchedUser = $usersByEmail->get($row->email);

            // If a matching user exists but adviser row wasn't linked / active, reconcile now
            if ($matchedUser) {
                $row->first_name = $matchedUser->first_name;
                $row->middle_name = $matchedUser->middle_name ?? $row->middle_name;
                $row->last_name = $matchedUser->last_name;
                $row->employee_id = $matchedUser->employee_id ?? $row->employee_id;
                $row->status = 'active';
                $row->user_id = $matchedUser->id;
                // Save only if something changed
                if ($row->isDirty()) {
                    $row->save();
                }

                // Ensure the matched User has this coordinator attached (multi-coordinator support)
                if (method_exists($matchedUser, 'coordinators') && $row->coordinator_id) {
                    $matchedUser->coordinators()->syncWithoutDetaching([$row->coordinator_id]);
                }
            }

            // Build students list — if linked to a user use their advisedStudents relation
            $students = [];
            $assigned_students_count = 0;
            if ($row->user_id) {
                $user = $matchedUser ?? User::find($row->user_id);
                if ($user) {
                    // Include all students for this adviser (regardless of who assigned them)
                    $students = $user->advisedStudents
                        ->map(function ($student) use ($coordinator) {
                            $coordinatorName = null;
                            if ($student->pivot && $student->pivot->requested_by) {
                                $coordinator = User::find($student->pivot->requested_by);
                                if ($coordinator) {
                                    $coordinatorName = trim(
                                        $coordinator->first_name . ' ' .
                                        ($coordinator->middle_name ? strtoupper($coordinator->middle_name[0]) . '. ' : '') .
                                        $coordinator->last_name
                                    );
                                }
                            }
                            return [
                                'id' => $student->id,
                                'student_number' => $student->student_number,
                                'first_name' => $student->first_name,
                                'middle_name' => $student->middle_name,
                                'last_name' => $student->last_name,
                                'email' => $student->email,
                                'program' => $student->program,
                                'coordinator_name' => $coordinatorName,
                            ];
                        })
                        ->values()
                        ->all();

                    // Count all accepted students for this adviser
                    $assigned_students_count = $user->advisedStudents()
                        ->wherePivot('status', 'accepted')
                        ->count();
                }
            }

            $advisers[] = [
                'id' => $row->id,
                'first_name' => $row->first_name,
                'middle_name' => $row->middle_name,
                'last_name' => $row->last_name,
                'email' => $row->email,
                'employee_id' => $row->employee_id,
                'status' => $row->status ?? 'inactive',
                'students' => $students,
                'assigned_students_count' => $assigned_students_count,
            ];
        }

        return response()->json($advisers);
    }

    // Attach an adviser to this coordinator
    public function store(Request $request)
    {
        $coordinator = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                'regex:/^[a-zA-Z0-9._%+-]+@uic\.edu\.ph$/'
            ],
        ], [
            'email.regex' => 'Email must be a valid UIC email address (@uic.edu.ph). Please ensure the adviser is registered with the university first.'
        ]);

        // Normalize and split name safely
        $parts = preg_split('/\s+/', trim($validated['name']));
        $first = count($parts) ? array_shift($parts) : '';
        $last = count($parts) ? array_pop($parts) : '';
        $middle = count($parts) ? implode(' ', $parts) : null;

        // Prevent same coordinator from adding same email twice
        $existingForCoordinator = Adviser::where('coordinator_id', $coordinator->id)
            ->where('email', $validated['email'])
            ->first();

        if ($existingForCoordinator) {
            return response()->json(['error' => 'Adviser already added.'], 409);
        }

        // Check if there's a User with that email
        $user = User::where('email', $validated['email'])->first();

        // If user exists, create the adviser record immediately (they're active)
        if ($user) {
            try {
                $adviser = Adviser::create([
                    'coordinator_id' => $coordinator->id,
                    'first_name' => $user->first_name,
                    'middle_name' => $user->middle_name,
                    'last_name' => $user->last_name,
                    'email' => $validated['email'],
                    'employee_id' => $user->employee_id ?? null,
                    'status' => 'active',
                    'user_id' => $user->id,
                ]);

                Log::info('Active adviser created successfully', [
                    'adviser_id' => $adviser->id,
                    'email' => $adviser->email,
                    'status' => $adviser->status
                ]);

                if (method_exists($user, 'coordinators')) {
                    $user->coordinators()->syncWithoutDetaching([$coordinator->id]);
                }

                $payload = [
                    'id' => $adviser->id,
                    'first_name' => $adviser->first_name,
                    'middle_name' => $adviser->middle_name,
                    'last_name' => $adviser->last_name,
                    'email' => $adviser->email,
                    'employee_id' => $adviser->employee_id,
                    'status' => $adviser->status,
                    'students' => [],
                ];

                return response()->json(['success' => true, 'adviser' => $payload]);

            } catch (QueryException $e) {
                $errorCode = $e->errorInfo[1] ?? null;
                if ($errorCode === 1062) {
                    return response()->json(['error' => 'An adviser with that email already exists for this coordinator.'], 409);
                }
                Log::error('Failed to create adviser', [
                    'error' => $e->getMessage(),
                    'code' => $errorCode
                ]);
                return response()->json(['error' => 'Database error: ' . ($e->getMessage() ?? 'unknown')], 500);
            }
        }

        // If no user exists, DON'T create adviser yet - return pending status
        // The adviser will be created when the invitation is confirmed/sent
        Log::info('Adviser invitation pending confirmation', [
            'email' => $validated['email'],
            'coordinator_id' => $coordinator->id
        ]);

        // Return a "pending" adviser object for the frontend to display confirmation
        $payload = [
            'id' => null, // No ID yet since not created
            'first_name' => $first,
            'middle_name' => $middle,
            'last_name' => $last,
            'email' => $validated['email'],
            'employee_id' => null,
            'status' => 'pending_invitation',
            'students' => [],
            'pending_data' => [ // Store this for later creation
                'coordinator_id' => $coordinator->id,
                'first_name' => $first,
                'middle_name' => $middle,
                'last_name' => $last,
                'email' => $validated['email'],
            ]
        ];

        return response()->json(['success' => true, 'adviser' => $payload, 'needs_confirmation' => true]);
    }

    // Update adviser info
    public function update(Request $request, $id)
    {
        $coordinator = $request->user();

        $adviser = Adviser::where('coordinator_id', $coordinator->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
        ]);

        $parts = preg_split('/\s+/', trim($validated['name']));
        $first = $parts[0] ?? '';
        $last = count($parts) > 1 ? array_pop($parts) : '';
        $middle = count($parts) > 1 ? implode(' ', array_slice($parts, 1, -1)) : null;

        $adviser->first_name = $first;
        $adviser->middle_name = $middle;
        $adviser->last_name = $last;
        $adviser->email = $validated['email'];

        // Simple check: is there a User with that email?
        $user = User::where('email', $validated['email'])->first();

        $adviser->status = $user ? 'active' : 'inactive';
        $adviser->user_id = $user ? $user->id : null;

        if ($user) {
            $adviser->first_name = $user->first_name;
            $adviser->middle_name = $user->middle_name ?? $adviser->middle_name;
            $adviser->last_name = $user->last_name;
            $adviser->employee_id = $user->employee_id ?? $adviser->employee_id ?? null;
            $adviser->status = 'active';
        }

        $adviser->save();

        return response()->json(['success' => true, 'adviser' => $adviser]);
    }

    // Send invitation email to inactive adviser
    public function sendInvitation(Request $request, $id)
    {
        $coordinator = $request->user();
        
        // If $id is null or 'pending', this is a new invitation
        // Get the adviser data from the request
        if ($id === 'pending' || !$id) {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => [
                    'required',
                    'email',
                    'max:255',
                    'regex:/@uic\.edu\.ph$/i'
                ],
            ]);

            // Check if already exists
            $existing = Adviser::where('coordinator_id', $coordinator->id)
                ->where('email', $validated['email'])
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Adviser already exists.'
                ], 400);
            }

            // Create the adviser record NOW (when invitation is confirmed)
            try {
                $adviser = Adviser::create([
                    'coordinator_id' => $coordinator->id,
                    'first_name' => $validated['first_name'],
                    'middle_name' => $validated['middle_name'],
                    'last_name' => $validated['last_name'],
                    'email' => $validated['email'],
                    'status' => 'inactive',
                    'user_id' => null,
                ]);

                Log::info('Adviser created on invitation send', [
                    'adviser_id' => $adviser->id,
                    'email' => $adviser->email
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to create adviser on invitation', [
                    'error' => $e->getMessage(),
                    'email' => $validated['email']
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create adviser record.'
                ], 500);
            }
        } else {
            // Existing adviser - verify it belongs to this coordinator
            $adviser = Adviser::where('coordinator_id', $coordinator->id)->findOrFail($id);
            
            // Only send invitation to inactive advisers
            if ($adviser->status !== 'inactive') {
                return response()->json([
                    'success' => false,
                    'message' => 'Adviser is already active.'
                ], 400);
            }
        }
        
        try {
            $adviserFullName = trim($adviser->first_name . ' ' . 
                ($adviser->middle_name ? $adviser->middle_name . ' ' : '') . 
                $adviser->last_name);
            
            $coordinatorFullName = trim($coordinator->first_name . ' ' . 
                ($coordinator->middle_name ? $coordinator->middle_name . ' ' : '') . 
                $coordinator->last_name);

            Log::info('Attempting to send adviser invitation email', [
                'adviser_email' => $adviser->email,
                'adviser_name' => $adviserFullName,
                'coordinator_name' => $coordinatorFullName,
                'adviser_id' => $adviser->id,
                'mail_mailer' => config('mail.default'),
                'mail_from' => config('mail.from.address')
            ]);

            Mail::to($adviser->email)->send(new AdviserInvitation($adviserFullName, $coordinatorFullName));
            
            Log::info('Adviser invitation email sent successfully', [
                'adviser_email' => $adviser->email,
                'adviser_name' => $adviserFullName,
                'coordinator_name' => $coordinatorFullName,
                'adviser_id' => $adviser->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Invitation email sent successfully.',
                'adviser' => [
                    'id' => $adviser->id,
                    'first_name' => $adviser->first_name,
                    'middle_name' => $adviser->middle_name,
                    'last_name' => $adviser->last_name,
                    'email' => $adviser->email,
                    'status' => $adviser->status,
                ]
            ]);
            
        } catch (\Exception $e) {
            // If email fails, delete the adviser record we just created
            if (isset($adviser) && $adviser->id && $id === 'pending') {
                $adviser->delete();
                Log::info('Deleted adviser record due to email failure', [
                    'adviser_id' => $adviser->id
                ]);
            }
            
            Log::error('Failed to send adviser invitation email', [
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'trace' => $e->getTraceAsString(),
                'adviser_email' => $adviser->email ?? 'unknown',
                'adviser_id' => $adviser->id ?? null,
                'mail_config' => [
                    'mailer' => config('mail.default'),
                    'from_address' => config('mail.from.address'),
                    'from_name' => config('mail.from.name')
                ]
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send invitation email. ' . $e->getMessage()
            ], 500);
        }
    }

    // Remove adviser and all their student relationships
    public function destroy(Request $request, $id)
    {
        $coordinator = $request->user();
        $adviser = Adviser::where('coordinator_id', $coordinator->id)->findOrFail($id);

        // Remove all student relationships for this adviser
        if ($adviser->user_id) {
            $adviserUser = User::find($adviser->user_id);
            if ($adviserUser) {
                $adviserUser->advisedStudents()->detach();
            }
        }

        $adviser->delete();

        return response()->json(['success' => true]);
    }

    // Search advisers (autocomplete)
    public function search(Request $request)
    {
        $query = $request->input('query', '');
        $coordinator = $request->user();

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $advisers = Adviser::where('coordinator_id', $coordinator->id)
            ->where(function ($q) use ($query) {
                $q->where('first_name', 'LIKE', "%{$query}%")
                  ->orWhere('last_name', 'LIKE', "%{$query}%")
                  ->orWhere('email', 'LIKE', "%{$query}%");
            })
            ->limit(10)
            ->get();

        return response()->json($advisers);
    }

    // Return students assigned (accepted) to an adviser
    public function students(Request $request, $adviserId)
    {
        $coordinator = $request->user();
        $adviser = Adviser::where('coordinator_id', $coordinator->id)->findOrFail($adviserId);

        if (!$adviser->user_id) return response()->json([]);

        $adviserUser = User::find($adviser->user_id);
        if (!$adviserUser) return response()->json([]);

        // Get all accepted students for this adviser (regardless of who assigned them)
        $students = $adviserUser->advisedStudents()
            ->wherePivot('status', 'accepted')
            ->get()
            ->map(function ($s) use ($coordinator) {
                $coordinatorName = null;
                if ($s->pivot && $s->pivot->requested_by) {
                    $coordinatorUser = User::find($s->pivot->requested_by);
                    if ($coordinatorUser) {
                        $coordinatorName = trim(
                            $coordinatorUser->first_name . ' ' .
                            ($coordinatorUser->middle_name ? strtoupper($coordinatorUser->middle_name[0]) . '. ' : '') .
                            $coordinatorUser->last_name
                        );
                    }
                }
                return [
                    'id' => $s->id,
                    'student_number' => $s->student_number ?? null,
                    'first_name' => $s->first_name ?? null,
                    'middle_name' => $s->middle_name ?? null,
                    'last_name' => $s->last_name ?? null,
                    'email' => $s->email ?? null,
                    'program' => $s->program ?? null,
                    'coordinator_name' => $coordinatorName,
                ];
            })->values();

        return response()->json($students);
    }

    // Return pending students for this adviser (coordinator view)
    public function pendingStudents(Request $request, $adviserId)
    {
        $coordinator = $request->user();
        $adviser = Adviser::where('coordinator_id', $coordinator->id)->findOrFail($adviserId);

        Log::info('Fetching pending students', [
            'coordinator_id' => $coordinator->id,
            'adviser_id' => $adviserId,
            'adviser_coordinator_id' => $adviser->coordinator_id,
        ]);

        $pendingStudents = [];

        // 1. Get registered students with pending status
        if ($adviser->user_id) {
            $adviserUser = User::find($adviser->user_id);
            if ($adviserUser) {
                // Get all pending students for this adviser (regardless of who assigned them)
                $registeredPending = $adviserUser->advisedStudents()
                    ->wherePivot('status', 'pending')
                    ->get()
                    ->map(function ($s) use ($coordinator) {
                        $coordinatorName = null;
                        if ($s->pivot && $s->pivot->requested_by) {
                            $coordinatorUser = User::find($s->pivot->requested_by);
                            if ($coordinatorUser) {
                                $coordinatorName = trim(
                                    $coordinatorUser->first_name . ' ' .
                                    ($coordinatorUser->middle_name ? strtoupper($coordinatorUser->middle_name[0]) . '. ' : '') .
                                    $coordinatorUser->last_name
                                );
                            }
                        }
                        return [
                            'id' => $s->id,
                            'student_number' => $s->student_number ?? null,
                            'first_name' => $s->first_name ?? null,
                            'middle_name' => $s->middle_name ?? null,
                            'last_name' => $s->last_name ?? null,
                            'email' => $s->email ?? null,
                            'program' => $s->program ?? null,
                            'coordinator_name' => $coordinatorName,
                            'requested_by' => $s->pivot->requested_by ?? null,
                            'requested_at' => $s->pivot->created_at ?? null,
                            'is_pre_registered' => false,
                        ];
                    });

                Log::info('Registered pending students found', ['count' => $registeredPending->count()]);
                $pendingStudents = array_merge($pendingStudents, $registeredPending->toArray());
            }
        }

        // 2. Get pre-registered students (invited but not logged in yet)
        // Show all pending assignments for this adviser (regardless of which coordinator created them)
        $preRegisteredQuery = \App\Models\PendingStudentAssignment::where('adviser_id', $adviser->id);
        
        Log::info('Querying PendingStudentAssignment', [
            'adviser_id' => $adviser->id,
            'coordinator_id' => $coordinator->id,
            'count' => $preRegisteredQuery->count(),
        ]);

        $preRegistered = $preRegisteredQuery->get()
            ->map(function ($pending) {
                // Get the actual coordinator who created this assignment
                $assignedByCoordinator = User::find($pending->coordinator_id);
                $coordinatorName = null;
                if ($assignedByCoordinator) {
                    $coordinatorName = trim(
                        $assignedByCoordinator->first_name . ' ' .
                        ($assignedByCoordinator->middle_name ? strtoupper($assignedByCoordinator->middle_name[0]) . '. ' : '') .
                        $assignedByCoordinator->last_name
                    );
                }
                
                // Extract name from email
                $emailParts = explode('@', $pending->student_email);
                $emailUsername = $emailParts[0] ?? '';
                $nameParts = explode('.', $emailUsername);
                $firstName = isset($nameParts[0]) ? ucfirst($nameParts[0]) : '';
                $lastName = isset($nameParts[1]) ? ucfirst($nameParts[1]) : '';

                return [
                    'id' => 'pending_' . $pending->id,
                    'student_number' => null,
                    'first_name' => $firstName ?: 'Not',
                    'middle_name' => null,
                    'last_name' => $lastName ?: 'Registered',
                    'email' => $pending->student_email,
                    'program' => 'Awaiting Registration',
                    'coordinator_name' => $coordinatorName,
                    'requested_by' => $pending->coordinator_id,
                    'requested_at' => $pending->created_at,
                    'is_pre_registered' => true,
                    'invitation_sent' => $pending->invitation_sent,
                    'invitation_sent_at' => $pending->invitation_sent_at,
                ];
            });

        Log::info('Pre-registered students found', ['count' => $preRegistered->count()]);
        $pendingStudents = array_merge($pendingStudents, $preRegistered->toArray());

        Log::info('Total pending students', ['count' => count($pendingStudents)]);
        return response()->json($pendingStudents);
    }

    // Assign an existing student (create pivot with status = 'pending')
    public function storeStudent(Request $request, $adviserId)
    {
        try {
            $coordinator = $request->user();
            
            // Find adviser
            $adviser = Adviser::where('coordinator_id', $coordinator->id)->findOrFail($adviserId);

            // Validate request
            $validated = $request->validate([
                'student_id' => 'nullable|integer|exists:users,id',
                'email' => [
                    'nullable',
                    'email',
                    'regex:/^[a-zA-Z0-9._%+-]+@uic\.edu\.ph$/'
                ],
                'send_email' => 'nullable|boolean',
                'confirm_assignment' => 'nullable|boolean', // New field to confirm actual assignment
            ], [
                'email.regex' => 'Student email must be a valid UIC email address (@uic.edu.ph). Only registered UIC students can be added.'
            ]);

            $sendEmail = $validated['send_email'] ?? false;
            $confirmAssignment = $validated['confirm_assignment'] ?? false;

            // Find or prepare student information
            $student = null;
            $studentNotRegistered = false;
            $studentEmail = null;
            
            if (!empty($validated['student_id'])) {
                $student = User::find($validated['student_id']);
            } elseif (!empty($validated['email'])) {
                $studentEmail = $validated['email'];
                $student = User::where('email', $studentEmail)->first();
                
                // If student not found, they haven't registered yet
                if (!$student) {
                    $studentNotRegistered = true;
                    
                    // Only create pending assignment if confirmed
                    if ($confirmAssignment) {
                        $pendingAssignment = \App\Models\PendingStudentAssignment::updateOrCreate(
                            ['student_email' => $studentEmail],
                            [
                                'adviser_id' => $adviser->id,
                                'coordinator_id' => $coordinator->id,
                                'invitation_sent' => $sendEmail,
                                'invitation_sent_at' => $sendEmail ? now() : null,
                            ]
                        );
                        
                        // Extract name from email if possible (e.g., firstname.lastname@uic.edu.ph)
                        $emailParts = explode('@', $studentEmail);
                        $emailName = $emailParts[0] ?? 'Student';
                        
                        // Send invitation email if requested
                        if ($sendEmail) {
                            try {
                                $adviserUser = User::find($adviser->user_id);
                                $adviserFullName = $adviserUser ? trim("{$adviserUser->first_name} {$adviserUser->last_name}") : "Your Adviser";
                                $coordinatorFullName = trim("{$coordinator->first_name} {$coordinator->last_name}");
                                
                                Mail::to($studentEmail)->send(new \App\Mail\StudentInvitation(
                                    ucfirst($emailName),  // Use email username as name
                                    $adviserFullName,
                                    $coordinatorFullName
                                ));
                                
                                Log::info('Student invitation email sent (not yet registered)', [
                                    'student_email' => $studentEmail,
                                    'adviser' => $adviserFullName,
                                    'coordinator' => $coordinatorFullName,
                                    'pending_assignment_id' => $pendingAssignment->id
                                ]);
                            } catch (\Exception $e) {
                                Log::error('Failed to send student invitation email', [
                                    'student_email' => $studentEmail,
                                    'error' => $e->getMessage()
                                ]);
                                // If email fails, delete the pending assignment
                                $pendingAssignment->delete();
                                throw $e;
                            }
                        }
                        
                        return response()->json([
                            'success' => true,
                            'message' => 'Invitation email sent. The student will appear in "Pending Confirmation" and be assigned automatically when they log in.',
                            'pending_registration' => true,
                            'student_email' => $studentEmail,
                        ]);
                    } else {
                        // Return pending status without creating record - needs confirmation
                        return response()->json([
                            'success' => true,
                            'pending_registration' => true,
                            'needs_confirmation' => true,
                            'student_email' => $studentEmail,
                            'student_data' => [
                                'email' => $studentEmail,
                                'not_registered' => true,
                            ]
                        ]);
                    }
                }
            } else {
                return response()->json(['error' => 'student_id or email required.'], 422);
            }

            // Check if adviser has a user_id
            if (!$adviser->user_id) {
                // Try to link adviser to user
                $matchedUser = User::where('email', $adviser->email)->first();
                if ($matchedUser) {
                    $adviser->user_id = $matchedUser->id;
                    $adviser->status = 'active';
                    $adviser->save();
                } else {
                    return response()->json(['error' => 'Adviser must be active (linked to a User) before assigning students.'], 400);
                }
            }

            $adviserUser = User::find($adviser->user_id);

            // Check if student is already assigned to ANY adviser
            $alreadyAssigned = DB::table('adviser_student')
                ->where('student_id', $student->id)
                ->whereIn('status', ['accepted', 'pending'])
                ->exists();

            if ($alreadyAssigned) {
                return response()->json(['error' => 'This student is already assigned to another adviser.'], 409);
            }

            // If not confirmed yet, return pending status without creating record
            if (!$confirmAssignment) {
                return response()->json([
                    'success' => true,
                    'needs_confirmation' => true,
                    'student_data' => [
                        'id' => $student->id,
                        'email' => $student->email,
                        'first_name' => $student->first_name,
                        'last_name' => $student->last_name,
                    ]
                ]);
            }

            // CONFIRMED - Now actually create the assignment
            // Start transaction
            DB::beginTransaction();

            // Assign student with pending status
            DB::table('adviser_student')->insert([
                'adviser_id' => $adviserUser->id,
                'student_id' => $student->id,
                'status' => 'pending',
                'requested_by' => $coordinator->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create notification for adviser
            Notification::create([
                'user_id' => $adviserUser->id,
                'type' => 'student_assigned',
                'title' => 'New Student Assigned',
                'message' => "Coordinator {$coordinator->first_name} {$coordinator->last_name} has assigned {$student->first_name} {$student->last_name} to you. Please review and accept/reject.",
                'action_url' => '/adviser/pending-students',
            ]);

            // Create notification for student
            Notification::create([
                'user_id' => $student->id,
                'type' => 'assigned_to_adviser',
                'title' => 'Assigned to Adviser',
                'message' => "You have been assigned to adviser {$adviserUser->first_name} {$adviserUser->last_name} by {$coordinator->first_name} {$coordinator->last_name}. Awaiting adviser's acceptance.",
                'action_url' => '/dashboard',
            ]);

            DB::commit();

            // Send emails AFTER commit (don't fail if email fails)
            if ($sendEmail) {
                try {
                    // Check if student has logged in before (is active)
                    $studentIsActive = $student->hasVerifiedEmail() || $student->last_login_at !== null;
                    
                    // Send email to adviser about the new assignment
                    if ($adviserUser->email) {
                        Mail::to($adviserUser->email)->send(new \App\Mail\StudentAssignedToAdviser($adviserUser, $student, $coordinator));
                        Log::info('Student assignment email sent to adviser', ['adviser_email' => $adviserUser->email]);
                    }
                    
                    // Send invitation email to student if they haven't logged in yet
                    if (!$studentIsActive && $student->email) {
                        $studentFullName = trim("{$student->first_name} {$student->last_name}");
                        $adviserFullName = trim("{$adviserUser->first_name} {$adviserUser->last_name}");
                        $coordinatorFullName = trim("{$coordinator->first_name} {$coordinator->last_name}");
                        
                        Mail::to($student->email)->send(new \App\Mail\StudentInvitation(
                            $studentFullName,
                            $adviserFullName,
                            $coordinatorFullName
                        ));
                        
                        Log::info('Student invitation email sent', [
                            'student_email' => $student->email,
                            'student_name' => $studentFullName,
                            'reason' => 'Student has not logged in yet'
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to send assignment/invitation emails', [
                        'adviser_email' => $adviserUser->email ?? 'N/A',
                        'student_email' => $student->email ?? 'N/A',
                        'error' => $e->getMessage()
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Student assigned successfully',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('storeStudent error', [
                'adviser_id' => $adviserId ?? null,
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);

            return response()->json([
                'error' => 'Failed to assign student: ' . $e->getMessage()
            ], 500);
        }
    }

    // Detach a student from adviser
    public function destroyStudent(Request $request, $adviserId, $studentId)
    {
        $coordinator = $request->user();
        $adviser = Adviser::where('coordinator_id', $coordinator->id)->findOrFail($adviserId);

        if (!$adviser->user_id) {
            return response()->json(['error' => 'Adviser is not active.'], 400);
        }

        $adviserUser = User::find($adviser->user_id);
        if (!$adviserUser) {
            return response()->json(['error' => 'Adviser user not found.'], 404);
        }

        // Ensure student exists
        $student = User::find($studentId);
        if (!$student) {
            return response()->json(['error' => 'Student not found.'], 404);
        }

        $adviserUser->advisedStudents()->detach($student->id);

        return response()->json(['success' => true]);
    }

    // Return all advisers in the database
    public function all()
    {
        return response()->json(\App\Models\Adviser::all());
    }
}
