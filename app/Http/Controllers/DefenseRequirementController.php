<?php

namespace App\Http\Controllers;

use App\Models\DefenseRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class DefenseRequirementController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $requirements = DefenseRequest::where('submitted_by', Auth::id())->orderByDesc('created_at')->get();
        $defenseRequest = DefenseRequest::where('school_id', $user->school_id)->latest()->first();

        $acceptDefense = DB::table('settings')->where('key', 'accept_defense')->value('value');
        $acceptDefense = $acceptDefense === null ? true : $acceptDefense === '1';

        return inertia('student/submissions/defense-requirements/Index', [
            'defenseRequirements' => $requirements->map(function($r) {
                return [
                    'id' => $r->id,
                    'first_name' => $r->first_name,
                    'middle_name' => $r->middle_name,
                    'last_name' => $r->last_name,
                    'school_id' => $r->school_id,
                    'program' => $r->program,
                    'thesis_title' => $r->thesis_title,
                    'adviser' => $r->defense_adviser ?: '—',
                    'status' => $r->status ?? 'Pending',
                    'workflow_state' => $r->workflow_state,
                    'created_at' => $r->created_at?->toIso8601String(),
                    'manuscript_proposal' => $r->manuscript_proposal,
                    'similarity_index' => $r->similarity_index,
                    'rec_endorsement' => $r->rec_endorsement,
                    'proof_of_payment' => $r->proof_of_payment,
                    'defense_type' => $r->defense_type,
                    'avisee_adviser_attachment' => $r->avisee_adviser_attachment, // <-- ADD THIS LINE
                ];
            }),
            'defenseRequest' => $defenseRequest,
            'acceptDefense' => $acceptDefense,
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'middle_name' => $user->middle_name,
                    'last_name' => $user->last_name,
                    'school_id' => $user->school_id,
                    'program' => $user->program,
                    'email' => $user->email,
                    'advisers' => $user->advisers()->get(['id','first_name','middle_name','last_name','email','adviser_code']),
                ],
            ],
        ]);
    }

    public function all(Request $request)
    {
        $user = Auth::user();
        if (!$user) abort(401);

        // Show all requests where this user is adviser or assigned
        $requests = DefenseRequest::where(function($q) use ($user) {
            $q->where('adviser_user_id', $user->id)
              ->orWhere('assigned_to_user_id', $user->id)
              ->orWhereRaw('LOWER(defense_adviser) = ?', [strtolower(trim($user->first_name . ' ' . $user->last_name))]);
        })
        // Exclude cancelled workflow_state or status
        ->where('workflow_state', '!=', 'cancelled')
        ->where(function($q) {
            $q->whereNull('status')->orWhere('status', '!=', 'Cancelled');
        })
        ->orderByDesc('created_at')
        ->get();

        return inertia('adviser/defense-requirements/Index', [
            'defenseRequirements' => [],
            'defenseRequests' => $requests,
            'coordinator' => null,
        ]);
    }

    public function store(Request $request)
    {
        $acceptDefense = DB::table('settings')->where('key', 'accept_defense')->value('value');
        $acceptDefense = $acceptDefense === null ? true : $acceptDefense === '1'; // <-- FIXED
        if (!$acceptDefense) {
            return back()->withErrors(['message' => 'Defense requirement submissions are currently closed.']);
        }

        // Early upload error interception
        foreach (['rec_endorsement','proof_of_payment','manuscript_proposal','similarity_index'] as $fileField) {
            if ($request->hasFile($fileField)) {
                $err = $request->file($fileField)->getError();
                if ($err !== UPLOAD_ERR_OK) {
                    return back()->withErrors([
                        $fileField => 'File upload failed (code '.$err.'). Please retry.'
                    ])->withInput();
                }
            }
        }

        $maxFileSize = config('upload.max_file_size_kb', 204800);
        $allowedMimes = implode(',', config('upload.allowed_extensions', ['pdf','doc','docx','jpg','jpeg','png']));

        $data = $request->validate([
            'first_name' => 'required|string',
            'middle_name' => 'nullable|string',
            'last_name' => 'required|string',
            'school_id' => 'required|string',
            'program' => 'required|string',
            'thesis_title' => 'required|string',
            'adviser' => 'required|string',
            'adviser_id' => 'nullable|integer|exists:users,id',
            'defense_type' => 'required|string',
            'rec_endorsement' => "nullable|file|mimes:{$allowedMimes}|max:{$maxFileSize}",
            'proof_of_payment' => "nullable|file|mimes:{$allowedMimes}|max:{$maxFileSize}",
            'reference_no' => 'nullable|string|max:150',
            'manuscript_proposal' => "nullable|file|mimes:pdf,doc,docx|max:{$maxFileSize}",
            'similarity_index' => "nullable|file|mimes:{$allowedMimes}|max:{$maxFileSize}",
            'avisee_adviser_attachment' => "nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:{$maxFileSize}",
            'amount' => 'required|numeric|min:0', // <-- Add this line
        ]);

        foreach (['rec_endorsement','proof_of_payment','manuscript_proposal','similarity_index','avisee_adviser_attachment'] as $f) {
            if ($request->hasFile($f)) {
                try {
                    $uploaded = $request->file($f);
                    Log::info('File upload attempt', [
                        'field'=>$f,
                        'name'=>$uploaded->getClientOriginalName(),
                        'size'=>$uploaded->getSize(),
                        'user'=>Auth::id()
                    ]);
                    $data[$f] = $uploaded->store('defense_requirements','public');
                } catch (\Throwable $e) {
                    Log::error('Upload failed', ['field'=>$f,'err'=>$e->getMessage()]);
                    return back()->withErrors([$f=>'Failed to store file. Try again.'])->withInput();
                }
            }
        }

        try {
            $defenseRequestData = [
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'] ?? null,
                'last_name' => $data['last_name'],
                'school_id' => $data['school_id'],
                'program' => $data['program'],
                'thesis_title' => $data['thesis_title'],
                'defense_type' => $data['defense_type'],
                'defense_adviser' => $data['adviser'],
                'adviser_user_id' => $data['adviser_id'] ?? null,
                'assigned_to_user_id' => $data['adviser_id'] ?? null,
                'rec_endorsement' => $data['rec_endorsement'] ?? null,
                'proof_of_payment' => $data['proof_of_payment'] ?? null,
                'reference_no' => $data['reference_no'] ?? null,
                'manuscript_proposal' => $data['manuscript_proposal'] ?? null,
                'similarity_index' => $data['similarity_index'] ?? null,
                'avisee_adviser_attachment' => $data['avisee_adviser_attachment'] ?? null,
                'amount' => $data['amount'], // <-- Add this line
                'submitted_by' => Auth::id(),
                'submitted_at' => now(),
                'status' => 'Pending',
                'priority' => 'Medium',
                'workflow_state' => 'submitted',
            ];

            // If adviser_id is not present, fallback to name mapping
            if (!$defenseRequestData['adviser_user_id'] && $defenseRequestData['defense_adviser']) {
                $normalized = preg_replace('/\s+/',' ', strtolower($defenseRequestData['defense_adviser']));
                $match = \App\Models\User::whereIn('role',['Faculty','Adviser'])
                    ->get()
                    ->first(function($u) use ($normalized) {
                        $combo1 = strtolower($u->first_name.' '.$u->last_name);
                        $combo2 = strtolower($u->last_name.', '.$u->first_name);
                        return str_contains($normalized,$combo1) || str_contains($normalized,$combo2);
                    });
                if ($match) {
                    $defenseRequestData['adviser_user_id'] = $match->id;
                    $defenseRequestData['assigned_to_user_id'] = $match->id;
                    $defenseRequestData['workflow_state'] = 'adviser-review';
                }
            }

            $dr = DefenseRequest::create($defenseRequestData);
            $dr->addWorkflowEntry(
                'submitted',
                'Defense request submitted by student',
                Auth::id(),
                null,
                'submitted'
            )->save();

        } catch (\Throwable $e) {
            Log::error('Defense request create failed', ['err'=>$e->getMessage()]);
            return back()->with('error','Failed to submit defense requirements.');
        }

        return back()->with('success','Defense requirements submitted.');
    }

    public function unsubmit(Request $request, $id)
    {
        $dr = DefenseRequest::findOrFail($id);
        if ($dr->submitted_by !== Auth::id()) {
            return response()->json(['success'=>false,'message'=>'Unauthorized'],403);
        }

        $allowedWorkflow = ['submitted','adviser-review'];
        $wf = strtolower($dr->workflow_state ?? '');
        $status = strtolower($dr->status ?? '');

        if (!($status === 'pending' || in_array($wf,$allowedWorkflow))) {
            return response()->json([
                'success'=>false,
                'message'=>'You can only unsubmit while pending or under adviser review.'
            ],403);
        }

        $reason = trim($request->input('reason','(no reason provided)'));

        $from = $dr->workflow_state;
        $dr->status = 'Cancelled';
        $dr->workflow_state = 'cancelled';
        $dr->last_status_updated_at = now();
        $dr->last_status_updated_by = Auth::id();
        $dr->addWorkflowEntry(
            'cancelled',
            'Student unsubmitted: '.$reason,
            Auth::id(),
            $from,
            'cancelled'
        )->save();

        return response()->json(['success'=>true]);
    }
}
