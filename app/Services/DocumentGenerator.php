<?php
namespace App\Services;

use App\Models\{DocumentTemplate, DefenseRequest, GeneratedDocument, UserSignature};
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;

class DocumentGenerator {
  public function generate(DocumentTemplate $tpl, DefenseRequest $req, array $overrides = []): GeneratedDocument {
    \Log::info("DocumentGenerator: Starting generation", [
        'template_id' => $tpl->id,
        'template_name' => $tpl->name,
        'defense_request_id' => $req->id,
    ]);
    
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
    \Log::info("DocumentGenerator: Template file path", ['path' => $src]);
    
    if (!file_exists($src)) {
        \Log::error("DocumentGenerator: PDF template file not found", ['path' => $src]);
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
                
                \Log::info("DocumentGenerator: Processing signature field", [
                    'field_key' => $f['key'],
                    'image_path' => $img,
                    'file_exists' => $img ? file_exists($img) : false,
                    'x' => $x,
                    'y' => $y,
                    'width' => $w,
                    'height' => $h
                ]);
                
                if($img && file_exists($img)) {
                    try {
                        // Check if GD extension is loaded for image support
                        if (!extension_loaded('gd')) {
                            \Log::warning("GD extension not loaded, skipping signature image");
                            $pdf->SetXY($x, $y);
                            $pdf->SetFont('Arial', 'I', 10);
                            $pdf->Cell($w, $h, '[Signature]', 0, 0, 'C');
                        } else {
                            // Detect image type
                            $imageInfo = @getimagesize($img);
                            $imageType = 'PNG'; // default
                            
                            if ($imageInfo !== false) {
                                switch ($imageInfo[2]) {
                                    case IMAGETYPE_JPEG: $imageType = 'JPEG'; break;
                                    case IMAGETYPE_PNG: $imageType = 'PNG'; break;
                                    case IMAGETYPE_GIF: $imageType = 'GIF'; break;
                                }
                            }
                            
                            // Add image to PDF with field dimensions
                            $pdf->Image($img, $x, $y, $w, $h, $imageType);
                            
                            \Log::info("DocumentGenerator: Signature image added successfully", [
                                'field' => $f['key']
                            ]);
                        }
                    } catch (\Exception $e) {
                        \Log::error("Error adding signature image", [
                            'field' => $f['key'],
                            'error' => $e->getMessage()
                        ]);
                        $pdf->SetXY($x, $y);
                        $pdf->SetFont('Arial', 'I', 10);
                        $pdf->Cell($w, $h, '[Signature Error]', 0, 0, 'C');
                    }
                } else {
                    \Log::warning("DocumentGenerator: Signature image not found", [
                        'field' => $f['key'],
                        'image_path' => $img
                    ]);
                    $pdf->SetXY($x, $y);
                    $pdf->SetFont('Arial', 'I', 10);
                    $pdf->Cell($w, $h, '[No Signature]', 0, 0, 'C');
                }
                continue;
            }

            $val = $this->value($f['key'], $payload);
            if(!$val) continue;

            $pdf->SetXY($x, $y);
            $pdf->SetFont('Arial', '', $f['font_size'] ?? 11);
            
            // Use left alignment for better text positioning
            $pdf->Cell($w, $h, $val, 0, 0, 'L');
        }
    }

    // Ensure the directory exists
    $directory = "generated/defense";
    if (!Storage::disk('public')->exists($directory)) {
        Storage::disk('public')->makeDirectory($directory);
        \Log::info("DocumentGenerator: Created directory", ['directory' => $directory]);
    }

    $out = "generated/defense/{$req->id}_{$tpl->code}_" . time() . ".pdf";
    \Log::info("DocumentGenerator: Generating PDF output", ['output_path' => $out]);
    
    $pdfContent = $pdf->Output('S');
    if (!$pdfContent || strlen($pdfContent) < 100) {
        \Log::error("PDF generation failed: empty or invalid PDF content for $out", [
            'content_length' => strlen($pdfContent ?? '')
        ]);
        throw new \Exception("PDF generation failed: empty or invalid PDF content");
    }
    
    \Log::info("DocumentGenerator: PDF content generated", [
        'size' => strlen($pdfContent),
        'output_path' => $out
    ]);

    // Delete old generated documents for this request/template
    $oldDocs = GeneratedDocument::where('defense_request_id', $req->id)
        ->where('document_template_id', $tpl->id)
        ->get();
    
    if ($oldDocs->count() > 0) {
        \Log::info("DocumentGenerator: Deleting old documents", ['count' => $oldDocs->count()]);
        $oldDocs->each(function($doc) {
            Storage::disk('public')->delete($doc->output_path);
            $doc->delete();
        });
    }

    Storage::disk('public')->put($out, $pdfContent);
    \Log::info("DocumentGenerator: PDF saved to storage", ['path' => $out]);

    if (!Storage::disk('public')->exists($out)) {
        \Log::error("Generated PDF not found after save at: $out");
        throw new \Exception("Generated PDF not found at: $out");
    }
    
    $fullPath = Storage::disk('public')->path($out);
    \Log::info("DocumentGenerator: PDF verified", [
        'storage_path' => $out,
        'full_path' => $fullPath,
        'file_exists' => file_exists($fullPath),
        'file_size' => file_exists($fullPath) ? filesize($fullPath) : 0
    ]);

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
    
    \Log::info("DocumentGenerator: Generation complete", [
        'generated_document_id' => $generated->id,
        'output_path' => $generated->output_path
    ]);

    return $generated;
  }

  private function payload(DefenseRequest $r): array {
    // Load relationships
    $r->load(['student', 'adviserUser', 'coordinator']);
    
    $student = $r->student ?? $r;
    
    // Get adviser full name
    $adviserFullName = '';
    if ($r->adviserUser) {
        $adviserFullName = trim(($r->adviserUser->first_name ?? '') . ' ' . ($r->adviserUser->last_name ?? ''));
    }
    
    // Get coordinator full name
    $coordinatorFullName = '';
    if ($r->coordinator) {
        $coordinatorFullName = trim(($r->coordinator->first_name ?? '') . ' ' . ($r->coordinator->last_name ?? ''));
    }
    
    // Get dean full name
    $deanFullName = '';
    $dean = \App\Models\User::where('role', 'Dean')->first();
    if ($dean) {
        $deanFullName = trim(($dean->first_name ?? '') . ' ' . ($dean->last_name ?? ''));
    }
    
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
      'adviser' => [
        'full_name' => $adviserFullName,
      ],
      'coordinator' => [
        'full_name' => $coordinatorFullName,
      ],
      'dean' => [
        'full_name' => $deanFullName,
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
    
    \Log::info("DocumentGenerator: Looking for signature", [
        'field_key' => $key,
        'user_id' => $uid,
        'adviser_user_id' => $r->adviser_user_id,
        'coordinator_user_id' => $r->coordinator_user_id
    ]);
    
    if(!$uid) {
        \Log::warning("DocumentGenerator: No user ID found for signature field", ['field_key' => $key]);
        return null;
    }

    $sig = UserSignature::where('user_id', $uid)->where('active', true)->first();
    
    if (!$sig) {
        \Log::warning("DocumentGenerator: No active signature found for user", [
            'user_id' => $uid,
            'field_key' => $key
        ]);
        return null;
    }
    
    // Use the public disk to get the full path
    $fullPath = Storage::disk('public')->path($sig->image_path);
    
    \Log::info("DocumentGenerator: Signature found", [
        'user_id' => $uid,
        'field_key' => $key,
        'image_path' => $sig->image_path,
        'full_path' => $fullPath,
        'file_exists' => file_exists($fullPath)
    ]);
    
    return $fullPath;
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