<?php
/**
 * Professional File Upload Configuration for Academic System
 * This configuration is now handled by UploadConfigServiceProvider
 * 
 * This file contains static configuration values that can be referenced
 * throughout the application for upload limits and settings.
 */

return [
    /*
    |--------------------------------------------------------------------------
    | File Upload Limits
    |--------------------------------------------------------------------------
    |
    | These values define the maximum file sizes and limits for academic
    | document uploads. Values are in kilobytes for Laravel validation.
    |
    */
    
    'max_file_size_kb' => 204800, // 200MB in KB for Laravel validation
    'max_file_size_mb' => 200,    // 200MB for display purposes
    'memory_limit' => '512M',
    'execution_time' => 300,      // 5 minutes
    
    /*
    |--------------------------------------------------------------------------
    | Allowed File Types
    |--------------------------------------------------------------------------
    |
    | Define the MIME types and extensions allowed for academic documents
    |
    */
    
    'allowed_mimes' => [
        'pdf' => 'application/pdf',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
    ],
    
    'allowed_extensions' => ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
];
