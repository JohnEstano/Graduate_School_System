<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use App\Models\Notification;
use App\Models\User;
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

        $defenseRequest = DefenseRequest::latest()->first();


        $recipients = User::whereIn('role', ['Coordinator', 'Administrative Assistant'])->get();

        foreach ($recipients as $recipient) {
            Notification::create([
                'user_id' => $recipient->id,
                'type' => 'defense-request',
                'title' => 'New Defense Request Submitted',
                'message' => "{$defenseRequest->first_name} {$defenseRequest->last_name} submitted a new defense request for review.",
                'link' => url("/defense-request/{$defenseRequest->id}"),
            ]);
        }

        return Redirect::back()->with('success', 'Your defense request has been submitted!');
    }

    public function updateStatus(Request $request, DefenseRequest $defenseRequest)
    {
        $request->validate([
            'status' => 'required|in:Pending,In progress,Approved,Rejected,Needs-info',
        ]);
        $defenseRequest->update([
            'status' => $request->status,
            'last_status_updated_at' => now()->setTimezone('Asia/Manila'),
            'last_status_updated_by' => auth()->id(),
        ]);

        $defenseRequest->load('lastStatusUpdater');
        $student = User::where('school_id', $defenseRequest->school_id)->first();
        if ($student) {
            Notification::create([
                'user_id' => $student->id,
                'type' => 'defense-request',
                'title' => 'Defense Request Status Updated',
                'message' => "Your defense request has been {$defenseRequest->status}.",
                'link' => url("/defense-request/{$defenseRequest->id}"),
            ]);
        }
        return response()->json([
            'success' => true,
            'status' => $defenseRequest->status,
            'last_status_updated_by' => $defenseRequest->lastStatusUpdater?->name,
            'last_status_updated_at' => optional($defenseRequest->last_status_updated_at)->setTimezone('Asia/Manila')->toISOString(),
        ]);
    }

    public function updatePriority(Request $request, DefenseRequest $defenseRequest)
    {
        $request->validate([
            'priority' => 'required|in:Low,Medium,High',
        ]);
        $defenseRequest->update([
            'priority' => $request->priority,
            'last_status_updated_at' => now()->setTimezone('Asia/Manila'),
            'last_status_updated_by' => auth()->id(),
        ]);
        $defenseRequest->load('lastStatusUpdater');
        return response()->json([
            'success' => true,
            'priority' => $defenseRequest->priority,
            'last_status_updated_by' => $defenseRequest->lastStatusUpdater?->name,
            'last_status_updated_at' => optional($defenseRequest->last_status_updated_at)->setTimezone('Asia/Manila')->toISOString(),
        ]);
    }

    public function bulkUpdateStatus(Request $request)
    {
        \Log::info('Bulk status update request', $request->all());

        $validator = \Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
            'status' => 'required|in:Pending,In progress,Approved,Rejected,Needs-info',
        ]);
        if ($validator->fails()) {
            \Log::error('Bulk status update validation failed', [
                'errors' => $validator->errors()->all(),
                'request' => $request->all()
            ]);
            return response()->json(['error' => $validator->errors()->first()], 422);
        }
        $ids = $request->ids;
        if (empty($ids) || !is_array($ids)) {
            \Log::error('Bulk status update: No IDs provided or not array', ['ids' => $ids, 'request' => $request->all()]);
            return response()->json(['error' => 'No IDs provided'], 400);
        }
        try {
            $updateCount = DefenseRequest::whereIn('id', $ids)->update([
                'status' => $request->status,
                'last_status_updated_at' => now()->setTimezone('Asia/Manila'),
                'last_status_updated_by' => auth()->id(),
            ]);
            \Log::info('Bulk status update DB result', ['updateCount' => $updateCount, 'ids' => $ids]);
            $updated = DefenseRequest::with('lastStatusUpdater')->whereIn('id', $ids)->get();
            $result = $updated->map(function ($item) {
                $lastStatusUpdatedAt = null;
                if ($item->last_status_updated_at) {
                    if ($item->last_status_updated_at instanceof \Carbon\Carbon) {
                        $lastStatusUpdatedAt = $item->last_status_updated_at->setTimezone('Asia/Manila')->toISOString();
                    } else {

                        $lastStatusUpdatedAt = $item->last_status_updated_at;
                    }
                }
                return [
                    'id' => $item->id,
                    'status' => $item->status,
                    'last_status_updated_by' => $item->lastStatusUpdater?->name,
                    'last_status_updated_at' => $lastStatusUpdatedAt,
                ];
            });
            \Log::info('Bulk status update result', ['ids' => $ids, 'result' => $result]);
            return response()->json($result);
        } catch (\Throwable $e) {
            \Log::error('Bulk status update error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json(['error' => 'Bulk update failed', 'details' => $e->getMessage()], 500);
        }
    }

    public function bulkUpdatePriority(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'priority' => 'required|in:Low,Medium,High',
        ]);
        $ids = $request->ids;
        DefenseRequest::whereIn('id', $ids)->update([
            'priority' => $request->priority,
            'last_status_updated_at' => now()->setTimezone('Asia/Manila'),
            'last_status_updated_by' => auth()->id(),
        ]);

        $updated = DefenseRequest::with('lastStatusUpdater')->whereIn('id', $ids)->get();
        $result = $updated->map(function ($item) {
            $lastStatusUpdatedAt = null;
            if ($item->last_status_updated_at) {
                if ($item->last_status_updated_at instanceof \Carbon\Carbon) {
                    $lastStatusUpdatedAt = $item->last_status_updated_at->setTimezone('Asia/Manila')->toISOString();
                } else {
                    $lastStatusUpdatedAt = $item->last_status_updated_at;
                }
            }
            return [
                'id' => $item->id,
                'priority' => $item->priority,
                'last_status_updated_by' => $item->lastStatusUpdater?->name,
                'last_status_updated_at' => $lastStatusUpdatedAt,
            ];
        });
        return response()->json($result);
    }

    public function count()
    {
        $count = DefenseRequest::where('status', 'Pending')->count();
        return response()->json(['count' => $count]);
    }

    public function calendar()
    {
        return \App\Models\DefenseRequest::select('id', 'thesis_title', 'date_of_defense', 'status')
            ->get();
    }
}