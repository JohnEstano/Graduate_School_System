<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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
                return [
                    'id' => $s->id,
                    'student_number' => $s->student_number ?? null,
                    'first_name' => $s->first_name ?? null,
                    'middle_name' => $s->middle_name ?? null,
                    'last_name' => $s->last_name ?? null,
                    'email' => $s->email ?? null,
                    'program' => $s->program ?? null,
                ];
            })->values();

        return response()->json($students);
    }

    // Return pending assignments (adviser view)
    public function pending(Request $request)
    {
        $adviser = $request->user();
        $students = $adviser->advisedStudents()
            ->wherePivot('status', 'pending')
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'student_number' => $s->student_number ?? null,
                    'first_name' => $s->first_name ?? null,
                    'middle_name' => $s->middle_name ?? null,
                    'last_name' => $s->last_name ?? null,
                    'email' => $s->email ?? null,
                    'program' => $s->program ?? null,
                    'requested_by' => $s->pivot->requested_by ?? null,
                    'requested_at' => $s->pivot->created_at ?? null,
                ];
            })->values();

        return response()->json($students);
    }

    // Adviser accepts a pending student
    public function acceptPending(Request $request, $studentId)
    {
        $adviser = $request->user();

        if (! $adviser->advisedStudents()->wherePivot('student_id', $studentId)->exists()) {
            return response()->json(['error' => 'Pending assignment not found.'], 404);
        }

        $adviser->advisedStudents()->updateExistingPivot($studentId, ['status' => 'accepted']);
        return response()->json(['success' => true]);
    }

    // Adviser rejects a pending student (marks rejected)
    public function rejectPending(Request $request, $studentId)
    {
        $adviser = $request->user();

        if (! $adviser->advisedStudents()->wherePivot('student_id', $studentId)->exists()) {
            return response()->json(['error' => 'Pending assignment not found.'], 404);
        }

        // Option: change to detach(...) if you prefer removal
        $adviser->advisedStudents()->updateExistingPivot($studentId, ['status' => 'rejected']);
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
