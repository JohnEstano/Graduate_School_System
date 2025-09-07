<?php

use Illuminate\Support\Facades\Route;

Route::get('/test-upload-limits', function () {
    return response()->json([
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'max_input_time' => ini_get('max_input_time'),
        'laravel_max_size_kb' => 204800, // Our Laravel validation limit
        'laravel_max_size_mb' => round(204800 / 1024, 1),
    ]);
});
