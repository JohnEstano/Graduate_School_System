<?php

namespace App\Http\Controllers;

use App\Models\DocumentTemplate;
use App\Models\DefenseRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentTemplateController extends Controller {

  public function index() {
    $list = DocumentTemplate::orderBy('created_at','desc')->get();
    return response()->json($list);
  }

  public function show(DocumentTemplate $template) {
    return response()->json($template);
  }

  public function store(Request $r) {
    \Log::info('DocumentTemplateController@store called', ['user_id' => $r->user()->id]);
    $data = $r->validate([
      'name'=>'required|string',
      'file'=>'required|file|mimes:pdf|max:10240',
    ]);
    $code = \Str::slug($data['name']) . '-' . uniqid();
    $path = $r->file('file')->store('templates', 'public');
    $tpl = DocumentTemplate::create([
      'name'=>$data['name'],
      'code'=>$code,
      'file_path'=>$path,
      'page_count'=>1,
      'created_by'=>$r->user()->id,
    ]);
    return response()->json($tpl);
  }

  public function updateFields(Request $r, DocumentTemplate $template) {
    $payload = $r->validate(['fields'=>'required|array']);
    $template->fields = $payload['fields'];
    $template->version++;
    $template->save();
    return response()->json(['ok'=>true,'version'=>$template->version]);
  }

  public function destroy(DocumentTemplate $template) {
    Storage::disk('public')->delete($template->file_path);
    $template->delete();
    return response()->json(['ok'=>true]);
  }
  public function generate(Request $r)
  {
      $data = $r->validate([
          'template_id' => 'required|integer|exists:document_templates,id',
          'defense_request_id' => 'required|integer|exists:defense_requests,id',
          'fields' => 'nullable|array'
      ]);
      $tpl = \App\Models\DocumentTemplate::findOrFail($data['template_id']);
      $req = \App\Models\DefenseRequest::findOrFail($data['defense_request_id']);

      // Pass key-value overrides to DocumentGenerator
      $doc = app(\App\Services\DocumentGenerator::class)->generate($tpl, $req, $data['fields'] ?? []);

      // Make sure $doc->output_path is set in DocumentGenerator
      return response()->json([
          'ok' => true,
          'download_url' => \Storage::url($doc->output_path)
      ]);
  }
}
