<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DefenseRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PanelistController;
use App\Http\Controllers\DefenseRequirementController;
use App\Http\Controllers\ComprehensiveExamController;
use App\Http\Controllers\PaymentSubmissionController;
use App\Http\Controllers\CoordinatorCompreExamController;
use App\Http\Controllers\CoordinatorComprePaymentController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// All routes below require authentication and verification
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard route
    Route::get('dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    // Notification page
    Route::get('notification', function () {
        return Inertia::render('notification/Index');
    })->name('notification.index');

    // Payment routes (controller-based)
    Route::get('/payment', [PaymentSubmissionController::class, 'index'])->name('payment.index');
    Route::post('/payment', [PaymentSubmissionController::class, 'store'])->name('payment.store');

    // Schedule page
    Route::get('schedule', function () {
        return Inertia::render('schedule/Index');
    })->name('schedule.index');

    // Submissions pages (singular endpoints used by your UI)
    Route::get('/defense-request', [DefenseRequestController::class, 'index'])
        ->name('defense-request.index');
    Route::post('/defense-request', [DefenseRequestController::class, 'store'])
        ->name('defense-request.store');

    // Specific PATCH endpoints for resource actions (per-item)
    Route::patch('/defense-requests/{defenseRequest}/status', [DefenseRequestController::class, 'updateStatus'])
        ->name('defense-requests.update-status');
    Route::patch('/defense-requests/{defenseRequest}/priority', [DefenseRequestController::class, 'updatePriority'])
        ->name('defense-requests.update-priority');

    // Bulk action endpoints (specific) - MUST come before the wildcard/resource
    Route::patch('/defense-requests/bulk-status', [DefenseRequestController::class, 'bulkUpdateStatus'])
        ->name('defense-requests.bulk-update-status');
    Route::patch('/defense-requests/bulk-priority', [DefenseRequestController::class, 'bulkUpdatePriority'])
        ->name('defense-requests.bulk-update-priority');

    // Bulk delete (specific) - place BEFORE the resource/wildcard route
    Route::delete('/defense-requests/bulk-remove', [DefenseRequestController::class, 'bulkDelete'])
        ->middleware(['auth', 'verified'])
        ->name('defense-requests.bulk-remove');

    // Any other specific defense-requests routes that must not be treated as {defenseRequest}
    Route::get('/defense-requests/calendar', [DefenseRequestController::class, 'calendar'])
        ->name('defense-requests.calendar');

    // Pending defense requests (specific)
    Route::get('/defense-requests/pending', [DefenseRequestController::class, 'pending']);

    // Resource routes (creates the single-item delete /defense-requests/{defense_request})
    // Keep this AFTER any specific routes above so they take precedence.
    Route::resource('defense-requests', DefenseRequestController::class);

    // Comprehensive Exam (Student) - controller
    Route::get('/comprehensive-exam', [ComprehensiveExamController::class, 'index'])->name('comprehensive-exam.index');
    Route::post('/comprehensive-exam', [ComprehensiveExamController::class, 'store'])->name('comprehensive-exam.store');

    // Honorarium pages
    Route::get('generate-report', function () {
        return Inertia::render('honorarium/generate-report/Index');
    })->name('generate-report.index');
    Route::get('honorarium-summary', function () {
        return Inertia::render('honorarium/honorarium-summary/Index');
    })->name('honorarium-summary.index');

    // Schedules page
    Route::get('schedules', function () {
        return Inertia::render('coordinator/schedule/Index');
    })->name('schedules.index');

    // Messaging pages
    Route::prefix('messages')->name('messages.')->group(function () {
        Route::get('/', [App\Http\Controllers\MessageController::class, 'index'])->name('index');
        Route::get('/conversations/{conversation}/messages', [App\Http\Controllers\MessageController::class, 'getMessages'])->name('get-messages');
        Route::post('/send', [App\Http\Controllers\MessageController::class, 'store'])->name('send');
        Route::post('/conversations', [App\Http\Controllers\MessageController::class, 'createConversation'])->name('create-conversation');
        Route::get('/unread-count', [App\Http\Controllers\MessageController::class, 'getUnreadCount'])->name('unread-count');
        Route::get('/search-users', [App\Http\Controllers\MessageController::class, 'searchUsers'])->name('search-users');
    });

    // System status page (for testing)
    Route::get('/system-status', function () {
        return Inertia::render('system-status');
    })->name('system-status');

    // Notifications page (not API)
    Route::get('/notifications', [NotificationController::class, 'index']);

    // Panelists Inertia page route
    Route::get('/panelists', [PanelistController::class, 'view'])->name('panelists.view');

    // Panelists CRUD routes for Inertia/JS
    Route::post('/panelists', [PanelistController::class, 'store'])->name('panelists.store');
    Route::put('/panelists/{panelist}', [PanelistController::class, 'update'])->name('panelists.update');
    Route::delete('/panelists/{panelist}', [PanelistController::class, 'destroy'])->name('panelists.destroy');
    Route::post('/panelists/bulk-delete', [PanelistController::class, 'bulkDelete'])->name('panelists.bulk-delete');
    Route::post('/panelists/bulk-status', [PanelistController::class, 'bulkUpdateStatus'])->name('panelists.bulk-status');

    // Defense Requirements routes
    Route::get('/defense-requirements', [DefenseRequirementController::class, 'index'])->name('defense-requirements.index');
    Route::post('/defense-requirements', [DefenseRequirementController::class, 'store'])->name('defense-requirements.store');
    Route::get('/all-defense-requirements', [DefenseRequirementController::class, 'all'])
        ->middleware(['auth', 'verified'])
        ->name('defense-requirements.all');

    // Coordinator Comprehensive Exam route (kept inside verified)
    Route::get('/coordinator/compre-exam', [CoordinatorCompreExamController::class, 'index'])
        ->name('coordinator.compre-exam.index');
}); // end auth,verified group

// Coordinator routes (authentication only)
Route::middleware(['auth'])->group(function () {
    // Coordinator Comprehensive Payment route
    Route::get('/coordinator/compre-payment', [CoordinatorComprePaymentController::class, 'index'])
        ->name('coordinator.compre-payment.index');

    Route::post('/coordinator/compre-payment/{id}/approve', [CoordinatorComprePaymentController::class, 'approve'])
        ->name('coordinator.compre-payment.approve');

    Route::post('/coordinator/compre-payment/{id}/reject', [CoordinatorComprePaymentController::class, 'reject'])
        ->name('coordinator.compre-payment.reject');

    // Bulk actions
    Route::post('/coordinator/compre-payment/bulk-approve', [CoordinatorComprePaymentController::class, 'bulkApprove'])
        ->name('coordinator.compre-payment.bulk-approve');

    Route::post('/coordinator/compre-payment/bulk-reject', [CoordinatorComprePaymentController::class, 'bulkReject'])
        ->name('coordinator.compre-payment.bulk-reject');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
