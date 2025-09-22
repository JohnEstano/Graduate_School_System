<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DefenseRequestController;
use App\Http\Controllers\DefenseRequirementController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PanelistController;
use App\Http\Controllers\ComprehensiveExamController;
use App\Http\Controllers\PaymentSubmissionController;
use App\Http\Controllers\CoordinatorCompreExamController;
use App\Http\Controllers\CoordinatorComprePaymentController;
use App\Http\Controllers\AcademicRecordController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\CoordinatorDefenseController;
use App\Models\User;
use App\Models\DefenseRequest;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ScheduleEventController;

/*
|--------------------------------------------------------------------------
| Public / Guest
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware('guest')->group(function () {
    // BASIC login page (adjust Inertia component path to what you actually have)
    Route::get('/login', fn() => Inertia::render('auth/Login'))->name('login');
    // Uncomment if you allow registration
    // Route::get('/register', fn() => Inertia::render('auth/Register'))->name('register');
});

/*
|--------------------------------------------------------------------------
| Google OAuth
|--------------------------------------------------------------------------
*/
Route::get('/auth/google/redirect', [GoogleController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('google.callback');
Route::get('/auth/status/google-verified', [\App\Http\Controllers\Auth\AuthStatusController::class, 'googleVerified'])
    ->name('auth.status.google-verified');

/*
|--------------------------------------------------------------------------
| Debug / Diagnostics (optional)
|--------------------------------------------------------------------------
*/
Route::get('/test-upload-limits', function () {
    return response()->json([
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size'       => ini_get('post_max_size'),
        'memory_limit'        => ini_get('memory_limit'),
        'max_execution_time'  => ini_get('max_execution_time'),
        'max_input_time'      => ini_get('max_input_time'),
        'upload_config'       => config('upload'),
    ]);
});

/*
|--------------------------------------------------------------------------
| Authenticated + Verified
|--------------------------------------------------------------------------
*/
Route::middleware(['auth','verified'])->group(function () {

    Route::get('/dashboard', [DashboardController::class,'index'])->name('dashboard');

    // Logout
    Route::post('/logout', function(\Illuminate\Http\Request $r){
        Auth::logout();
        $r->session()->invalidate();
        $r->session()->regenerateToken();
        return redirect()->route('login');
    })->name('logout');

    /* Notifications */
    Route::get('/notification', fn() => Inertia::render('notification/Index'))->name('notification.index');
    Route::get('/notifications', [NotificationController::class,'index'])->name('notifications.index');

    /* Payments */
    Route::get('/payment', [PaymentSubmissionController::class,'index'])->name('payment.index');
    Route::post('/payment', [PaymentSubmissionController::class,'store'])->name('payment.store');

    /* Student schedule page */
    Route::get('/schedule', [ScheduleController::class,'index'])->name('schedule.index');
    Route::get('/schedules', fn() => redirect()->route('schedule.index'));

    // Events API
    Route::get('/api/calendar/events', [ScheduleEventController::class,'list'])->name('api.calendar.events');
    Route::post('/api/calendar/events', [ScheduleEventController::class,'store'])->name('api.calendar.events.store');
    Route::put('/api/calendar/events/{event}', [ScheduleEventController::class,'update'])->name('api.calendar.events.update');
    Route::patch('/api/calendar/events/{event}/move', [ScheduleEventController::class,'move'])->name('api.calendar.events.move');
    Route::delete('/api/calendar/events/{event}', [ScheduleEventController::class,'destroy'])->name('api.calendar.events.delete');

    /* Defense Requirements (student submit) */
    Route::get('/defense-requirements', [DefenseRequirementController::class,'index'])->name('defense-requirements.index');
    Route::post('/defense-requirements', [DefenseRequirementController::class,'store'])->name('defense-requirements.store');
    Route::post('/defense-requirements/{id}/unsubmit', [DefenseRequirementController::class,'unsubmit'])
        ->name('defense-requirements.unsubmit');

    /* Adviser view of all student submissions */
    Route::get('/all-defense-requirements', [DefenseRequirementController::class,'all'])
        ->name('defense-requirements.all');

    /* Defense Request (main workflow) */
    Route::get('/defense-request', [DefenseRequestController::class,'index'])->name('defense-request.index');
    // Alias so frontend calls to /defense-requests (plural) also hit the same index action (JSON or Inertia)
    Route::get('/defense-requests', [DefenseRequestController::class,'index'])->name('defense-requests.index');
    Route::post('/defense-request', [DefenseRequestController::class,'store'])->name('defense-request.store');

    /* Workflow actions */
    Route::post('/defense-requests/{defenseRequest}/adviser-decision',
        [DefenseRequestController::class,'adviserDecision'])->name('defense-requests.adviser-decision');
    Route::post('/defense-requests/{defenseRequest}/coordinator-decision',
        [DefenseRequestController::class,'coordinatorDecision'])->name('defense-requests.coordinator-decision');

    /* Status / priority */
    Route::patch('/defense-requests/{defenseRequest}/status',
        [DefenseRequestController::class,'updateStatus'])->name('defense-requests.update-status');
    Route::patch('/defense-requests/{defenseRequest}/priority',
        [DefenseRequestController::class,'updatePriority'])->name('defense-requests.update-priority');

    /* Bulk */
    Route::patch('/defense-requests/bulk-status',
        [DefenseRequestController::class,'bulkUpdateStatus'])->name('defense-requests.bulk-update-status');
    Route::patch('/defense-requests/bulk-priority',
        [DefenseRequestController::class,'bulkUpdatePriority'])->name('defense-requests.bulk-update-priority');
    Route::delete('/defense-requests/bulk-remove',
        [DefenseRequestController::class,'bulkDelete'])->name('defense-requests.bulk-remove');

    /* Adviser helpers */
    Route::get('/defense-requests/adviser-suggestion',
        [DefenseRequestController::class,'adviserSuggestion'])->name('defense-requests.adviser-suggestion');
    Route::get('/defense-requests/adviser-candidates',
        [DefenseRequestController::class,'adviserCandidates'])->name('defense-requests.adviser-candidates');

    /* Lightweight APIs */
    Route::get('/defense-requests/calendar', [DefenseRequestController::class,'calendar'])->name('defense-requests.calendar');
    Route::get('/defense-requests/pending', [DefenseRequestController::class,'pending'])->name('defense-requests.pending');
    Route::get('/api/defense-requests/count', [DefenseRequestController::class,'count'])->name('api.defense-requests.count');
    Route::get('/api/defense-request/{defenseRequest}', [DefenseRequestController::class,'apiShow'])->name('api.defense-request.show');

    /* Attachments download */
    Route::get('/storage/defense-attachments/{filename}',
        [DefenseRequestController::class,'downloadAttachment'])->name('defense-attachments.download');

    /* Resource (keep after specific routes) */
    Route::resource('defense-requests', DefenseRequestController::class)
        ->except(['index','create','edit']);

    /* Panelists CRUD */
    Route::get('/panelists', [PanelistController::class,'view'])->name('panelists.view');
    Route::post('/panelists', [PanelistController::class,'store'])->name('panelists.store');
    Route::put('/panelists/{panelist}', [PanelistController::class,'update'])->name('panelists.update');
    Route::delete('/panelists/{panelist}', [PanelistController::class,'destroy'])->name('panelists.destroy');
    Route::post('/panelists/bulk-delete', [PanelistController::class,'bulkDelete'])->name('panelists.bulk-delete');
    Route::post('/panelists/bulk-status', [PanelistController::class,'bulkUpdateStatus'])->name('panelists.bulk-status');

    /* Comprehensive Exam (student) */
    Route::get('/comprehensive-exam', [ComprehensiveExamController::class,'index'])->name('comprehensive-exam.index');
    Route::post('/comprehensive-exam', [ComprehensiveExamController::class,'store'])->name('comprehensive-exam.store');

    /* Coordinator Comprehensive Exam */
    Route::get('/coordinator/compre-exam', [CoordinatorCompreExamController::class,'index'])
        ->name('coordinator.compre-exam.index');
    Route::get('/coordinator/compre-payment', [CoordinatorComprePaymentController::class,'index'])
        ->name('coordinator.compre-payment.index');
    Route::post('/coordinator/compre-payment/{id}/approve', [CoordinatorComprePaymentController::class,'approve'])
        ->name('coordinator.compre-payment.approve');
    Route::post('/coordinator/compre-payment/{id}/reject', [CoordinatorComprePaymentController::class,'reject'])
        ->name('coordinator.compre-payment.reject');

    /* Honorarium / Reports */
    Route::get('/generate-report', fn() => Inertia::render('honorarium/generate-report/Index'))
        ->name('generate-report.index');
    Route::get('/honorarium-summary', fn() => Inertia::render('honorarium/honorarium-summary/Index'))
        ->name('honorarium-summary.index');

    /* Academic Records */
    Route::get('/academic-records', fn() => Inertia::render('student/academic-records/academic-records'))
        ->name('academic-records.index');

    /* System Status */
    Route::get('/system-status', fn() => Inertia::render('system-status'))->name('system-status');

    /* Coordinator Defense Management */
    Route::prefix('coordinator')->name('coordinator.')->group(function () {
        Route::get('/defense-management', [CoordinatorDefenseController::class,'index'])->name('defense.index');

        Route::get('/defense/{defenseRequest}', [CoordinatorDefenseController::class,'show'])->name('defense.show');
        Route::post('/defense/{defenseRequest}/assign-panels', [CoordinatorDefenseController::class,'assignPanels'])
            ->name('defense.assign-panels');
        Route::post('/defense/{defenseRequest}/schedule', [CoordinatorDefenseController::class,'scheduleDefense'])
            ->name('defense.schedule');
        Route::post('/defense/{defenseRequest}/notify', [CoordinatorDefenseController::class,'sendNotifications'])
            ->name('defense.notify');
        Route::put('/defense/{defenseRequest}', [CoordinatorDefenseController::class,'updateDefense'])
            ->name('defense.update');

        Route::get('/defense-requests/approval', [CoordinatorDefenseController::class,'getRequestsForApproval'])
            ->name('defense-requests.approval');

        Route::get('/schedule', [\App\Http\Controllers\DefenseScheduleController::class,'index'])
            ->name('schedule.index');
        Route::get('/schedule/calendar', [\App\Http\Controllers\DefenseScheduleController::class,'calendar'])
            ->name('schedule.calendar');
        Route::post('/schedule/check-conflicts', [\App\Http\Controllers\DefenseScheduleController::class,'checkConflicts'])
            ->name('schedule.check-conflicts');
        Route::get('/schedule/available-panelists', [\App\Http\Controllers\DefenseScheduleController::class,'availablePanelists'])
            ->name('schedule.available-panelists');

        Route::get('/defense-requests/all', [CoordinatorDefenseController::class,'allDefenseRequests'])
            ->name('defense-requests.all');

        Route::post('/defense-requests/{defenseRequest}/panels', [CoordinatorDefenseController::class,'assignPanelsJson'])
            ->name('defense.panels.json');
        Route::post('/defense-requests/{defenseRequest}/schedule-json', [CoordinatorDefenseController::class,'scheduleDefenseJson'])
            ->name('defense.schedule.json');
        Route::get('/panel-members', [CoordinatorDefenseController::class,'panelMembersAll'])
            ->name('defense.panel-members');

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
                'scheduled_time' => $defenseRequest->scheduled_time,
                'scheduled_end_time' => $defenseRequest->scheduled_end_time,
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
    });

    /* Profile */
    Route::get('/profile', function () {
        return Inertia::render('profile/Edit');
    })->name('profile.edit');
});

/*
|--------------------------------------------------------------------------
| Auth (NOT necessarily verified) utility API
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {
    Route::get('/api/panel-members', [PanelistController::class,'allCombined'])->name('api.panel-members');
    Route::get('/adviser/defense-requests', [DefenseRequestController::class,'adviserQueue'])
        ->name('adviser.defense-requests');
});

/*
|--------------------------------------------------------------------------
| Public / Shared API
|--------------------------------------------------------------------------
*/
Route::get('/api/faculty-search', function (\Illuminate\Http\Request $request) {
    $q = $request->input('q','');
    return User::where(function($query) use ($q) {
            $query->where('first_name','like',"%$q%")
                  ->orWhere('last_name','like',"%$q%");
        })
        ->where(function($query) {
            $query->where('role','Faculty')
                  ->orWhereHas('roles', fn($q) => $q->where('name','Faculty'));
        })
        ->limit(10)
        ->get(['id','first_name','middle_name','last_name']);
})->name('api.faculty-search');

Route::get('/api/coordinator/defense-requests', function () {
    $user = Auth::user();
    $roles = ['Coordinator','Administrative Assistant','Dean'];
    if (!$user || !in_array($user->role,$roles)) abort(403);

    $records = DefenseRequest::query()
        ->whereIn('workflow_state',[
            'adviser-approved',
            'coordinator-review',
            'coordinator-approved',
            'coordinator-rejected',
            'panels-assigned',
            'scheduled'
        ])
        ->orderBy('adviser_reviewed_at','desc')
        ->get();

    return $records->map(fn($r)=>[
        'id'=>$r->id,
        'thesis_title'=>$r->thesis_title,
        'workflow_state'=>$r->workflow_state,
        'status'=>$r->status,
    ]);
})->name('api.coordinator.defense-requests');

/*
|--------------------------------------------------------------------------
| Legacy / Extra
|--------------------------------------------------------------------------
*/
Route::get('/legacy/academic-records', [AcademicRecordController::class,'index'])
    ->name('legacy.academic-records.index');
Route::get('/legacy/academic-records/dashboard', fn() => Inertia::render('legacy/AcademicRecordsDashboard'))
    ->name('legacy.academic-records.dashboard');
Route::get('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class,'form'])->name('legacy.link.form');
Route::post('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class,'link'])->name('legacy.link.submit');
Route::delete('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class,'unlink'])->name('legacy.link.unlink');
Route::get('/faculty/class-list', [\App\Http\Controllers\InstructorClassListController::class,'page'])
    ->name('faculty.class-list.page');
Route::get('/legacy/faculty/class-list', [\App\Http\Controllers\InstructorClassListController::class,'index'])
    ->name('legacy.faculty.class-list');

/*
|--------------------------------------------------------------------------
| Include default auth scaffolding (login, password, etc.)
|--------------------------------------------------------------------------
*/
if (file_exists(__DIR__.'/auth.php')) {
    require __DIR__.'/auth.php';
}
if (file_exists(__DIR__.'/settings.php')) require __DIR__.'/settings.php';
