<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FileUploadService
{
    /**
     * Professional file upload handling for graduate school documents
     */
    public function uploadDefenseDocument(UploadedFile $file, string $type = 'defense_requirements'): ?string
    {
        try {
            // Validate file size (200MB limit)
            $maxSize = 200 * 1024 * 1024; // 200MB in bytes
            if ($file->getSize() > $maxSize) {
                throw new \Exception("File size exceeds 200MB limit. Current size: " . $this->formatBytes($file->getSize()));
            }

            // Validate file type for security
            $allowedMimes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/png',
                'image/jpg'
            ];

            if (!in_array($file->getMimeType(), $allowedMimes)) {
                throw new \Exception("File type not allowed: " . $file->getMimeType());
            }

            // Generate secure filename
            $extension = $file->getClientOriginalExtension();
            $filename = Str::random(40) . '.' . $extension;
            
            // Store in public disk for web access
            $path = $file->storeAs($type, $filename, 'public');
            
            Log::info('File uploaded successfully', [
                'original_name' => $file->getClientOriginalName(),
                'stored_path' => $path,
                'size' => $this->formatBytes($file->getSize()),
                'mime_type' => $file->getMimeType()
            ]);

            return $path;

        } catch (\Exception $e) {
            Log::error('File upload failed', [
                'original_name' => $file->getClientOriginalName(),
                'error' => $e->getMessage(),
                'size' => $this->formatBytes($file->getSize())
            ]);
            
            throw $e;
        }
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }

    /**
     * Delete file from storage
     */
    public function deleteFile(?string $path): bool
    {
        if (!$path) return false;
        
        try {
            return Storage::disk('public')->delete($path);
        } catch (\Exception $e) {
            Log::error('File deletion failed', [
                'path' => $path,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get file URL for web access
     */
    public function getFileUrl(?string $path): ?string
    {
        if (!$path) return null;
        
        return asset('storage/' . $path);
    }
}
