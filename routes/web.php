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
use App\Http\Controllers\AcademicRecordController;
use App\Http\Controllers\Auth\GoogleController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

// Test route for checking upload limits
Route::get('/test-upload-limits', function () {
    return response()->json([
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'max_input_time' => ini_get('max_input_time'),
        'laravel_config' => config('upload'),
        'service_provider_loaded' => class_exists('App\Providers\UploadConfigServiceProvider'),
    ]);
});

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
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

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
    Route::get('/defense-request', [DefenseRequestController::class, 'index'])->name('defense-request.index');
    Route::post('/defense-request', [DefenseRequestController::class, 'store'])->name('defense-request.store');

    // Specific PATCH endpoints for resource actions (per-item)
    Route::patch('/defense-requests/{defenseRequest}/status', [DefenseRequestController::class, 'updateStatus'])
        ->name('defense-requests.update-status');
    Route::patch('/defense-requests/{defenseRequest}/priority', [DefenseRequestController::class, 'updatePriority'])
        ->name('defense-requests.update-priority');

    // Adviser & Coordinator decision endpoints
    Route::post('/defense-requests/{defenseRequest}/adviser-decision', [DefenseRequestController::class, 'adviserDecision'])
        ->name('defense-requests.adviser-decision');
    Route::post('/defense-requests/{defenseRequest}/coordinator-decision', [DefenseRequestController::class, 'coordinatorDecision'])
        ->name('defense-requests.coordinator-decision');

    // Bulk action endpoints (specific) - MUST come before the wildcard/resource
    Route::patch('/defense-requests/bulk-status', [DefenseRequestController::class, 'bulkUpdateStatus'])
        ->name('defense-requests.bulk-update-status');
    Route::patch('/defense-requests/bulk-priority', [DefenseRequestController::class, 'bulkUpdatePriority'])
        ->name('defense-requests.bulk-update-priority');

    // Adviser suggestion (student auto adviser detection)
    Route::get('/defense-requests/adviser-suggestion', [DefenseRequestController::class, 'adviserSuggestion'])
        ->middleware(['auth','verified'])
        ->name('defense-requests.adviser-suggestion');
    Route::get('/defense-requests/adviser-candidates', [DefenseRequestController::class, 'adviserCandidates'])
        ->middleware(['auth','verified'])
        ->name('defense-requests.adviser-candidates');

    // Bulk delete (specific) - place BEFORE the resource/wildcard route
    Route::delete('/defense-requests/bulk-remove', [DefenseRequestController::class, 'bulkDelete'])
        ->middleware(['auth', 'verified'])
        ->name('defense-requests.bulk-remove');

    // Any other specific defense-requests routes that must not be treated as {defenseRequest}
    Route::get('/defense-requests/calendar', [DefenseRequestController::class, 'calendar'])
        ->name('defense-requests.calendar');

    // Pending defense requests (specific)
    Route::get('/defense-requests/pending', [DefenseRequestController::class, 'pending'])->name('defense-requests.pending');

    // Secure file access for defense attachments
    Route::get('/storage/defense-attachments/{filename}', [DefenseRequestController::class, 'downloadAttachment'])
        ->name('defense-attachments.download');

    // Lightweight API count endpoint used by sidebar polling (avoid 302 by defining route explicitly)
    Route::get('/api/defense-requests/count', [DefenseRequestController::class, 'count'])
        ->name('api.defense-requests.count');

    // API endpoint for real-time defense request updates
    Route::get('/api/defense-request/{defenseRequest}', [DefenseRequestController::class, 'apiShow'])
        ->name('api.defense-request.show');

    // Resource routes (creates the single-item delete /defense-requests/{defense_request})
    // Keep this AFTER any specific routes above so they take precedence.
    Route::resource('defense-requests', DefenseRequestController::class);

    // Comprehensive Exam (Student) - prefer controller if available
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

    // All Defense Requirements (adviser/coordinator overview)
    Route::get('/all-defense-requirements', [DefenseRequirementController::class, 'all'])
        ->middleware(['auth', 'verified'])
        ->name('defense-requirements.all');

    // Coordinator Comprehensive Exam route (kept inside verified)
    Route::get('/coordinator/compre-exam', [CoordinatorCompreExamController::class, 'index'])
        ->name('coordinator.compre-exam.index');

    // Academic Records page (student)
    Route::get('/academic-records', function () {
        return Inertia::render('student/academic-records/academic-records');
    })->name('academic-records.index');
}); // end auth,verified group

// Coordinator routes (authentication only) - comprehensive payment actions
Route::middleware(['auth'])->group(function () {
    // Coordinator Comprehensive Payment route
    Route::get('/coordinator/compre-payment', [CoordinatorComprePaymentController::class, 'index'])
        ->name('coordinator.compre-payment.index');

    Route::post('/coordinator/compre-payment/{id}/approve', [CoordinatorComprePaymentController::class, 'approve'])
        ->name('coordinator.compre-payment.approve');

    Route::post('/coordinator/compre-payment/{id}/reject', [CoordinatorComprePaymentController::class, 'reject'])
        ->name('coordinator.compre-payment.reject');
});

// Coordinator area: defense management and scheduling
Route::prefix('coordinator')->name('coordinator.')->middleware(['auth', 'verified'])->group(function () {
    Route::get('/defense-management', [\App\Http\Controllers\CoordinatorDefenseController::class, 'index'])
        ->name('defense.index');
    Route::get('/defense/{defenseRequest}', [\App\Http\Controllers\CoordinatorDefenseController::class, 'show'])
        ->name('defense.show');
    Route::post('/defense/{defenseRequest}/assign-panels', [\App\Http\Controllers\CoordinatorDefenseController::class, 'assignPanels'])
        ->name('defense.assign-panels');
    Route::post('/defense/{defenseRequest}/schedule', [\App\Http\Controllers\CoordinatorDefenseController::class, 'scheduleDefense'])
        ->name('defense.schedule');
    Route::post('/defense/{defenseRequest}/notify', [\App\Http\Controllers\CoordinatorDefenseController::class, 'sendNotifications'])
        ->name('defense.notify');
    Route::put('/defense/{defenseRequest}', [\App\Http\Controllers\CoordinatorDefenseController::class, 'updateDefense'])
        ->name('defense.update');

    // Defense Schedule Management
    Route::get('/schedule', [\App\Http\Controllers\DefenseScheduleController::class, 'index'])
        ->name('schedule.index');
    Route::get('/schedule/calendar', [\App\Http\Controllers\DefenseScheduleController::class, 'calendar'])
        ->name('schedule.calendar');
    Route::post('/schedule/check-conflicts', [\App\Http\Controllers\DefenseScheduleController::class, 'checkConflicts'])
        ->name('schedule.check-conflicts');
    Route::get('/schedule/available-panelists', [\App\Http\Controllers\DefenseScheduleController::class, 'availablePanelists'])
        ->name('schedule.available-panelists');

    // Show all defense requests (table view)
    Route::get('/defense-requests/all', [App\Http\Controllers\DefenseRequestController::class, 'index'])
        ->name('defense-requests.all');
});

// Legacy system linking and academic record endpoints
Route::get('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class, 'form'])->name('legacy.link.form');
Route::post('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class, 'link'])->name('legacy.link.submit');
Route::delete('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class, 'unlink'])->name('legacy.link.unlink');

// Academic records (legacy) JSON endpoint and Inertia dashboard
Route::get('/legacy/academic-records', [AcademicRecordController::class, 'index'])->name('legacy.academic-records.index');
Route::get('/legacy/academic-records/dashboard', function () { return Inertia::render('legacy/AcademicRecordsDashboard'); })->name('legacy.academic-records.dashboard');

// Faculty class list (legacy proxy)
Route::get('/faculty/class-list', [\App\Http\Controllers\InstructorClassListController::class, 'page'])->name('faculty.class-list.page');
Route::get('/legacy/faculty/class-list', [\App\Http\Controllers\InstructorClassListController::class, 'index'])->name('legacy.faculty.class-list');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
