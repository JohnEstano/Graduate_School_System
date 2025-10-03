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
}
