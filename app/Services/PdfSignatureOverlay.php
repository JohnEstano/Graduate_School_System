<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;
use App\Models\UserSignature;

class PdfSignatureOverlay
{
    /**
     * Add coordinator signature to existing PDF
     * 
     * @param string $existingPdfPath Path to existing PDF in storage
     * @param int $coordinatorUserId User ID of coordinator
     * @param array $signaturePosition Position data: ['page' => 1, 'x' => 100, 'y' => 200, 'width' => 80, 'height' => 30]
     * @return string Path to new PDF with signature added
     */
    public function addCoordinatorSignature(string $existingPdfPath, int $coordinatorUserId, ?array $signaturePosition = null): string
    {
        \Log::info("PdfSignatureOverlay: Adding coordinator signature", [
            'existing_pdf' => $existingPdfPath,
            'coordinator_user_id' => $coordinatorUserId,
            'signature_position' => $signaturePosition
        ]);

        // Get coordinator's active signature
        $signature = UserSignature::where('user_id', $coordinatorUserId)
            ->where('active', true)
            ->first();

        if (!$signature) {
            throw new \Exception("No active signature found for coordinator user ID: {$coordinatorUserId}");
        }

        // Get full path to existing PDF
        $sourcePdfPath = Storage::disk('public')->path($existingPdfPath);
        
        if (!file_exists($sourcePdfPath)) {
            throw new \Exception("Source PDF not found: {$sourcePdfPath}");
        }

        // Get full path to signature image
        $signatureImagePath = Storage::disk('public')->path($signature->image_path);
        
        if (!file_exists($signatureImagePath)) {
            throw new \Exception("Signature image not found: {$signatureImagePath}");
        }

        // Initialize FPDI
        $pdf = new Fpdi();
        $pageCount = $pdf->setSourceFile($sourcePdfPath);

        // Default signature position if not provided
        // Usually coordinator signatures are at bottom of first page
        if ($signaturePosition === null) {
            $signaturePosition = [
                'page' => 1,
                'x' => 120, // Centered-ish
                'y' => 240, // Near bottom
                'width' => 60,
                'height' => 20
            ];
        }

        \Log::info("PdfSignatureOverlay: Using signature position", $signaturePosition);

        // Import all pages
        for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
            $templateId = $pdf->importPage($pageNo);
            $pdf->AddPage();
            $pdf->useTemplate($templateId);

            // Add signature on specified page
            if ($pageNo === $signaturePosition['page']) {
                try {
                    // Detect image type
                    $imageInfo = @getimagesize($signatureImagePath);
                    $imageType = 'PNG'; // default
                    
                    if ($imageInfo !== false) {
                        switch ($imageInfo[2]) {
                            case IMAGETYPE_JPEG: $imageType = 'JPEG'; break;
                            case IMAGETYPE_PNG: $imageType = 'PNG'; break;
                            case IMAGETYPE_GIF: $imageType = 'GIF'; break;
                        }
                    }

                    // Add signature image
                    $pdf->Image(
                        $signatureImagePath,
                        $signaturePosition['x'],
                        $signaturePosition['y'],
                        $signaturePosition['width'],
                        $signaturePosition['height'],
                        $imageType
                    );

                    \Log::info("PdfSignatureOverlay: Signature added to page {$pageNo}");
                } catch (\Exception $e) {
                    \Log::error("PdfSignatureOverlay: Failed to add signature image", [
                        'error' => $e->getMessage(),
                        'page' => $pageNo
                    ]);
                    // Continue without signature rather than failing completely
                }
            }
        }

        // Generate output path
        $outputPath = "generated/defense/coordinator_signed_" . time() . "_" . basename($existingPdfPath);
        $pdfContent = $pdf->Output('S');

        // Save to storage
        Storage::disk('public')->put($outputPath, $pdfContent);

        \Log::info("PdfSignatureOverlay: Signed PDF created", ['output_path' => $outputPath]);

        return $outputPath;
    }

    /**
     * Find coordinator signature field position from template
     * This is more advanced - reads template field mapping to position signature correctly
     * 
     * @param int $templateId
     * @return array|null
     */
    public function getCoordinatorSignaturePosition(int $templateId): ?array
    {
        $template = \App\Models\DocumentTemplate::find($templateId);
        
        if (!$template || !$template->fields) {
            return null;
        }

        // Look for coordinator signature field
        foreach ($template->fields as $field) {
            if (isset($field['key']) && $field['key'] === 'signature.coordinator') {
                // Convert from canvas px to PDF mm
                $canvasWidth = $template->fields_meta['canvas_width'] ?? 595;
                $canvasHeight = $template->fields_meta['canvas_height'] ?? 842;
                
                $pageWidth = 210; // A4 width in mm
                $pageHeight = 297; // A4 height in mm
                
                return [
                    'page' => $field['page'] ?? 1,
                    'x' => ($field['x'] / $canvasWidth) * $pageWidth,
                    'y' => ($field['y'] / $canvasHeight) * $pageHeight,
                    'width' => ($field['width'] / $canvasWidth) * $pageWidth,
                    'height' => ($field['height'] / $canvasHeight) * $pageHeight
                ];
            }
        }

        return null;
    }
}
