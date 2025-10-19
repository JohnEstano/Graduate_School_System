<?php

namespace App\Http\Controllers;

use App\Models\{GeneratedDocument,DefenseRequest,DocumentTemplate};
use App\Services\DocumentGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GeneratedDocumentController extends Controller {

  public function show(GeneratedDocument $doc) {
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
      ]);

      $tpl = \App\Models\DocumentTemplate::findOrFail($request->template_id);
      $defenseRequest = \App\Models\DefenseRequest::findOrFail($request->defense_request_id);

      $generator = new \App\Services\DocumentGenerator();
      $generated = $generator->generate($tpl, $defenseRequest, $request->fields ?? []);

      $pdfPath = storage_path('app/public/' . $generated->output_path);

      return response()->download($pdfPath, 'endorsement_form.pdf')->deleteFileAfterSend(false);
  }
}
