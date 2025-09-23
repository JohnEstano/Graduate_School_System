<?php
namespace App\Services;

use App\Models\{DocumentTemplate,DefenseRequest,GeneratedDocument,UserSignature};
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;

class DocumentGenerator {
  public function generate(DocumentTemplate $tpl, DefenseRequest $req): GeneratedDocument {
    $payload=$this->payload($req);
    $pdf=new Fpdi();
    $src=Storage::path($tpl->file_path);
    $pageCount=$pdf->setSourceFile($src);
    $fields=$tpl->fields ?? [];

    for($p=1;$p<=$pageCount;$p++){
      $pid=$pdf->importPage($p);
      $size=$pdf->getTemplateSize($pid);
      $pdf->AddPage($size['orientation'],[$size['width'],$size['height']]);
      $pdf->useTemplate($pid);
      foreach($fields as $f){
        if(($f['page']??1)!==$p) continue;
        $type=$f['type']??'text';
        $x=$f['x']; $y=$f['y']; $w=$f['width']??0;
        if($type==='signature'){
          $img=$this->sigPath($f['key'],$req);
          if($img) $pdf->Image($img,$x,$y,$w,0,'PNG');
          continue;
        }
        $val=$this->value($f['key'],$payload);
        if(!$val) continue;
        $pdf->SetFont('Helvetica','',$f['font_size']??11);
        $pdf->SetXY($x,$y);
        if(($f['type']??'')==='multiline'){
          $pdf->MultiCell($w,5,$val);
        } else {
          $pdf->Cell($w,5,$val,0,0);
        }
      }
    }

    $out="generated/defense/{$req->id}_{$tpl->code}_".time().".pdf";
    Storage::put($out,$pdf->Output('S'));
    $hash=hash('sha256',Storage::get($out));

    return GeneratedDocument::create([
      'defense_request_id'=>$req->id,
      'document_template_id'=>$tpl->id,
      'template_version_used'=>$tpl->version,
      'output_path'=>$out,
      'payload'=>$payload,
      'sha256'=>$hash
    ]);
  }

  private function payload(DefenseRequest $r): array {
    $student=$r->student;
    return [
      'student'=>[
        'full_name'=>trim(($student->first_name??'').' '.($student->last_name??'')),
        'program'=>$r->program
      ],
      'request'=>[
        'thesis_title'=>$r->thesis_title,
        'defense_type'=>$r->defense_type
      ],
      'schedule'=>[
        'date'=>$r->scheduled_date?date('M d, Y',strtotime($r->scheduled_date)):null,
        'time'=>$r->scheduled_date?date('h:i A',strtotime($r->scheduled_date)):null
      ],
      'today'=>['date'=>now()->format('M d, Y')]
    ];
  }

  private function sigPath(string $key, DefenseRequest $r): ?string {
    $map=[
      'signature.adviser'=>$r->adviser_user_id ?? null,
      'signature.coordinator'=>$r->coordinator_user_id ?? null,
      'signature.dean'=>\App\Models\User::where('role','Dean')->value('id')
    ];
    $uid=$map[$key]??null;
    if(!$uid) return null;
    $sig=UserSignature::where('user_id',$uid)->where('active',true)->first();
    return $sig?Storage::path($sig->image_path):null;
  }

  private function value(string $key, array $data){
    foreach(explode('.',$key) as $seg){
      if(!is_array($data) || !array_key_exists($seg,$data)) return null;
      $data=$data[$seg];
    }
    return is_scalar($data)?(string)$data:null;
  }
}