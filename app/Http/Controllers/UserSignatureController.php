<?php

namespace App\Http\Controllers;

use App\Models\UserSignature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserSignatureController extends Controller {
  public function index(Request $r){
    return response()->json(
      UserSignature::where('user_id',$r->user()->id)->get()
    );
  }

  public function store(Request $r){
    $r->validate(['image'=>'required|image|mimes:png|max:1024']);
    $path=$r->file('image')->store('signatures/'.$r->user()->id);
    $sig=UserSignature::create([
      'user_id'=>$r->user()->id,
      'image_path'=>$path,
      'active'=>true
    ]);
    UserSignature::where('user_id',$r->user()->id)
      ->where('id','!=',$sig->id)->update(['active'=>false]);
    return response()->json($sig);
  }

  public function activate(Request $r, UserSignature $signature){
    abort_unless($signature->user_id===$r->user()->id,403);
    UserSignature::where('user_id',$r->user()->id)->update(['active'=>false]);
    $signature->active=true; $signature->save();
    return response()->json(['ok'=>true]);
  }
}
