<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PanelistController;
use App\Http\Controllers\DefenseRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Api\StudentSearchController;
use App\Http\Controllers\Api\ComprehensiveExamEligibilityController;
use App\Http\Controllers\DocumentTemplateController;

// Authenticated API routes
Route::middleware('auth:sanctum')->group(function () {
    // Panelists API
    Route::apiResource('panelists', PanelistController::class)->names([
        'index' => 'api.panelists.index',
        'store' => 'api.panelists.store',
        'show' => 'api.panelists.show',
        'update' => 'api.panelists.update',
        'destroy' => 'api.panelists.destroy',
    ]);
    Route::delete('panelists/bulk-delete', [PanelistController::class, 'bulkDelete'])->name('api.panelists.bulk-delete');
    Route::patch('panelists/bulk-status', [PanelistController::class, 'bulkUpdateStatus'])->name('api.panelists.bulk-status');

    // Defense Requests API
    // Specific routes first (before generic patterns)
    Route::get('defense-requests/count', [DefenseRequestController::class, 'count']);
    Route::get('defense-requests/{defenseRequest}', [DefenseRequestController::class, 'apiShow']);
    Route::patch('defense-requests/{defenseRequest}/status', [DefenseRequestController::class, 'updateStatus']);
    Route::patch('defense-requests/{defenseRequest}/priority', [DefenseRequestController::class, 'updatePriority']);
    Route::patch('defense-requests/{defenseRequest}/adviser-status', [DefenseRequestController::class, 'updateAdviserStatus']);
    Route::post('defense-requests/{defenseRequest}/upload-documents', [DefenseRequestController::class, 'uploadDocuments']);
    Route::post('defense-requests/{defenseRequest}/upload-endorsement', [DefenseRequestController::class, 'uploadDocuments']);
    Route::patch('defense-requests/bulk-status', [DefenseRequestController::class, 'bulkUpdateStatus']);
    Route::patch('defense-requests/bulk-priority', [DefenseRequestController::class, 'bulkUpdatePriority']);

    // Notifications API
    // Route::get('notifications', [NotificationController::class, 'index']);
    // Route::post('notifications/read/{notification}', [NotificationController::class, 'markAsRead']);
    // Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Student search API
    Route::get('students/search', [StudentSearchController::class, 'search']);
    // Document Templates API
    Route::get('/document-templates', [DocumentTemplateController::class,'index']);
    Route::get('/document-templates/{template}', [DocumentTemplateController::class,'show']);
    Route::post('/document-templates', [DocumentTemplateController::class,'store']);
    Route::put('/document-templates/{template}/fields', [DocumentTemplateController::class,'updateFields']);
    Route::delete('/document-templates/{template}', [DocumentTemplateController::class,'destroy']);
});
