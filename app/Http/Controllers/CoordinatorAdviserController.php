<?php

namespace App\Http\Controllers;

use App\Models\Adviser;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\AdviserInvitation;

class CoordinatorAdviserController extends Controller
{
    // List all advisers for this coordinator
    public function index(Request $request)
    {
        $coordinator = $request->user();

        // Load all adviser rows for this coordinator
        $adviserRows = Adviser::where('coordinator_id', $coordinator->id)->get();

        // Preload any matching users by email to avoid N+1
        $emails = $adviserRows->pluck('email')->filter()->unique()->values()->all();
        $usersByEmail = User::whereIn('email', $emails)->get()->keyBy('email');

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
                    // Only include students assigned by this coordinator
                    $students = $user->advisedStudents
                        ->filter(function ($student) use ($coordinator) {
                            return $student->pivot && $student->pivot->requested_by == $coordinator->id;
                        })
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

                    // Count only accepted students assigned by this coordinator
                    $assigned_students_count = $user->advisedStudents()
                        ->wherePivot('status', 'accepted')
                        ->wherePivot('requested_by', $coordinator->id)
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
            'email' => 'required|email|max:255',
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

        // DO NOT check for global duplicate anymore!

        // Simple check: is there a User with that email?
        $user = User::where('email', $validated['email'])->first();

        $status = $user ? 'active' : 'inactive';

        try {
            $adviser = Adviser::create([
                'coordinator_id' => $coordinator->id,
                'first_name' => $first,
                'middle_name' => $middle,
                'last_name' => $last,
                'email' => $validated['email'],
                'status' => $status,
                'user_id' => $user ? $user->id : null,
            ]);
        } catch (QueryException $e) {
            $errorCode = $e->errorInfo[1] ?? null;
            if ($errorCode === 1062) {
                return response()->json(['error' => 'An adviser with that email already exists for this coordinator.'], 409);
            }
            return response()->json(['error' => 'Database error: ' . ($e->getMessage() ?? 'unknown')], 500);
        }

        // If matching User exists, overwrite adviser fields with authoritative user values
        if ($user) {
            $adviser->first_name = $user->first_name;
            $adviser->middle_name = $user->middle_name ?? $adviser->middle_name;
            $adviser->last_name = $user->last_name;
            $adviser->employee_id = $user->employee_id ?? $adviser->employee_id ?? null;
            $adviser->status = 'active';
            $adviser->user_id = $user->id;
            $adviser->save();

            // if you maintain a pivot or coordinators() on User, keep relationship in sync
            if (method_exists($user, 'coordinators')) {
                $user->coordinators()->syncWithoutDetaching([$coordinator->id]);
            }
        } else {
            // If no matching user exists (inactive adviser), mark as needs invitation
            // but don't send automatically - wait for user confirmation
            Log::info('Adviser registered as inactive, awaiting invitation confirmation', [
                'adviser_email' => $adviser->email,
                'adviser_id' => $adviser->id
            ]);
        }

        $payload = [
            'id' => $adviser->id,
            'first_name' => $adviser->first_name,
            'middle_name' => $adviser->middle_name,
            'last_name' => $adviser->last_name,
            'email' => $adviser->email,
            'employee_id' => $adviser->employee_id ?? null,
            'status' => $adviser->status,
            'students' => [],
        ];

        return response()->json(['success' => true, 'adviser' => $payload]);
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
        
        // Verify adviser belongs to this coordinator
        $adviser = Adviser::where('coordinator_id', $coordinator->id)->findOrFail($id);
        
        // Only send invitation to inactive advisers
        if ($adviser->status !== 'inactive') {
            return response()->json([
                'success' => false,
                'message' => 'Adviser is already active.'
            ], 400);
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
                'message' => 'Invitation email sent successfully.'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to send adviser invitation email', [
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'trace' => $e->getTraceAsString(),
                'adviser_email' => $adviser->email,
                'adviser_id' => $adviser->id,
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

        $students = $adviserUser->advisedStudents()
            ->wherePivot('status', 'accepted')
            ->wherePivot('requested_by', $coordinator->id) // <-- Only those assigned by this coordinator
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

        if (!$adviser->user_id) return response()->json([]);

        $adviserUser = User::find($adviser->user_id);
        if (!$adviserUser) return response()->json([]);

        $students = $adviserUser->advisedStudents()
            ->wherePivot('status', 'pending')
            ->wherePivot('requested_by', $coordinator->id) // <-- Only those assigned by this coordinator
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
                ];
            })->values();

        return response()->json($students);
    }

    // Assign an existing student (create pivot with status = 'pending')
    public function storeStudent(Request $request, $adviserId)
    {
        $coordinator = $request->user();
        $adviser = Adviser::where('coordinator_id', $coordinator->id)->findOrFail($adviserId);

        // enforce active adviser (linked user)
        if (!$adviser->user_id && $adviser->email) {
            $matchedUser = User::where('email', $adviser->email)->first();
            if ($matchedUser) {
                $adviser->user_id = $matchedUser->id;
                $adviser->status = 'active';
                $adviser->save();
            }
        }

        if (!$adviser->user_id) {
            return response()->json(['error' => 'Adviser must be active (linked to a User) before assigning students.'], 400);
        }

        $validated = $request->validate([
            'student_id' => 'nullable|integer|exists:users,id',
            'email' => 'nullable|email',
        ]);

        $student = null;
        if (!empty($validated['student_id'])) {
            $student = User::find($validated['student_id']);
        } elseif (!empty($validated['email'])) {
            $student = User::where('email', $validated['email'])->first();
            if (!$student) {
                return response()->json(['error' => 'Student not found.'], 404);
            }
        } else {
            return response()->json(['error' => 'student_id or email required.'], 422);
        }

        // Check if student is already assigned to ANY adviser (pending or accepted)
        $alreadyAssigned = $student->advisers()
            ->wherePivotIn('status', ['accepted', 'pending'])
            ->exists();

        if ($alreadyAssigned) {
            return response()->json(['error' => 'This student is already assigned to another adviser.'], 409);
        }

        $adviserUser = User::find($adviser->user_id);

        // create pending pivot (syncWithoutDetaching to avoid wiping)
        $adviserUser->advisedStudents()->syncWithoutDetaching([
            $student->id => [
                'status' => 'pending',
                'requested_by' => $coordinator->id,
            ]
        ]);

        // Send email notification to adviser about the new student assignment
        try {
            if ($adviserUser->email) {
                Mail::to($adviserUser->email)
                    ->send(new \App\Mail\StudentAssignedToAdviser($adviserUser, $student, $coordinator));
                
                Log::info('Student Assignment: Email sent to adviser', [
                    'adviser_id' => $adviserUser->id,
                    'adviser_email' => $adviserUser->email,
                    'student_id' => $student->id,
                    'student_name' => trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')),
                    'coordinator_id' => $coordinator->id
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Student Assignment: Failed to send email to adviser', [
                'adviser_id' => $adviserUser->id,
                'adviser_email' => $adviserUser->email ?? 'N/A',
                'student_id' => $student->id,
                'error' => $e->getMessage()
            ]);
            // Don't fail the assignment if email fails
        }

        // return pending list after adding
        return $this->pendingStudents($request, $adviserId);
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
