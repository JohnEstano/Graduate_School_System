<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;

class UploadConfigServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Apply PHP configuration for large file uploads
        $this->configurePhpForLargeUploads();
        
        // Log configuration if in debug mode
        if (config('app.debug')) {
            Log::info('Upload Configuration Applied', [
                'upload_max_filesize' => ini_get('upload_max_filesize'),
                'post_max_size' => ini_get('post_max_size'),
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
            ]);
        }
    }
    
    /**
     * Configure PHP settings for large academic document uploads
     */
    private function configurePhpForLargeUploads(): void
    {
        // Only apply these settings if we're in a web context
        if (php_sapi_name() !== 'cli') {
            // Set memory limit for processing large files
            ini_set('memory_limit', '512M');
            
            // Set upload limits for academic documents
            ini_set('upload_max_filesize', '200M');
            ini_set('post_max_size', '200M');
            
            // Set execution time limits for file processing
            ini_set('max_execution_time', 300); // 5 minutes
            ini_set('max_input_time', 300);     // 5 minutes
            
            // Increase input variables for complex forms
            ini_set('max_input_vars', 3000);
            
            // File upload settings
            ini_set('file_uploads', 1);
            ini_set('max_file_uploads', 20);
        }
    }
}
