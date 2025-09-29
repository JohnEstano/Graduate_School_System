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
}
