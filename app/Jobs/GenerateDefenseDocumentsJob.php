<?php

namespace App\Jobs;

use App\Models\{DefenseRequest,DocumentTemplate};
use App\Services\DocumentGenerator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\{InteractsWithQueue,SerializesModels};

class GenerateDefenseDocumentsJob implements ShouldQueue {
  use Queueable, InteractsWithQueue, SerializesModels;

  public function __construct(public int $defenseRequestId){}

  public function handle(DocumentGenerator $gen): void {
    $req=DefenseRequest::find($this->defenseRequestId);
    if(!$req) return;
    $templates=DocumentTemplate::where(function($q) use($req){
      $q->whereNull('defense_type')->orWhere('defense_type',$req->defense_type);
    })->get();
    foreach($templates as $tpl){ $gen->generate($tpl,$req); }
  }
}
