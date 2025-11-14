<?php

namespace App\Http\Controllers;

use App\Models\DocumentTemplate;
use App\Models\DefenseRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class DocumentTemplateController extends Controller {

  public function index() {
    $list = DocumentTemplate::orderBy('created_at','desc')->get();
    return response()->json($list);
  }

  public function show(DocumentTemplate $template) {
    return response()->json($template);
  }

  public function store(Request $r) {
    Log::info('DocumentTemplateController@store called', ['user_id' => $r->user()->id]);
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

  public function updateFields(Request $request, DocumentTemplate $template)
  {
      $template->fields = $request->input('fields', []);
      $template->fields_meta = $request->input('fields_meta', []);
      $template->save();

      return response()->json(['ok' => true]);
  }

  public function destroy(DocumentTemplate $template) {
    Storage::disk('public')->delete($template->file_path);
    $template->delete();
    return response()->json(['ok'=>true]);
  }

  public function generate(Request $request)
  {
      $request->validate([
          'template_id' => 'required|integer|exists:document_templates,id',
          'defense_request_id' => 'required|integer|exists:defense_requests,id',
          'fields' => 'array',
      ]);

      $template = \App\Models\DocumentTemplate::findOrFail($request->template_id);
      $defenseRequest = \App\Models\DefenseRequest::findOrFail($request->defense_request_id);

      $generator = new \App\Services\DocumentGenerator();
      try {
          $generated = $generator->generate($template, $defenseRequest, $request->fields ?? []);
          
          // Return the URL to download the generated document
          $url = $generated->output_path
              ? \Storage::disk('public')->url($generated->output_path)
              : null;

          return response()->json([
              'ok' => true,
              'download_url' => $url,
              'generated_id' => $generated->id,
          ]);
      } catch (\Throwable $e) {
          \Log::error('Document generation failed: '.$e->getMessage(), [
              'trace' => $e->getTraceAsString()
          ]);
          return response()->json([
              'ok' => false,
              'error' => 'Document generation failed: '.$e->getMessage(),
          ], 500);
      }
  }
}
