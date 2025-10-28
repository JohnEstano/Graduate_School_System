<?php

/**
 * UIC API v2 Test Routes
 * 
 * Add these routes to your routes/api.php or routes/web.php file
 * to test the UIC API v2 integration
 */

use App\Http\Controllers\Api\UicApiTestController;

// Add to routes/api.php (will be prefixed with /api)
Route::middleware(['auth'])->prefix('uic-api')->group(function () {
    // Check token status
    Route::get('/status', [UicApiTestController::class, 'status']);
    
    // Get user profile from UIC API
    Route::get('/profile', [UicApiTestController::class, 'profile']);
    
    // Get grades from UIC API
    Route::get('/grades', [UicApiTestController::class, 'grades']);
    
    // Submit data to UIC API
    Route::post('/submit', [UicApiTestController::class, 'submit']);
    
    // Get token info (debugging)
    Route::get('/token-info', [UicApiTestController::class, 'tokenInfo']);
});

/**
 * USAGE EXAMPLES:
 * 
 * 1. Check if user has token:
 *    GET http://localhost/api/uic-api/status
 * 
 * 2. Get profile:
 *    GET http://localhost/api/uic-api/profile
 * 
 * 3. Get grades:
 *    GET http://localhost/api/uic-api/grades?semester=1&year=2024
 * 
 * 4. Submit data:
 *    POST http://localhost/api/uic-api/submit
 *    Body: {"action": "enroll", "payload": {"course_id": 123}}
 * 
 * 5. Debug token:
 *    GET http://localhost/api/uic-api/token-info
 */
