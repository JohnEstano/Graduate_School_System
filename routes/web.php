<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DefenseRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PanelistController;
use App\Http\Controllers\DefenseRequirementController;
use App\Http\Controllers\AcademicRecordController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia; // still used elsewhere; keep import
use App\Http\Controllers\Auth\GoogleController;

// Landing page (public) with call-to-action
Route::get('/', function () {
    return Inertia::render('landing/Index');
})->name('home');

// Google OAuth (domain restricted) routes
Route::get('/auth/google/redirect', [GoogleController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('google.callback');
Route::get('/auth/status/google-verified', [\App\Http\Controllers\Auth\AuthStatusController::class, 'googleVerified'])->name('auth.status.google-verified');

// All routes below require authentication and verification
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard route
    Route::get('dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    // Notification page
    Route::get('notification', function () {
        return Inertia::render('notification/Index');
    })->name('notification.index');

    // Payment page
    Route::get('payment', function () {
        return Inertia::render('payment/Index');
    })->name('payment.index');

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

    // Resource routes (creates the single-item delete /defense-requests/{defense_request})
    // Keep this AFTER any specific routes above so they take precedence.
    Route::resource('defense-requests', DefenseRequestController::class);

    Route::get('comprehensive-exam', function () {
        return Inertia::render('student/submissions/comprehensive-exam/Index');
    })->name('comprehensive-exam.index');

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

    // Messaging feature removed

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

    // Legacy system linking
    Route::get('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class, 'form'])->name('legacy.link.form');
    Route::post('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class, 'link'])->name('legacy.link.submit');
    Route::delete('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class, 'unlink'])->name('legacy.link.unlink');

    // Academic records (legacy) JSON endpoint
    Route::get('/legacy/academic-records', [AcademicRecordController::class, 'index'])->name('legacy.academic-records.index');
    // Inertia dashboard page
    Route::get('/legacy/academic-records/dashboard', function () { return Inertia::render('legacy/AcademicRecordsDashboard'); })->name('legacy.academic-records.dashboard');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
