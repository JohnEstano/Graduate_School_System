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
    if ($r->hasFile('image')) {
      $r->validate(['image'=>'required|image|mimes:png|max:1024']);
      $path = $r->file('image')->store('signatures/'.$r->user()->id, 'public');
      $image = getimagesize($r->file('image')->getPathname());
      $natural_width = $image[0] ?? null;
      $natural_height = $image[1] ?? null;
    } elseif ($r->input('image_base64')) {
      $img = $r->input('image_base64');
      if (!preg_match('/^data:image\/png;base64,/', $img)) {
        return response()->json(['error'=>'Invalid image format'], 422);
      }
      $img = substr($img, strpos($img, ',') + 1);
      $imgData = base64_decode($img);
      if (strlen($imgData) > 1024 * 1024) {
        return response()->json(['error'=>'Image too large'], 422);
      }
      $filename = 'signatures/'.$r->user()->id.'/drawn_'.uniqid().'.png';
      Storage::disk('public')->put($filename, $imgData);
      $path = $filename;
      $image = getimagesizefromstring($imgData);
      $natural_width = $image[0] ?? null;
      $natural_height = $image[1] ?? null;
    } else {
      return response()->json(['error'=>'No image provided'], 422);
    }

    $sig = UserSignature::create([
      'user_id'=>$r->user()->id,
      'image_path'=>$path,
      'label'=>$r->input('label') ?? null,
      'natural_width'=>$natural_width,
      'natural_height'=>$natural_height,
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
