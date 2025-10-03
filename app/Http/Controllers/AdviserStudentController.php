<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdviserStudentController extends Controller
{
    public function index(Request $request)
    {
        $adviser = $request->user();
        $students = $adviser->advisedStudents()->get();
        return response()->json($students);
    }

    public function store(Request $request)
    {
        $adviser = $request->user();
        $studentId = $request->input('student_id');
        $adviser->advisedStudents()->attach($studentId);
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
            $adviser->advisedStudents()->attach($student->id);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage() ?? "Registration failed."], 500);
        }
        return response()->json(['success' => true]);
    }
}
