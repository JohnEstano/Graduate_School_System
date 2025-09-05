<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PanelistController;
use App\Http\Controllers\DefenseRequestController;
use App\Http\Controllers\NotificationController;

// Authenticated API routes
Route::middleware('auth:sanctum')->group(function () {
    // Panelists API
    Route::apiResource('panelists', PanelistController::class);
    Route::delete('panelists/bulk-delete', [PanelistController::class, 'bulkDelete']);
    Route::patch('panelists/bulk-status', [PanelistController::class, 'bulkUpdateStatus']);

    // Defense Requests API
    Route::patch('defense-requests/{defenseRequest}/status', [DefenseRequestController::class, 'updateStatus']);
    Route::patch('defense-requests/{defenseRequest}/priority', [DefenseRequestController::class, 'updatePriority']);
    Route::patch('defense-requests/bulk-status', [DefenseRequestController::class, 'bulkUpdateStatus']);
    Route::patch('defense-requests/bulk-priority', [DefenseRequestController::class, 'bulkUpdatePriority']);
    // Lightweight pending count (polled by sidebar) – keep cheap & cache at controller level if needed
    Route::get('defense-requests/count', [DefenseRequestController::class, 'count']);

    // Notifications API
    // Route::get('notifications', [NotificationController::class, 'index']);
    // Route::post('notifications/read/{notification}', [NotificationController::class, 'markAsRead']);
    // Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
});
