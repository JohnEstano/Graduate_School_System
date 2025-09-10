<?php

namespace App\Http\Controllers;

use App\Models\StudentRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentRecordController extends Controller
{
    public function index(Request $request)
    {
        $records = StudentRecord::with('payments') // eager load payments
            ->when($request->input('search'), function ($query, $search) {
                $query->where('first_name', 'like', "%{$search}%")
                      ->orWhere('middle_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_id', 'like', "%{$search}%");
            })
            ->when($request->input('year'), function ($query, $year) {
                $query->where('school_year', $year);
            })
            ->when($request->input('program'), function ($query, $program) {
                $query->where('program', $program);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('student-records/Index', [
            'records' => $records,
            'filters' => $request->only(['search', 'year', 'program'])
        ]);
    }

    public function show(StudentRecord $studentRecord)
    {
        // Load related payments
        $studentRecord->load('payments');

        return Inertia::render('student-records/individual-records', [
            'record' => $studentRecord
        ]);
    }

    public function update(Request $request, StudentRecord $studentRecord)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => 'nullable|string|max:255',
            'program' => 'required|string|max:255',
            'school_year' => 'nullable|string|max:255',
            'student_id' => 'nullable|string|max:255',
            'course_section' => 'nullable|string|max:255',
            'birthdate' => 'nullable|date',
            'academic_status' => 'nullable|string|max:255',
            'or_number' => 'required|string|max:255',
            'payment_date' => 'required|date',
        ]);

        $studentRecord->update($request->all());

        return redirect()->back()->with('success', 'Record updated successfully.');
    }

    public function destroy(StudentRecord $studentRecord)
    {
        $studentRecord->delete();

        return redirect()->back()->with('success', 'Record deleted successfully.');
    }
}
