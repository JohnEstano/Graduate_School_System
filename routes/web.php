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
use App\Models\User;
use App\Models\DefenseRequest;
use App\Http\Controllers\CoordinatorDefenseController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Cleaned and validated routes file.
|
*/

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

// 
Route::get('/', function () {
    return redirect('/login');
})->name('home');

// Google OAuth (domain restricted) routes
Route::get('/auth/google/redirect', [GoogleController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('google.callback');
Route::get('/auth/status/google-verified', [\App\Http\Controllers\Auth\AuthStatusController::class, 'googleVerified'])
    ->name('auth.status.google-verified');

// All routes below require authentication and verification
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Notification page (Inertia)
    Route::get('notification', function () {
        return Inertia::render('notification/Index');
    })->name('notification.index');

    // Payment routes
    Route::get('/payment', [PaymentSubmissionController::class, 'index'])->name('payment.index');
    Route::post('/payment', [PaymentSubmissionController::class, 'store'])->name('payment.store');

    // Schedule page (student-facing)
    Route::get('schedule', function () {
        return Inertia::render('schedule/Index');
    })->name('schedule.index');

    // Defense request (student)
    Route::get('/defense-request', [DefenseRequestController::class, 'index'])->name('defense-request.index');
    Route::post('/defense-request', [DefenseRequestController::class, 'store'])->name('defense-request.store');

    // Per-item patch actions (status / priority)
    Route::patch('/defense-requests/{defenseRequest}/status', [DefenseRequestController::class, 'updateStatus'])
        ->name('defense-requests.update-status');
    Route::patch('/defense-requests/{defenseRequest}/priority', [DefenseRequestController::class, 'updatePriority'])
        ->name('defense-requests.update-priority');

    // Adviser & Coordinator decision endpoints
    Route::post('/defense-requests/{defenseRequest}/adviser-decision', [DefenseRequestController::class, 'adviserDecision'])
        ->name('defense-requests.adviser-decision');
    Route::post('/defense-requests/{defenseRequest}/coordinator-decision', [DefenseRequestController::class, 'coordinatorDecision'])
        ->name('defense-requests.coordinator-decision');

    // Bulk actions (must be before resource/wildcard)
    Route::patch('/defense-requests/bulk-status', [DefenseRequestController::class, 'bulkUpdateStatus'])
        ->name('defense-requests.bulk-update-status');
    Route::patch('/defense-requests/bulk-priority', [DefenseRequestController::class, 'bulkUpdatePriority'])
        ->name('defense-requests.bulk-update-priority');

    // Adviser suggestions & candidates
    Route::get('/defense-requests/adviser-suggestion', [DefenseRequestController::class, 'adviserSuggestion'])
        ->name('defense-requests.adviser-suggestion');
    Route::get('/defense-requests/adviser-candidates', [DefenseRequestController::class, 'adviserCandidates'])
        ->name('defense-requests.adviser-candidates');

    // Bulk delete (specific)
    Route::delete('/defense-requests/bulk-remove', [DefenseRequestController::class, 'bulkDelete'])
        ->name('defense-requests.bulk-remove');

    // Specific defense-requests routes to avoid being treated as {defenseRequest}
    Route::get('/defense-requests/calendar', [DefenseRequestController::class, 'calendar'])
        ->name('defense-requests.calendar');

    // Pending defense requests
    Route::get('/defense-requests/pending', [DefenseRequestController::class, 'pending'])
        ->name('defense-requests.pending');

    // Secure file access for defense attachments
    Route::get('/storage/defense-attachments/{filename}', [DefenseRequestController::class, 'downloadAttachment'])
        ->name('defense-attachments.download');

    // Lightweight API count endpoint used by sidebar polling
    Route::get('/api/defense-requests/count', [DefenseRequestController::class, 'count'])
        ->name('api.defense-requests.count');

    // API endpoint for real-time defense request updates
    Route::get('/api/defense-request/{defenseRequest}', [DefenseRequestController::class, 'apiShow'])
        ->name('api.defense-request.show');

    // Resource routes - keep after specific routes
    Route::resource('defense-requests', DefenseRequestController::class);

    // Comprehensive Exam (Student)
    Route::get('/comprehensive-exam', [ComprehensiveExamController::class, 'index'])->name('comprehensive-exam.index');
    Route::post('/comprehensive-exam', [ComprehensiveExamController::class, 'store'])->name('comprehensive-exam.store');

    // Honorarium pages
    Route::get('generate-report', function () {
        return Inertia::render('honorarium/generate-report/Index');
    })->name('generate-report.index');

    Route::get('honorarium-summary', function () {
        return Inertia::render('honorarium/honorarium-summary/Index');
    })->name('honorarium-summary.index');

    // Coordinator schedules view
    Route::get('schedules', function () {
        return Inertia::render('coordinator/schedule/Index');
    })->name('schedules.index');

    // System status page (for testing)
    Route::get('/system-status', function () {
        return Inertia::render('system-status');
    })->name('system-status');

    // Notifications page (controller)
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');

    // Panelists Inertia page route & CRUD
    Route::get('/panelists', [PanelistController::class, 'view'])->name('panelists.view');
    Route::post('/panelists', [PanelistController::class, 'store'])->name('panelists.store');
    Route::put('/panelists/{panelist}', [PanelistController::class, 'update'])->name('panelists.update');
    Route::delete('/panelists/{panelist}', [PanelistController::class, 'destroy'])->name('panelists.destroy');
    Route::post('/panelists/bulk-delete', [PanelistController::class, 'bulkDelete'])->name('panelists.bulk-delete');
    Route::post('/panelists/bulk-status', [PanelistController::class, 'bulkUpdateStatus'])->name('panelists.bulk-status');

    // Defense Requirements
    Route::get('/defense-requirements', [DefenseRequirementController::class, 'index'])->name('defense-requirements.index');
    Route::post('/defense-requirements', [DefenseRequirementController::class, 'store'])->name('defense-requirements.store');
    Route::post('/defense-requirements/{id}/unsubmit', [DefenseRequirementController::class, 'unsubmit'])->middleware('auth');

    // All Defense Requirements (adviser/coordinator overview)
    Route::get('/all-defense-requirements', [DefenseRequirementController::class, 'all'])
        ->name('defense-requirements.all');

    // Coordinator Comprehensive Exam (kept inside verified)
    Route::get('/coordinator/compre-exam', [CoordinatorCompreExamController::class, 'index'])
        ->name('coordinator.compre-exam.index');

    // Academic Records (student)
    Route::get('/academic-records', function () {
        return Inertia::render('student/academic-records/academic-records');
    })->name('academic-records.index');

}); // end auth,verified group


// Coordinator routes (authentication only) - comprehensive payment actions
Route::middleware(['auth'])->group(function () {
    Route::get('/coordinator/compre-payment', [CoordinatorComprePaymentController::class, 'index'])
        ->name('coordinator.compre-payment.index');

    Route::post('/coordinator/compre-payment/{id}/approve', [CoordinatorComprePaymentController::class, 'approve'])
        ->name('coordinator.compre-payment.approve');

    Route::post('/coordinator/compre-payment/{id}/reject', [CoordinatorComprePaymentController::class, 'reject'])
        ->name('coordinator.compre-payment.reject');
});


// Coordinator area: defense management and scheduling (auth + verified)
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

    // Remove duplicate/incorrect route:
    // Route::get('/coordinator/defense-requests/approval', [CoordinatorDefenseController::class, 'getRequestsForApproval']);

    // Use this (correct, non-duplicate):
    Route::get('/defense-requests/approval', [CoordinatorDefenseController::class, 'getRequestsForApproval'])
        ->name('defense-requests.approval');

    // Defense Schedule Management (note route name namespaced to avoid collision)
    Route::get('/schedule', [\App\Http\Controllers\DefenseScheduleController::class, 'index'])
        ->name('schedule.index'); // This will be referenced as coordinator.schedule.index via route name prefix

    Route::get('/schedule/calendar', [\App\Http\Controllers\DefenseScheduleController::class, 'calendar'])
        ->name('schedule.calendar');

    Route::post('/schedule/check-conflicts', [\App\Http\Controllers\DefenseScheduleController::class, 'checkConflicts'])
        ->name('schedule.check-conflicts');

    Route::get('/schedule/available-panelists', [\App\Http\Controllers\DefenseScheduleController::class, 'availablePanelists'])
        ->name('schedule.available-panelists');

    // Show all defense requests (table view)
    Route::get('/defense-requests/all', function () {
        $user = Auth::user();
        $coordinatorRoles = ['Coordinator', 'Administrative Assistant', 'Dean'];
        if (! in_array($user->role, $coordinatorRoles)) {
            abort(403, 'Unauthorized');
        }

        // Use the same query as CoordinatorDefenseController@index
        $defenseRequests = \App\Models\DefenseRequest::with([
                'user', 'adviserUser', 'panelsAssignedBy', 'scheduleSetBy'
            ])
            ->whereIn('workflow_state', ['adviser-approved', 'coordinator-review', 'coordinator-approved', 'scheduled'])
            ->orderBy('adviser_reviewed_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'first_name' => $request->first_name,
                    'middle_name' => $request->middle_name,
                    'last_name' => $request->last_name,
                    'program' => $request->program,
                    'thesis_title' => $request->thesis_title,
                    'date_of_defense' => $request->scheduled_date ? $request->scheduled_date->format('Y-m-d') : '',
                    'mode_defense' => $request->defense_mode ?? '',
                    'defense_type' => $request->defense_type,
                    'status' => $request->status,
                    'priority' => $request->priority,
                    'last_status_updated_by' => $request->lastStatusUpdater?->name,
                    'last_status_updated_at' => $request->last_status_updated_at,
                ];
            });

        return Inertia::render('coordinator/submissions/defense-request/show-all-requests', [
            'defenseRequests' => $defenseRequests,
        ]);
    })->name('defense-requests.all');

    Route::get('/coordinator/defense-requests/all', [CoordinatorDefenseController::class, 'allDefenseRequests'])
        ->name('coordinator.defense-requests.all');

    Route::get('/defense-requests/all-defense-requests', [\App\Http\Controllers\CoordinatorDefenseController::class, 'allDefenseRequests'])
        ->name('coordinator.defense-requests.all-defense-requests');

    // Details page
    Route::get('/defense-requests/{defenseRequest}/details', function(DefenseRequest $defenseRequest) {
        $user = Auth::user();
        $roles = ['Coordinator','Administrative Assistant','Dean'];
        if (!$user || !in_array($user->role,$roles)) abort(403);

        $mapped = [
            'id' => $defenseRequest->id,
            'first_name' => $defenseRequest->first_name,
            'middle_name' => $defenseRequest->middle_name,
            'last_name' => $defenseRequest->last_name,
            'school_id' => $defenseRequest->school_id,
            'program' => $defenseRequest->program,
            'thesis_title' => $defenseRequest->thesis_title,
            'defense_type' => $defenseRequest->defense_type,
            'status' => $defenseRequest->status,
            'priority' => $defenseRequest->priority,
            'workflow_state' => $defenseRequest->workflow_state,
            'defense_adviser' => $defenseRequest->defense_adviser,
            'defense_chairperson' => $defenseRequest->defense_chairperson,
            'defense_panelist1' => $defenseRequest->defense_panelist1,
            'defense_panelist2' => $defenseRequest->defense_panelist2,
            'defense_panelist3' => $defenseRequest->defense_panelist3,
            'defense_panelist4' => $defenseRequest->defense_panelist4,
            'scheduled_date' => $defenseRequest->scheduled_date?->format('Y-m-d'),
            'scheduled_time' => $defenseRequest->scheduled_time?->format('H:i'),
            'scheduled_end_time' => $defenseRequest->scheduled_end_time?->format('H:i'),
            'defense_mode' => $defenseRequest->defense_mode,
            'defense_venue' => $defenseRequest->defense_venue,
            'scheduling_notes' => $defenseRequest->scheduling_notes,
            'advisers_endorsement' => $defenseRequest->advisers_endorsement,
            'rec_endorsement' => $defenseRequest->rec_endorsement,
            'proof_of_payment' => $defenseRequest->proof_of_payment,
            'reference_no' => $defenseRequest->reference_no,
            'last_status_updated_by' => $defenseRequest->last_status_updated_by,
            'last_status_updated_at' => $defenseRequest->last_status_updated_at,
            'workflow_history' => $defenseRequest->workflow_history ?? [],
        ];

        return Inertia::render('coordinator/submissions/defense-request/details', [
            'defenseRequest' => $mapped,
            'userRole' => $user->role
        ]);
    })->name('defense-requests.details');

    // JSON endpoints
    Route::post('/defense-requests/{defenseRequest}/assign-panels-json', [CoordinatorDefenseController::class,'assignPanelsJson'])
        ->name('defense-requests.assign-panels-json');
    Route::post('/defense-requests/{defenseRequest}/schedule-json', [CoordinatorDefenseController::class,'scheduleDefenseJson'])
        ->name('defense-requests.schedule-json');
}); // end coordinator group


// Legacy system linking and academic record endpoints
Route::get('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class, 'form'])->name('legacy.link.form');
Route::post('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class, 'link'])->name('legacy.link.submit');
Route::delete('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class, 'unlink'])->name('legacy.link.unlink');

// Academic records (legacy)
Route::get('/legacy/academic-records', [AcademicRecordController::class, 'index'])->name('legacy.academic-records.index');
Route::get('/legacy/academic-records/dashboard', function () {
    return Inertia::render('legacy/AcademicRecordsDashboard');
})->name('legacy.academic-records.dashboard');

// Faculty class list (legacy proxy)
Route::get('/faculty/class-list', [\App\Http\Controllers\InstructorClassListController::class, 'page'])
    ->name('faculty.class-list.page');
Route::get('/legacy/faculty/class-list', [\App\Http\Controllers\InstructorClassListController::class, 'index'])
    ->name('legacy.faculty.class-list');

// Additional route files
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';


Route::get('/api/faculty-search', function (\Illuminate\Http\Request $request) {
    $q = $request->input('q', '');
    return User::where(function($query) use ($q) {
        $query->where('first_name', 'like', "%$q%")
              ->orWhere('last_name', 'like', "%$q%");
    })
    ->where(function($query) {
        $query->where('role', 'Faculty')
              ->orWhereHas('roles', fn($q) => $q->where('name', 'Faculty'));
    })
    ->limit(10)
    ->get(['id', 'first_name', 'middle_name', 'last_name']);
});

// Additional API route for coordinator defense requests
Route::get('/api/coordinator/defense-requests', function () {
    $user = Auth::user();
    $coordinatorRoles = ['Coordinator', 'Administrative Assistant', 'Dean'];
    if (! in_array($user->role, $coordinatorRoles)) {
        abort(403, 'Unauthorized');
    }

    $defenseRequests = \App\Models\DefenseRequest::with([
            'user', 'adviserUser', 'lastStatusUpdater'
        ])
        ->whereIn('workflow_state', ['adviser-approved', 'coordinator-review', 'coordinator-approved', 'scheduled'])
        ->orderBy('adviser_reviewed_at', 'desc')
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($request) {
            return [
                'id' => $request->id,
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'program' => $request->program,
                'thesis_title' => $request->thesis_title,
                'date_of_defense' => $request->scheduled_date ? $request->scheduled_date->format('Y-m-d') : '',
                'mode_defense' => $request->defense_mode ?? '',
                'defense_type' => $request->defense_type,
                'status' => $request->status,
                'priority' => $request->priority,
                'last_status_updated_by' => $request->lastStatusUpdater?->name,
                'last_status_updated_at' => $request->last_status_updated_at,
            ];
        });

    return response()->json($defenseRequests->values());
});

// Find a coordinator group / add near other defense routes:

Route::middleware(['auth'])->group(function () {
    // Panel members JSON for combobox
    Route::get(
        '/coordinator/defense/available-panel-members-json',
        [CoordinatorDefenseController::class,'availablePanelMembersJson']
    )->name('coordinator.defense.available-panel-members-json');
});

// Add after other coordinator routes (ensure auth middleware)
Route::middleware(['auth','verified'])->get(
    '/coordinator/defense/panel-members-all',
    [\App\Http\Controllers\CoordinatorDefenseController::class,'panelMembersAll']
)->name('coordinator.defense.panel-members-all');

// Add (place near other routes):
Route::middleware(['auth'])->get('/api/panel-members', [PanelistController::class,'allCombined'])->name('api.panel-members');

Route::post('/coordinator/defense-requests/{defenseRequest}/approve',[CoordinatorDefenseController::class,'approve'])
    ->middleware('auth');

// Adviser / Coordinator decisions
Route::middleware(['auth','verified'])->group(function () {

    // Adviser / Coordinator decisions (HTML form posts)
    Route::post('/defense-requests/{defenseRequest}/adviser-decision', [DefenseRequestController::class,'adviserDecision'])
        ->name('defense-requests.adviser-decision');

    Route::post('/defense-requests/{defenseRequest}/coordinator-decision',
        [DefenseRequestController::class,'coordinatorDecision'])->name('defense-requests.coordinator-decision');

    // Coordinator JSON endpoints (used by JS)
    Route::post('/coordinator/defense-requests/{defenseRequest}/panels',
        [\App\Http\Controllers\CoordinatorDefenseController::class,'assignPanelsJson'])
        ->name('coordinator.defense.panels');

    Route::post('/coordinator/defense-requests/{defenseRequest}/schedule',
        [\App\Http\Controllers\CoordinatorDefenseController::class,'scheduleDefenseJson'])
        ->name('coordinator.defense.schedule');

    Route::get('/coordinator/defense-requests/all',
        [\App\Http\Controllers\CoordinatorDefenseController::class,'allDefenseRequests'])
        ->name('coordinator.defense.all');

    Route::get('/coordinator/panel-members',
        [\App\Http\Controllers\CoordinatorDefenseController::class,'panelMembersAll'])
        ->name('coordinator.defense.panelMembers');
});

// Coordinator / main index
Route::get('/defense-request', [DefenseRequestController::class,'index'])->name('defense-request.index');

// Adviser / faculty consolidated list
Route::get('/all-defense-requirements', [DefenseRequirementController::class,'all'])
    ->name('defense-requirements.all');

// Create (student)
Route::post('/defense-request', [DefenseRequestController::class,'store'])->name('defense-request.store');

// Adviser decision
Route::post('/defense-requests/{defenseRequest}/adviser-decision',
    [DefenseRequestController::class,'adviserDecision'])->name('defense-requests.adviser-decision');

// Coordinator decision
Route::post('/defense-requests/{defenseRequest}/coordinator-decision',
    [DefenseRequestController::class,'coordinatorDecision'])->name('defense-requests.coordinator-decision');
