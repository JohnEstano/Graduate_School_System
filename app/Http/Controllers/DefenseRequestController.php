<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class DefenseRequestController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $props = [];

        if (in_array($user->role, ['Administrative Assistant', 'Coordinator', 'Dean'])) {
            $defenseRequests = DefenseRequest::with('lastStatusUpdater')->get();
            // Map user name
            $defenseRequests->transform(function ($item) {
                $item->last_status_updated_by = $item->lastStatusUpdater?->name;
                return $item;
            });
            $props['defenseRequests'] = $defenseRequests;
        } else {
            $defenseRequest = DefenseRequest::with('lastStatusUpdater')
                ->where('school_id', $user->school_id)
                ->latest()
                ->first();
            if ($defenseRequest) {
                $defenseRequest->last_status_updated_by = $defenseRequest->lastStatusUpdater?->name;
            }
            $props['defenseRequest'] = $defenseRequest;
        }

        $viewMap = [
            'Student' => 'student/submissions/defense-request/Index',
            'Administrative Assistant' => 'aa/submissions/defense-request/Index',
            'Coordinator' => 'coordinator/submissions/defense-request/Index',
            'Dean' => 'dean/submissions/defense-request/Index',
        ];

        $view = $viewMap[$user->role] ?? 'student/submissions/defense-request/Index';

        return Inertia::render($view, $props);
    }

    public function review(DefenseRequest $defenseRequest, Request $request)
    {
        $request->validate([
            'action' => 'required|in:approve,reject,needs-info',
        ]);

        $defenseRequest->update([
            'status' => $request->action,
        ]);

        return back()->with('success', 'Status updated successfully');
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

        return Redirect::back()->with('success', 'Your defense request has been submitted!');
    }

    public function updateStatus(Request $request, DefenseRequest $defenseRequest)
    {
        $request->validate([
            'status' => 'required|in:Pending,In progress,Approved,Rejected,Needs-info',
        ]);
        $defenseRequest->update([
            'status' => $request->status,
            'last_status_updated_at' => now(),
            'last_status_updated_by' => auth()->id(),
        ]);
        // Eager load user for response
        $defenseRequest->load('lastStatusUpdater');
        return response()->json([
            'success' => true,
            'status' => $defenseRequest->status,
            'last_status_updated_by' => $defenseRequest->lastStatusUpdater?->name,
            'last_status_updated_at' => $defenseRequest->last_status_updated_at,
        ]);
    }

    public function updatePriority(Request $request, DefenseRequest $defenseRequest)
    {
        $request->validate([
            'priority' => 'required|in:Low,Medium,High',
        ]);
        $defenseRequest->update([
            'priority' => $request->priority,
            'last_status_updated_at' => now(),
            'last_status_updated_by' => auth()->id(),
        ]);
        $defenseRequest->load('lastStatusUpdater');
        return response()->json([
            'success' => true,
            'priority' => $defenseRequest->priority,
            'last_status_updated_by' => $defenseRequest->lastStatusUpdater?->name,
            'last_status_updated_at' => $defenseRequest->last_status_updated_at,
        ]);
    }

    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'status' => 'required|in:Pending,In progress,Approved,Rejected,Needs-info',
        ]);
        DefenseRequest::whereIn('id', $request->ids)->update([
            'status' => $request->status,
            'last_status_updated_at' => now(),
            'last_status_updated_by' => auth()->id(),
        ]);
        return response()->json(['success' => true]);
    }

    public function bulkUpdatePriority(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'priority' => 'required|in:Low,Medium,High',
        ]);
        DefenseRequest::whereIn('id', $request->ids)->update([
            'priority' => $request->priority,
            'last_status_updated_at' => now(),
            'last_status_updated_by' => auth()->id(),
        ]);
        return response()->json(['success' => true]);
    }

    public function count()
    {
        $count = DefenseRequest::where('status', 'Pending')->count();
        return response()->json(['count' => $count]);
    }

    public function calendar()
    {
        return \App\Models\DefenseRequest::where('status', 'Approved')
            ->select('id', 'thesis_title', 'date_of_defense')
            ->get();
    }
}
