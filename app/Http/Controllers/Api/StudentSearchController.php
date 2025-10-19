<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StudentSearchController extends Controller
{
    /**
     * Search for students by name, email, or student ID
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q', '');
        
        if (strlen($query) < 2) {
            return response()->json([]);
        }
        
        $students = User::where('role', 'Student')
            ->where(function ($q) use ($query) {
                $q->where('first_name', 'LIKE', "%{$query}%")
                  ->orWhere('last_name', 'LIKE', "%{$query}%")
                  ->orWhere('email', 'LIKE', "%{$query}%")
                  ->orWhere('school_id', 'LIKE', "%{$query}%")
                  ->orWhere('student_number', 'LIKE', "%{$query}%");
                  
                // Also search for full name combinations
                $searchTerms = explode(' ', $query);
                if (count($searchTerms) > 1) {
                    foreach ($searchTerms as $term) {
                        if (strlen($term) > 1) {
                            $q->orWhere('first_name', 'LIKE', "%{$term}%")
                              ->orWhere('last_name', 'LIKE', "%{$term}%");
                        }
                    }
                }
            })
            ->select([
                'id',
                'first_name',
                'middle_name', 
                'last_name',
                'email',
                'school_id',
                'student_number',
                'program'
            ])
            ->limit(10)
            ->get()
            ->map(function ($student) {
                $middleInitial = $student->middle_name ? strtoupper(substr($student->middle_name, 0, 1)) . '. ' : '';
                return [
                    'id' => $student->id,
                    'email' => $student->email,
                    'school_id' => $student->school_id,
                    'student_number' => $student->student_number,
                    'program' => $student->program,
                    'display_name' => trim("{$student->first_name} {$middleInitial}{$student->last_name}"),
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                ];
            });
            
        return response()->json($students);
    }
}