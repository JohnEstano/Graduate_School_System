<?php

namespace App\Http\Controllers;

use App\Models\{GeneratedDocument,DefenseRequest,DocumentTemplate};
use App\Services\DocumentGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GeneratedDocumentController extends Controller {

  public function show(GeneratedDocument $doc) {
    $user = \Illuminate\Support\Facades\Auth::user();
    
    if (!$user) {
        abort(403, 'Unauthorized access');
    }

    // SECURITY: Get the defense request associated with this document
    $defenseRequest = $doc->defenseRequest;
    
    if (!$defenseRequest) {
        abort(404, 'Associated defense request not found');
    }

    // AUTHORIZATION: Check if user has permission to access this document
    $hasAccess = false;

    // 1. Student who submitted the request
    if ($user->id === $defenseRequest->submitted_by) {
        $hasAccess = true;
    }

    // 2. Adviser assigned to this defense
    if ($user->id === $defenseRequest->adviser_user_id) {
        $hasAccess = true;
    }

    // 3. Coordinator assigned to this defense
    if ($user->id === $defenseRequest->coordinator_user_id) {
        $hasAccess = true;
    }

    // 4. Panelists assigned to this defense
    $panelistUserIds = [];
    foreach (['defense_chairperson', 'defense_panelist1', 'defense_panelist2', 'defense_panelist3', 'defense_panelist4'] as $field) {
        $value = $defenseRequest->$field;
        if ($value && is_numeric($value)) {
            $panelist = \App\Models\Panelist::find($value);
            if ($panelist && $panelist->user_id) {
                $panelistUserIds[] = $panelist->user_id;
            }
        }
    }
    if (in_array($user->id, $panelistUserIds)) {
        $hasAccess = true;
    }

    // 5. Administrative Assistant or Dean
    if (in_array($user->role, ['Administrative Assistant', 'Dean'])) {
        $hasAccess = true;
    }

    // 6. Coordinators can access approved requests
    if ($user->role === 'Coordinator' && in_array($defenseRequest->workflow_state, [
        'coordinator-approved', 'panels-assigned', 'scheduled', 'completed'
    ])) {
        $hasAccess = true;
    }

    if (!$hasAccess) {
        abort(403, 'You do not have permission to access this document');
    }

    return Storage::download($doc->output_path);
  }

  // Manual trigger for a single defense request (debug)
  public function generateNow(Request $r, DefenseRequest $defenseRequest, DocumentGenerator $gen) {
    $templates = DocumentTemplate::all();
    $out = [];
    foreach ($templates as $tpl) {
      $out[] = $gen->generate($tpl, $defenseRequest);
    }
    return response()->json(['generated'=>$out]);
  }

  // List docs for a defense request
  public function listForRequest(DefenseRequest $defenseRequest) {
    return response()->json($defenseRequest->generatedDocuments()->with('template')->get());
  }

  public function generateDocument(\Illuminate\Http\Request $request)
  {
      $request->validate([
          'template_id' => 'required|integer|exists:document_templates,id',
          'defense_request_id' => 'required|integer|exists:defense_requests,id',
          'fields' => 'array',
          'role' => 'nullable|in:adviser,coordinator', // Add role parameter
      ]);

      $tpl = \App\Models\DocumentTemplate::findOrFail($request->template_id);
      $defenseRequest = \App\Models\DefenseRequest::findOrFail($request->defense_request_id);

      $generator = new \App\Services\DocumentGenerator();
      
      try {
          // Pass role to generator for field filtering
          $generated = $generator->generate(
              $tpl, 
              $defenseRequest, 
              $request->fields ?? [],
              $request->role ?? null
          );
          
          $pdfPath = storage_path('app/public/' . $generated->output_path);
          
          if (!file_exists($pdfPath)) {
              \Log::error("Generated PDF not found at path: $pdfPath");
              return response()->json([
                  'ok' => false,
                  'error' => 'Generated PDF file not found'
              ], 500);
          }

          // Return PDF as binary stream for download
          $filename = 'endorsement_form_' . $defenseRequest->id . '_' . time() . '.pdf';
          
          return response()->file($pdfPath, [
              'Content-Type' => 'application/pdf',
              'Content-Disposition' => 'attachment; filename="' . $filename . '"',
          ]);
          
      } catch (\Throwable $e) {
          \Log::error('Document generation failed: ' . $e->getMessage(), [
              'trace' => $e->getTraceAsString()
          ]);
          return response()->json([
              'ok' => false,
              'error' => 'Document generation failed: ' . $e->getMessage()
          ], 500);
      }
  }
}
