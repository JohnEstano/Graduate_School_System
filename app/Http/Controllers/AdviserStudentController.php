<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\StudentAcceptedByAdviser;
use App\Mail\StudentRejectedByAdviser;

class AdviserStudentController extends Controller
{
    // Return accepted students only
    public function index(Request $request)
    {
        $adviser = $request->user();
        $students = $adviser->advisedStudents()
            ->wherePivot('status', 'accepted')
            ->get()
            ->map(function ($s) {
                // Get coordinator name from pivot
                $coordinatorName = null;
                if ($s->pivot && $s->pivot->requested_by) {
                    $coordinator = User::find($s->pivot->requested_by);
                    if ($coordinator) {
                        $coordinatorName = trim(
                            $coordinator->first_name . ' ' .
                            ($coordinator->middle_name ? strtoupper($coordinator->middle_name[0]) . '. ' : '') .
                            $coordinator->last_name
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

    // Return pending assignments (adviser view)
    public function pending(Request $request)
    {
        $adviser = $request->user();
        
        // Get regular pending students (registered users in pivot table)
        $students = $adviser->advisedStudents()
            ->wherePivot('status', 'pending')
            ->get()
            ->map(function ($s) {
                // Get coordinator name from pivot
                $coordinatorName = null;
                if ($s->pivot && $s->pivot->requested_by) {
                    $coordinator = User::find($s->pivot->requested_by);
                    if ($coordinator) {
                        $coordinatorName = trim(
                            $coordinator->first_name . ' ' .
                            ($coordinator->middle_name ? strtoupper($coordinator->middle_name[0]) . '. ' : '') .
                            $coordinator->last_name
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
                    'is_registered' => true, // This student is registered
                ];
            })->values();

        // Get pending assignments for unregistered students
        $adviserRecord = \App\Models\Adviser::where('user_id', $adviser->id)->first();
        
        if ($adviserRecord) {
            $unregisteredPending = \App\Models\PendingStudentAssignment::where('adviser_id', $adviserRecord->id)
                ->get()
                ->map(function ($pending) {
                    // Get coordinator name
                    $coordinatorName = null;
                    if ($pending->coordinator_id) {
                        $coordinator = User::find($pending->coordinator_id);
                        if ($coordinator) {
                            $coordinatorName = trim(
                                $coordinator->first_name . ' ' .
                                ($coordinator->middle_name ? strtoupper($coordinator->middle_name[0]) . '. ' : '') .
                                $coordinator->last_name
                            );
                        }
                    }
                    
                    // Extract name from email (e.g., firstname.lastname@uic.edu.ph)
                    $emailParts = explode('@', $pending->student_email);
                    $emailName = $emailParts[0] ?? 'Unknown';
                    $nameParts = explode('.', $emailName);
                    
                    return [
                        'id' => 'pending_' . $pending->id, // Special ID to indicate unregistered
                        'student_number' => null,
                        'first_name' => ucfirst($nameParts[0] ?? 'Unknown'),
                        'middle_name' => null,
                        'last_name' => ucfirst($nameParts[1] ?? ''),
                        'email' => $pending->student_email,
                        'program' => null,
                        'coordinator_name' => $coordinatorName,
                        'requested_by' => $pending->coordinator_id,
                        'requested_at' => $pending->created_at,
                        'is_registered' => false, // This student is NOT registered yet
                        'invitation_sent' => $pending->invitation_sent,
                    ];
                });
            
            // Merge both collections
            $students = $students->merge($unregisteredPending);
        }

        return response()->json($students);
    }

    // Adviser accepts a pending student
    public function acceptPending(Request $request, $studentId)
    {
        $adviser = $request->user();

        // Fetch the student to verify relationship
        $student = User::findOrFail($studentId);

        // Check if already accepted or doesn't exist in pivot
        $exists = $adviser->advisedStudents()->where('student_id', $studentId)->exists();
        if (!$exists) {
            return response()->json(['error' => 'This student is not pending with you.'], 404);
        }

        // Check if already accepted
        $existingStatus = $adviser->advisedStudents()->where('student_id', $studentId)->first();
        if ($existingStatus && $existingStatus->pivot->status === 'accepted') {
            return response()->json(['error' => 'Student is already accepted.'], 409);
        }

        // Update pivot status to 'accepted'
        $adviser->advisedStudents()->updateExistingPivot($studentId, ['status' => 'accepted']);

        // Create notification for student
        Notification::create([
            'user_id' => $studentId,
            'type' => 'adviser_accepted',
            'title' => 'Adviser Accepted Your Request',
            'message' => "Your adviser request has been accepted by {$adviser->first_name} {$adviser->last_name}.",
            'action_url' => route('dashboard'),
        ]);

        // Notify coordinator(s) who oversee this adviser
        $coordinators = $adviser->coordinators()->get();
        foreach ($coordinators as $coordinator) {
            Notification::create([
                'user_id' => $coordinator->id,
                'type' => 'adviser_accepted_student',
                'title' => 'Adviser Accepted Student',
                'message' => "{$adviser->first_name} {$adviser->last_name} has accepted {$student->first_name} {$student->last_name} as advisee.",
                'action_url' => route('coordinator.adviser-list'),
            ]);
        }

        // Send email if send_email checkbox is checked
        $sendEmail = $request->input('send_email', false);
        if ($sendEmail) {
            Mail::to($student->email)->queue(new StudentAcceptedByAdviser($student, $adviser));
        }

        return response()->json(['success' => true]);
    }

    // Adviser rejects a pending student (marks rejected and sends email)
    public function rejectPending(Request $request, $studentId)
    {
        $adviser = $request->user();

        if (! $adviser->advisedStudents()->wherePivot('student_id', $studentId)->exists()) {
            return response()->json(['error' => 'Pending assignment not found.'], 404);
        }

        // Mark as rejected (do NOT delete)
        $adviser->advisedStudents()->updateExistingPivot($studentId, ['status' => 'rejected']);
        
        // Get student info
        $student = User::findOrFail($studentId);
        
        // Create notification for student
        Notification::create([
            'user_id' => $studentId,
            'type' => 'adviser_rejected',
            'title' => 'Adviser Declined Your Request',
            'message' => "Your adviser request was declined by {$adviser->first_name} {$adviser->last_name}.",
            'action_url' => route('dashboard'),
        ]);

        // Notify coordinator(s) who oversee this adviser
        $coordinators = $adviser->coordinators()->get();
        foreach ($coordinators as $coordinator) {
            Notification::create([
                'user_id' => $coordinator->id,
                'type' => 'adviser_rejected_student',
                'title' => 'Adviser Declined Student',
                'message' => "{$adviser->first_name} {$adviser->last_name} has declined {$student->first_name} {$student->last_name} as advisee.",
                'action_url' => route('coordinator.adviser-list'),
            ]);
        }
        
        // Check if email should be sent
        $sendEmail = $request->input('send_email', false);
        
        // Send rejection email to student only if requested
        if ($sendEmail) {
            try {
                $student = User::find($studentId);
                if ($student && $student->email) {
                    // Get the pivot data to find who assigned this student
                    $pivotStudent = $adviser->advisedStudents()->wherePivot('student_id', $studentId)->first();
                    $coordinatorId = $pivotStudent->pivot->requested_by ?? null;
                    
                    if ($coordinatorId) {
                        $coordinator = User::find($coordinatorId);
                        if ($coordinator) {
                            Mail::to($student->email)
                                ->queue(new \App\Mail\StudentRejectedByAdviser($student, $adviser, $coordinator));
                            
                            Log::info('Student Rejection: Email sent to student', [
                                'student_id' => $student->id,
                                'student_email' => $student->email,
                                'adviser_id' => $adviser->id,
                                'adviser_name' => trim(($adviser->first_name ?? '') . ' ' . ($adviser->last_name ?? '')),
                                'coordinator_id' => $coordinator->id
                            ]);
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::error('Student Rejection: Failed to send email to student', [
                    'student_id' => $studentId,
                    'adviser_id' => $adviser->id,
                    'error' => $e->getMessage()
                ]);
                // Don't fail the rejection if email fails
            }
        } else {
            Log::info('Student Rejection: Email sending skipped by adviser', [
                'student_id' => $studentId,
                'adviser_id' => $adviser->id
            ]);
        }
        
        return response()->json(['success' => true]);
    }

    // Direct attach by adviser (manual register)
    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|integer|exists:users,id'
        ]);

        $adviser = $request->user();
        $studentId = $request->input('student_id');

        if ($adviser->advisedStudents()->where('student_id', $studentId)->exists()) {
            return response()->json(['error' => 'Student is already registered with this adviser.'], 409);
        }

        $adviser->advisedStudents()->attach($studentId, ['status' => 'accepted']);
        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, $studentId)
    {
        $adviser = $request->user();
        $adviser->advisedStudents()->detach($studentId);
        return response()->json(['success' => true]);
    }

    public function getAdviserCode(Request $request)
    {
        $adviser = $request->user();
        if (!$adviser->adviser_code) {
            $adviser->generateAdviserCode();
        }
        return response()->json(['adviser_code' => $adviser->adviser_code]);
    }

    public function registerWithCode(Request $request)
    {
        $student = $request->user();
        $code = $request->input('adviser_code');
        $adviser = User::where('adviser_code', $code)->first();
        if (!$adviser) {
            return response()->json(['error' => 'Invalid code'], 404);
        }
        if ($adviser->advisedStudents()->where('student_id', $student->id)->exists()) {
            return response()->json(['error' => 'You are already registered with this adviser.'], 409);
        }
        try {
            $adviser->advisedStudents()->attach($student->id, ['status' => 'accepted']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage() ?? "Registration failed."], 500);
        }
        return response()->json(['success' => true]);
    }

    public function hasStudents(Request $request)
    {
        $user = $request->user();
        // Count all students where this user is the adviser, regardless of role
        $count = $user->advisedStudents()->count();
        return response()->json(['hasStudents' => $count > 0]);
    }
}
