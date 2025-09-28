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
        $adviser->advisedStudents()->attach($student->id);
        return response()->json(['success' => true]);
    }
}
