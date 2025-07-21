<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\DefenseRequest;
use Illuminate\Support\Facades\Redirect;

class DefenseRequestController extends Controller
{
    public function index()
    {
        $defenseRequest = DefenseRequest::where('school_id', auth()->user()->school_id)
            ->latest()
            ->first();

        return Inertia::render('submissions/defense-request/Index', [
            'defenseRequest' => $defenseRequest,
        ]);
        
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'firstName' => 'required|string',
            'middleName' => 'nullable|string',
            'lastName' => 'required|string',
            'schoolId' => 'required|string',
            'program' => 'required|string',
            'thesisTitle' => 'required|string',
            'date' => 'required|date',
            'modeDefense' => 'required|string',
            'defenseType' => 'required|string',
            'defenseAdviser' => 'required|string',
            'defenseChairperson' => 'required|string',
            'defensePanelist1' => 'required|string',
            'defensePanelist2' => 'nullable|string',
            'defensePanelist3' => 'nullable|string',
            'defensePanelist4' => 'nullable|string',
            'advisersEndorsement' => 'nullable|file',
            'recEndorsement' => 'nullable|file',
            'proofOfPayment' => 'nullable|file',
            'referenceNo' => 'nullable|file',
        ]);

        foreach ([
            'advisersEndorsement',
            'recEndorsement',
            'proofOfPayment',
            'referenceNo',
        ] as $field) {
            if ($request->hasFile($field)) {
                $data[$field] = $request->file($field)->store('defense-attachments');
            }
        }

        DefenseRequest::create([
            'first_name' => $data['firstName'],
            'middle_name' => $data['middleName'],
            'last_name' => $data['lastName'],
            'school_id' => $data['schoolId'],
            'program' => $data['program'],
            'thesis_title' => $data['thesisTitle'],
            'date_of_defense' => $data['date'],
            'mode_defense' => $data['modeDefense'],
            'defense_type' => $data['defenseType'],
            'advisers_endorsement' => $data['advisersEndorsement'] ?? null,
            'rec_endorsement' => $data['recEndorsement'] ?? null,
            'proof_of_payment' => $data['proofOfPayment'] ?? null,
            'reference_no' => $data['referenceNo'] ?? null,
            'defense_adviser' => $data['defenseAdviser'],
            'defense_chairperson' => $data['defenseChairperson'],
            'defense_panelist1' => $data['defensePanelist1'],
            'defense_panelist2' => $data['defensePanelist2'] ?? null,
            'defense_panelist3' => $data['defensePanelist3'] ?? null,
            'defense_panelist4' => $data['defensePanelist4'] ?? null,
        ]);


        return Redirect::back()
            ->with('success', 'Your defense request has been submitted!');
    }
}
