<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\DefenseRequest;

class StudentDocumentController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Get all defense requests by this student
        $requests = DefenseRequest::where('submitted_by', $user->id)->orderByDesc('created_at')->get();

        // List of file fields to check
        $fileFields = [
            'manuscript_proposal' => 'Manuscript Proposal',
            'similarity_index' => 'Similarity Index',
            'rec_endorsement' => 'REC Endorsement',
            'proof_of_payment' => 'Proof of Payment',
            'avisee_adviser_attachment' => 'Avisee-Adviser Attachment',
        ];

        $files = [];
        foreach ($requests as $req) {
            foreach ($fileFields as $field => $label) {
                $path = $req->$field;
                if ($path) {
                    $fullPath = "public/{$path}";
                    $exists = Storage::exists($fullPath);
                    $size = $exists ? Storage::size($fullPath) : null;
                    $files[] = [
                        'id' => $req->id,
                        'defense_title' => $req->thesis_title,
                        'defense_type' => $req->defense_type,
                        'field' => $field,
                        'label' => $label,
                        'filename' => basename($path),
                        'path' => $path,
                        'url' => Storage::url($path),
                        'size' => $size,
                        'submitted_at' => $req->created_at?->toIso8601String(),
                    ];
                }
            }
        }

        return inertia('student/documents/Index', [
            'files' => $files,
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'school_id' => $user->school_id,
                ],
            ],
        ]);
    }
}
