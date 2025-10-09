<?php
namespace App\Services;

use App\Models\{DocumentTemplate, DefenseRequest, GeneratedDocument, UserSignature};
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;

class DocumentGenerator {
  public function generate(DocumentTemplate $tpl, DefenseRequest $req, array $overrides = []): GeneratedDocument {
    $payload = $this->payload($req);

    // Apply overrides (key-value pairs)
    foreach ($overrides as $k => $v) {
        $segments = explode('.', $k);
        $ref = &$payload;
        foreach ($segments as $seg) {
            if (!isset($ref[$seg])) {
                $ref[$seg] = [];
            }
            $ref = &$ref[$seg];
        }
        $ref = $v;
    }

    $pdf = new Fpdi();

    // Use the public disk for template files
    $src = Storage::disk('public')->path($tpl->file_path);
    if (!file_exists($src)) {
        throw new \Exception("PDF template file not found: $src");
    }

    $pageCount = $pdf->setSourceFile($src);
    $fields = $tpl->fields ?? [];

    // Set font to Arial everywhere (no DejaVu)
    $pdf->SetFont('Arial','',12);

    for($p = 1; $p <= $pageCount; $p++) {
        $tplId = $pdf->importPage($p);
        $pdf->AddPage();
        $pdf->useTemplate($tplId);

        // Get page size in mm
        $pageWidth = $pdf->GetPageWidth();
        $pageHeight = $pdf->GetPageHeight();

        // Get page size in px (from your template fields)
        $canvasWidth = $tpl->fields_meta['canvas_width'] ?? 595; // default A4 px
        $canvasHeight = $tpl->fields_meta['canvas_height'] ?? 842; // default A4 px

        foreach ($fields as $f) {
            if ($f['page'] != $p) continue;

            // Convert px to mm
            $x = ($f['x'] / $canvasWidth) * $pageWidth;
            $y = ($f['y'] / $canvasHeight) * $pageHeight;
            $w = ($f['width'] / $canvasWidth) * $pageWidth;
            $h = ($f['height'] / $canvasHeight) * $pageHeight;

            // Now use $x, $y, $w, $h in FPDF
            if($f['type'] === 'signature') {
                $img = $this->sigPath($f['key'], $req);
                if($img && file_exists($img)) {
                    $pdf->Image($img, $x, $y, $w, 0, 'PNG');
                }
                continue;
            }

            $val = $this->value($f['key'], $payload);
            if(!$val) continue;

            $pdf->SetXY($x, $y);
            // Set font to Arial everywhere (no DejaVu)
            $pdf->SetFont('Arial', '', $f['font_size'] ?? 12);
            $pdf->Cell($w, $h, $val, 0, 0, 'C'); // 'C' for center
        }
    }

    // Ensure the directory exists
    $directory = "generated/defense";
    if (!Storage::disk('public')->exists($directory)) {
        Storage::disk('public')->makeDirectory($directory);
    }

    $out = "generated/defense/{$req->id}_{$tpl->code}_" . time() . ".pdf";
    $pdfContent = $pdf->Output('S');
    if (!$pdfContent || strlen($pdfContent) < 100) {
        \Log::error("PDF generation failed: empty or invalid PDF content for $out");
        throw new \Exception("PDF generation failed: empty or invalid PDF content");
    }

    // Delete old generated documents for this request/template
    GeneratedDocument::where('defense_request_id', $req->id)
        ->where('document_template_id', $tpl->id)
        ->get()
        ->each(function($doc) {
            Storage::disk('public')->delete($doc->output_path);
            $doc->delete();
        });

    Storage::disk('public')->put($out, $pdfContent);

    if (!Storage::disk('public')->exists($out)) {
        \Log::error("Generated PDF not found at: $out");
        throw new \Exception("Generated PDF not found at: $out");
    }

    $hash = hash('sha256', $pdfContent);

    $generated = GeneratedDocument::create([
        'defense_request_id' => $req->id,
        'document_template_id' => $tpl->id,
        'template_version_used' => $tpl->version,
        'output_path' => $out,
        'payload' => json_encode($payload),
        'status' => 'generated',
        'sha256' => $hash,
    ]);

    return $generated;
  }

  private function payload(DefenseRequest $r): array {
    $student = $r->student ?? $r;
    return [
      'student' => [
        'full_name' => trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')),
        'first_name' => $student->first_name ?? '',
        'last_name' => $student->last_name ?? '',
        'middle_name' => $student->middle_name ?? '',
        'school_id' => $student->school_id ?? '',
        'program' => $r->program ?? '',
      ],
      'request' => [
        'thesis_title' => $r->thesis_title ?? '',
        'defense_type' => $r->defense_type ?? '',
        'id' => $r->id,
      ],
      'schedule' => [
        'date' => $r->scheduled_date ? date('M d, Y', strtotime($r->scheduled_date)) : null,
        'time' => $r->scheduled_time ? date('h:i A', strtotime($r->scheduled_time)) : null,
        'end_time' => $r->scheduled_end_time ? date('h:i A', strtotime($r->scheduled_end_time)) : null,
        'venue' => $r->defense_venue ?? '',
        'mode' => $r->defense_mode ?? '',
      ],
      'committee' => [
        'adviser' => $r->defense_adviser ?? '',
        'chairperson' => $r->defense_chairperson ?? '',
        'panelist1' => $r->defense_panelist1 ?? '',
        'panelist2' => $r->defense_panelist2 ?? '',
        'panelist3' => $r->defense_panelist3 ?? '',
        'panelist4' => $r->defense_panelist4 ?? '',
      ],
      'today' => [
        'date' => now()->format('M d, Y'),
        'full_date' => now()->format('F d, Y')
      ]
    ];
  }

  private function sigPath(string $key, DefenseRequest $r): ?string {
    $map = [
      'signature.adviser' => $r->adviser_user_id ?? null,
      'signature.coordinator' => $r->coordinator_user_id ?? null,
      'signature.dean' => \App\Models\User::where('role','Dean')->value('id')
    ];

    $uid = $map[$key] ?? null;
    if(!$uid) return null;

    $sig = UserSignature::where('user_id', $uid)->where('active', true)->first();
    return $sig ? Storage::path($sig->image_path) : null;
  }

  private function value(string $key, array $data) {
    $segments = explode('.', $key);
    $current = $data;

    foreach($segments as $segment) {
        if (!is_array($current) || !array_key_exists($segment, $current)) {
            return null;
        }
        $current = $current[$segment];
    }

    return is_scalar($current) ? (string)$current : null;
  }
}