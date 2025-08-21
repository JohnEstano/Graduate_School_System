<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequirement;
use Illuminate\Http\Request;

class DefenseRequirementController extends Controller
{
    public function index(Request $request)
    {
        $requirements = DefenseRequirement::where('user_id', auth()->id())->get();

        return inertia('student/submissions/defense-requirements/Index', [
            'defenseRequirements' => $requirements,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string',
            'middle_name' => 'nullable|string',
            'last_name' => 'required|string',
            'school_id' => 'required|string',
            'program' => 'required|string',
            'thesis_title' => 'required|string',
            'adviser' => 'required|string',
            'defense_type' => 'required|string', 
            'rec_endorsement' => 'nullable|file',
            'proof_of_payment' => 'nullable|file',
            'reference_no' => 'nullable|string',
            'manuscript_proposal' => 'nullable|file',
            'similarity_index' => 'nullable|file',
        ]);

        // Handle file uploads
        foreach (['rec_endorsement', 'proof_of_payment', 'manuscript_proposal', 'similarity_index'] as $file) {
            if ($request->hasFile($file)) {
                $data[$file] = $request->file($file)->store('defense_requirements');
            }
        }
        $data['user_id'] = auth()->id();
        $data['status'] = 'pending'; // <-- Ensure status is set

        DefenseRequirement::create($data);

        return redirect()->back()->with('success', 'Defense requirements submitted!');
    }
}
