<?php

namespace App\Http\Controllers;

use App\Models\DocumentTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentTemplateController extends Controller {

  public function index() {
    $list = DocumentTemplate::orderBy('created_at','desc')->get();
    return response()->json($list);
  }

  public function store(Request $r) {
    $data = $r->validate([
      'name'=>'required|string',
      'code'=>'required|string|unique:document_templates,code',
      'defense_type'=>'nullable|string',
      'file'=>'required|file|mimes:pdf|max:10240',
    ]);
    $path = $r->file('file')->store('templates');
    $tpl = DocumentTemplate::create([
      'name'=>$data['name'],
      'code'=>$data['code'],
      'defense_type'=>$data['defense_type']??null,
      'file_path'=>$path,
      'page_count'=>1,
      'created_by'=>$r->user()->id,
    ]);
    return response()->json($tpl);
  }

  public function show(DocumentTemplate $template) {
    return response()->json($template);
  }

  public function updateFields(Request $r, DocumentTemplate $template) {
    $payload = $r->validate(['fields'=>'required|array']);
    $template->fields = $payload['fields'];
    $template->version++;
    $template->save();
    return response()->json(['ok'=>true,'version'=>$template->version]);
  }

  public function destroy(DocumentTemplate $template) {
    Storage::delete($template->file_path);
    $template->delete();
    return response()->json(['ok'=>true]);
  }
}
