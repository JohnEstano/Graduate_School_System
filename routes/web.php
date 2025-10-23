<?php



use App\Http\Controllers\HonorariumSummaryController;
use App\Http\Controllers\StudentRecordController;
use App\Http\Controllers\EmailsController;
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
use App\Http\Controllers\CoordinatorDefenseController;
use App\Models\User;
use App\Models\DefenseRequest;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ScheduleEventController;
use App\Http\Controllers\DocumentTemplateController;
use App\Http\Controllers\UserSignatureController;
use App\Http\Controllers\GeneratedDocumentController;
use App\Http\Controllers\AdviserStudentController;
use App\Http\Controllers\PanelistHonorariumSpecController;
use App\Http\Controllers\CoordinatorAdviserController;
use App\Http\Controllers\PaymentRateController;
use App\Models\PaymentRate;
use App\Http\Controllers\AA\PaymentVerificationController;
use App\Http\Controllers\Assistant\DefenseBatchController;

/*
|--------------------------------------------------------------------------
| Public / Guest
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::post('/programs/{programId}/panelists', [HonorariumSummaryController::class, 'storePanelist'])
    ->name('programs.panelists.store');

// The routes here means that to be rendered or accessed, you need to login or have prior authentication.
Route::middleware('guest')->group(function () {
    // BASIC login page (adjust Inertia component path to what you actually have)
    Route::get('/login', fn() => Inertia::render('auth/Login'))->name('login');
    // Uncomment if you allow registration
    // Route::get('/register', fn() => Inertia::render('auth/Register'))->name('register');
});

/*
|--------------------------------------------------------------------------
| Debug / Diagnostics (optional)
|--------------------------------------------------------------------------
*/
Route::get('/test-upload-limits', function () {
    return response()->json([
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'max_input_time' => ini_get('max_input_time'),
        'upload_config' => config('upload'),
    ]);
});

/*
|--------------------------------------------------------------------------
| Authenticated + Verified
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/api/coordinator/code', [CoordinatorAdviserController::class, 'getCoordinatorCode']);
    Route::post('/api/adviser/register-with-coordinator-code', [\App\Http\Controllers\CoordinatorAdviserController::class, 'registerWithCode']);
    Route::get('/coordinator/defense-requests/all-defense-requests', [\App\Http\Controllers\DefenseRequestController::class, 'allForCoordinator'])->middleware('auth');
    Route::get('/api/coordinator/code', [CoordinatorAdviserController::class, 'getCoordinatorCode']);
    Route::post('/api/adviser/register-with-coordinator-code', [\App\Http\Controllers\CoordinatorAdviserController::class, 'registerWithCode']);

    // Coordinator Adviser Management Routes
    Route::get('/api/coordinator/advisers', [CoordinatorAdviserController::class, 'index']);
    Route::get('/api/coordinator/advisers/search', [CoordinatorAdviserController::class, 'search']);
    Route::put('/api/coordinator/advisers/{id}', [CoordinatorAdviserController::class, 'update']);
    Route::post('/api/coordinator/advisers', [CoordinatorAdviserController::class, 'store']);
    Route::post('/api/coordinator/advisers/{id}/send-invitation', [CoordinatorAdviserController::class, 'sendInvitation']);
    Route::delete('/api/coordinator/advisers/{id}', [CoordinatorAdviserController::class, 'destroy']);

    // Coordinator manages adviser-student relationships (use CoordinatorAdviserController)
    Route::get('/api/coordinator/advisers/{adviser}/students', [\App\Http\Controllers\CoordinatorAdviserController::class, 'students']);
    Route::get('/api/coordinator/advisers/{adviser}/pending-students', [\App\Http\Controllers\CoordinatorAdviserController::class, 'pendingStudents']);
    Route::post('/api/coordinator/advisers/{adviser}/students', [\App\Http\Controllers\CoordinatorAdviserController::class, 'storeStudent']);
    Route::delete('/api/coordinator/advisers/{adviser}/students/{student}', [\App\Http\Controllers\CoordinatorAdviserController::class, 'destroyStudent']);
    Route::get('/api/coordinator/students/search', [CoordinatorAdviserController::class, 'searchStudents']);


 

    //PAYMENTVERIFIATION AA
    Route::prefix('aa')->group(function () {
        Route::get('/payment-verifications', [PaymentVerificationController::class, 'index'])->name('aa.payment-verifications');
        Route::post('/payment-verifications/{id}/status', [PaymentVerificationController::class, 'updateStatus'])->name('aa.payment-verifications.update-status');
        Route::post('/payment-verifications/batch', [PaymentVerificationController::class, 'addToBatch'])->name('aa.payment-verifications.batch');
        Route::get('/payment-batch/{batchId}/export', [PaymentVerificationController::class, 'exportBatch'])->name('aa.payment-batch.export');
        Route::post('/payment-verifications/bulk-update', [PaymentVerificationController::class, 'bulkUpdateStatus']);


    });

    Route::get('/assistant/defense-batches', [\App\Http\Controllers\Assistant\DefenseBatchController::class, 'index']);
    Route::post('/assistant/defense-batches', [\App\Http\Controllers\Assistant\DefenseBatchController::class, 'store']);
    Route::post('/assistant/defense-batches/{batch}/status', [\App\Http\Controllers\Assistant\DefenseBatchController::class, 'updateStatus']);


    //PAYMENT RATESS ETC.
    Route::post('/dean/payment-rates', [\App\Http\Controllers\PaymentRateController::class, 'update'])
        ->name('dean.payment-rates.update');
    Route::get('/dean/payment-rates', [\App\Http\Controllers\PaymentRateController::class, 'index'])
        ->name('dean.payment-rates.index');
    Route::get('/dean/payment-rates/data', [\App\Http\Controllers\PaymentRateController::class, 'data'])
        ->name('dean.payment-rates.data');


    // Settings: Document Templates (Dean / Coordinator only)
    Route::get('/settings/documents', function () {
        abort_unless(in_array(Auth::user()->role, ['Dean', 'Coordinator']), 403);
        return Inertia::render('settings/documents/Index');
    })->name('settings.documents');

    Route::get('/settings/documents/{template}/edit', function (\App\Models\DocumentTemplate $template) {
        abort_unless(in_array(Auth::user()->role, ['Dean', 'Coordinator']), 403);
        return Inertia::render('settings/documents/TemplateEditor', [
            'templateId' => $template->id,
            'template' => $template
        ]);
    })->name('settings.documents.edit');

















    // HONORARIUM ROUTES
    // Page 1 - List all programs



    
Route::get('/honorarium/individual-record/{programId}', [HonorariumSummaryController::class, 'show'])
    ->name('honorarium.individual-record');


    Route::get('/honorarium', [HonorariumSummaryController::class, 'index']) 
        ->name('honorarium.index'); 

    Route::get('/honorarium/individual-record/{programId}', [HonorariumSummaryController::class, 'show'])
        ->name('honorarium-record.show');
    
    // Download CSV for a program
    // API route
    Route::get('/api/honorarium/{programId}/download-pdf', [HonorariumSummaryController::class, 'downloadPdfApi']);

    // Web route
    Route::get('/honorarium/{programId}/download-pdf', [HonorariumSummaryController::class, 'downloadProgramPdf'])
        ->name('honorarium.downloadPDF');

    // For program filter
    Route::get('/student-records/program/{program}', [StudentRecordController::class, 'getByProgram'])
        ->name('student-records.getByProgram');

    // For DOCX download
    Route::get('/student-records/{id}/download-docs', [StudentRecordController::class, 'downloadDocs'])
        ->name('student-records.downloadDocs');





    























    //student-records route
    Route::get('/student-records', [StudentRecordController::class, 'index'])->name('student-records.index');
    Route::get('/student-records/{id}', [StudentRecordController::class, 'show'])->name('student-records.show');
    Route::put('/student-records/{studentRecord}', [StudentRecordController::class, 'update'])->name('student-records.update');
    Route::delete('/student-records/{studentRecord}', [StudentRecordController::class, 'destroy'])->name('student-records.destroy');
    
    Route::get('/payments/{id}/download-pdf', [StudentRecordController::class, 'downloadPdf'])
        ->name('payments.downloadPdf');













    



    //Emails Controller
    Route::get('send-mail', [EmailsController::class, 'welcomeEmail']);

    // Settings: Signatures (any staff who can sign)
    Route::get('/settings/signatures', function () {
        return Inertia::render('settings/signatures/Index');
    })->name('settings.signatures');

    // Manual (debug) generation for a defense request
    Route::post(
        '/defense-requests/{defenseRequest}/generate-docs',
        [GeneratedDocumentController::class, 'generateNow']
    )
        ->name('defense-requests.generate-docs');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    /* Coordinator Program Assignments - Super Admin only */
    Route::prefix('api/coordinator-assignments')->group(function () {
        Route::get('/', [\App\Http\Controllers\CoordinatorProgramAssignmentController::class, 'index'])->name('coordinator-assignments.index');
        Route::get('/coordinators', [\App\Http\Controllers\CoordinatorProgramAssignmentController::class, 'getCoordinators'])->name('coordinator-assignments.coordinators');
        Route::get('/programs', [\App\Http\Controllers\CoordinatorProgramAssignmentController::class, 'getAvailablePrograms'])->name('coordinator-assignments.programs');
        Route::post('/', [\App\Http\Controllers\CoordinatorProgramAssignmentController::class, 'store'])->name('coordinator-assignments.store');
        Route::delete('/{id}', [\App\Http\Controllers\CoordinatorProgramAssignmentController::class, 'destroy'])->name('coordinator-assignments.destroy');
    });

    // Logout
    Route::post('/logout', function (\Illuminate\Http\Request $r) {
        Auth::logout();
        $r->session()->invalidate();
        $r->session()->regenerateToken();
        return redirect()->route('login');
    })->name('logout');

    /* Notifications */
    Route::get('/notification', fn() => Inertia::render('notification/Index'))->name('notification.index');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');

    /* Payments */
    Route::get('/payment', [PaymentSubmissionController::class, 'index'])->name('payment.index');
    Route::post('/payment', [PaymentSubmissionController::class, 'store'])->name('payment.store');

    /* Student schedule page */
    Route::get('/schedule', [ScheduleController::class, 'index'])->name('schedule.index');
    Route::get('/schedules', fn() => redirect()->route('schedule.index'));

    // Events API
    Route::get('/api/calendar/events', [ScheduleEventController::class, 'list'])->name('api.calendar.events');
    Route::post('/api/calendar/events', [ScheduleEventController::class, 'store'])->name('api.calendar.events.store');
    Route::put('/api/calendar/events/{event}', [ScheduleEventController::class, 'update'])->name('api.calendar.events.update');
    Route::patch('/api/calendar/events/{event}/move', [ScheduleEventController::class, 'move'])->name('api.calendar.events.move');
    Route::delete('/api/calendar/events/{event}', [ScheduleEventController::class, 'destroy'])->name('api.calendar.events.delete');

    /* Defense Requirements (student submit) */
    Route::get('/defense-requirements', [DefenseRequirementController::class, 'index'])->name('defense-requirements.index');
    Route::post('/defense-requirements', [DefenseRequirementController::class, 'store'])->name('defense-requirements.store');
    Route::post('/defense-requirements/{id}/unsubmit', [DefenseRequirementController::class, 'unsubmit'])
        ->name('defense-requirements.unsubmit');

    /* Adviser view of all student submissions */
    Route::get('/all-defense-requirements', [DefenseRequirementController::class, 'all'])
        ->name('defense-requirements.all');

    /* Defense Request (main workflow) */
    Route::get('/defense-request', [DefenseRequestController::class, 'index'])->name('defense-request.index');
    Route::get('/defense-requests', [DefenseRequestController::class, 'index'])->name('defense-requests.index');
    Route::post('/defense-request', [DefenseRequestController::class, 'store'])->name('defense-request.store');

    /* Workflow actions */
    Route::post(
        '/defense-requests/{defenseRequest}/adviser-decision',
        [DefenseRequestController::class, 'adviserDecision']
    )->name('defense-requests.adviser-decision');
    
    Route::post(
        '/defense-requests/{defenseRequest}/coordinator-decision',
        [DefenseRequestController::class, 'coordinatorDecision']
    )->name('defense-requests.coordinator-decision');

    // ADD THIS ROUTE - Mark defense as completed
    Route::post(
        '/defense-requests/{defenseRequest}/complete',
        [DefenseRequestController::class, 'completeDefense']
    )->name('defense-requests.complete')
    ->middleware(['auth', 'verified']);

    /* Status / priority */
    Route::patch(
        '/defense-requests/{defenseRequest}/status',
        [DefenseRequestController::class, 'updateStatus']
    )->name('defense-requests.update-status');
    Route::patch(
        '/defense-requests/{defenseRequest}/priority',
        [DefenseRequestController::class, 'updatePriority']
    )->name('defense-requests.update-priority');

    /* Bulk */
    Route::patch(
        '/defense-requests/bulk-status',
        [DefenseRequestController::class, 'bulkUpdateStatus']
    )->name('defense-requests.bulk-update-status');
    Route::patch(
        '/defense-requests/bulk-priority',
        [DefenseRequestController::class, 'bulkUpdatePriority']
    )->name('defense-requests.bulk-update-priority');
    Route::delete(
        '/defense-requests/bulk-remove',
        [DefenseRequestController::class, 'bulkDelete']
    )->name('defense-requests.bulk-remove');
    Route::post('/defense-requests/bulk-approve', [DefenseRequestController::class, 'bulkApprove'])
        ->name('defense-requests.bulk-approve');
    Route::post('/defense-requests/bulk-reject', [DefenseRequestController::class, 'bulkReject'])
        ->name('defense-requests.bulk-reject');
    Route::post('/defense-requests/bulk-retrieve', [DefenseRequestController::class, 'bulkRetrieve'])
        ->name('defense-requests.bulk-retrieve');

    /* Adviser helpers */
    Route::get(
        '/defense-requests/adviser-suggestion',
        [DefenseRequestController::class, 'adviserSuggestion']
    )->name('defense-requests.adviser-suggestion');
    Route::get(
        '/defense-requests/adviser-candidates',
        [DefenseRequestController::class, 'adviserCandidates']
    )->name('defense-requests.adviser-candidates');

    /* Lightweight APIs */
    Route::get('/defense-requests/calendar', [DefenseRequestController::class, 'calendar'])->name('defense-requests.calendar');
    Route::get('/defense-requests/pending', [DefenseRequestController::class, 'pending'])->name('defense-requests.pending');
    Route::get('/api/defense-requests/count', [DefenseRequestController::class, 'count'])->name('api.defense-requests.count');
    Route::get('/api/defense-request/{defenseRequest}', [DefenseRequestController::class, 'apiShow'])->name('api.defense-request.show');

    /* Attachments download */
    Route::get(
        '/storage/defense-attachments/{filename}',
        [DefenseRequestController::class, 'downloadAttachment']
    )->name('defense-attachments.download');

    /* Resource (keep after specific routes) */
    Route::resource('defense-requests', DefenseRequestController::class)
        ->except(['index', 'create', 'edit']);

    /* Panelists CRUD */
    Route::get('/panelists', [PanelistController::class, 'view'])->name('panelists.view');
    Route::post('/panelists', [PanelistController::class, 'store'])->name('panelists.store');
    Route::put('/panelists/{panelist}', [PanelistController::class, 'update'])->name('panelists.update');
    Route::delete('/panelists/{panelist}', [PanelistController::class, 'destroy'])->name('panelists.destroy');
    Route::post('/panelists/bulk-delete', [PanelistController::class, 'bulkDelete'])->name('panelists.bulk-delete');
    Route::post('/panelists/bulk-status', [PanelistController::class, 'bulkUpdateStatus'])->name('panelists.bulk-status');

    /* Comprehensive Exam (student) */
    Route::get('/comprehensive-exam', [ComprehensiveExamController::class, 'index'])->name('comprehensive-exam.index');
    Route::post('/comprehensive-exam', [ComprehensiveExamController::class, 'store'])->name('comprehensive-exam.store');

    /* Coordinator Comprehensive Exam */
    Route::get('/coordinator/compre-exam', [CoordinatorCompreExamController::class, 'index'])
        ->name('coordinator.compre-exam.index');
    Route::get('/coordinator/compre-payment', [CoordinatorComprePaymentController::class, 'index'])
        ->name('coordinator.compre-payment.index');
    Route::post('/coordinator/compre-payment/{id}/approve', [CoordinatorComprePaymentController::class, 'approve'])
        ->name('coordinator.compre-payment.approve');
    Route::post('/coordinator/compre-payment/{id}/reject', [CoordinatorComprePaymentController::class, 'reject'])
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
        Route::get('/defense-management', [CoordinatorDefenseController::class, 'index'])->name('defense.index');

        Route::get('/defense/{defenseRequest}', [CoordinatorDefenseController::class, 'show'])->name('defense.show');
        Route::post('/defense/{defenseRequest}/assign-panels', [CoordinatorDefenseController::class, 'assignPanels'])
            ->name('defense.assign-panels');
        Route::post('/defense/{defenseRequest}/schedule', [CoordinatorDefenseController::class, 'scheduleDefense'])
            ->name('defense.schedule');
        Route::post('/defense/{defenseRequest}/notify', [CoordinatorDefenseController::class, 'sendNotifications'])
            ->name('defense.notify');
        Route::put('/defense/{defenseRequest}', [CoordinatorDefenseController::class, 'updateDefense'])
            ->name('defense.update');

        Route::get('/defense-requests/approval', [CoordinatorDefenseController::class, 'getRequestsForApproval'])
            ->name('defense-requests.approval');

        Route::get('/schedule', [\App\Http\Controllers\DefenseScheduleController::class, 'index'])
            ->name('schedule.index');
        Route::get('/schedule/calendar', [\App\Http\Controllers\DefenseScheduleController::class, 'calendar'])
            ->name('schedule.calendar');
        Route::post('/schedule/check-conflicts', [\App\Http\Controllers\DefenseScheduleController::class, 'checkConflicts'])
            ->name('schedule.check-conflicts');
        Route::get('/schedule/available-panelists', [\App\Http\Controllers\DefenseScheduleController::class, 'availablePanelists'])
            ->name('schedule.available-panelists');

        Route::get('/defense-requests/all', [CoordinatorDefenseController::class, 'allDefenseRequests'])
            ->name('defense-requests.all');

        Route::post('/defense-requests/{defenseRequest}/panels', [CoordinatorDefenseController::class, 'assignPanelsJson'])
            ->name('defense.panels.json');
        Route::post('/defense-requests/{defenseRequest}/schedule-json', [CoordinatorDefenseController::class, 'scheduleDefenseJson'])
            ->name('defense.schedule.json');
        Route::get('/panel-members', [CoordinatorDefenseController::class, 'panelMembersAll'])
            ->name('defense.panel-members');

        Route::get('/defense-requests/{defenseRequest}/details', [CoordinatorDefenseController::class, 'details'])
            ->name('defense-requests.details'); // <-- FIXED: was 'coordinator.defense-requests.details'
    });

    /* Profile */
    Route::get('/profile', function () {
        return Inertia::render('profile/Edit');
    })->name('profile.edit');

    // Add this route for the adviser students list page
    Route::get('/adviser/students-list', function () {
        return Inertia::render('adviser/students-list/Index');
    })->name('adviser.students-list');

    // Add this line if missing
    Route::get('/api/adviser/code', [AdviserStudentController::class, 'getAdviserCode']);

    Route::get('/coordinator/adviser-list', function () {
        return Inertia::render('coordinator/adviser-list/Index');
    })->name('coordinator.adviser-list');
});

/*
|--------------------------------------------------------------------------
| Auth (NOT necessarily verified) utility API
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {
    Route::get('/api/panel-members', [PanelistController::class, 'allCombined'])->name('api.panel-members');
    Route::get('/adviser/defense-requests', [DefenseRequestController::class, 'adviserQueue'])
        ->name('adviser.defense-requests');

    Route::get('/api/document-templates', [DocumentTemplateController::class, 'index']);
    Route::get('/api/document-templates/{template}', [DocumentTemplateController::class, 'show']);
    Route::post('/api/document-templates', [DocumentTemplateController::class, 'store']);
    Route::put('/api/document-templates/{template}/fields', [DocumentTemplateController::class, 'updateFields']);
    Route::delete('/api/document-templates/{template}', [DocumentTemplateController::class, 'destroy']);

    Route::get('/api/signatures', [UserSignatureController::class, 'index']);
    Route::post('/api/signatures', [UserSignatureController::class, 'store']);
    Route::patch('/api/signatures/{signature}/activate', [UserSignatureController::class, 'activate']);

    Route::get('/generated-documents/{doc}', [GeneratedDocumentController::class, 'show'])
        ->name('generated-documents.show');
});

/*
|--------------------------------------------------------------------------
| Public / Shared API
|--------------------------------------------------------------------------
*/
Route::get('/api/faculty-search', function (\Illuminate\Http\Request $request) {
    $q = $request->input('q', '');
    return User::where(function ($query) use ($q) {
        $query->where('first_name', 'like', "%$q%")
            ->orWhere('last_name', 'like', "%$q%");
    })
        ->where(function ($query) {
            $query->where('role', 'Faculty')
                ->orWhereHas('roles', fn($q) => $q->where('name', 'Faculty'));
        })
        ->limit(10)
        ->get(['id', 'first_name', 'middle_name', 'last_name']);
})->name('api.faculty-search');

Route::get('/api/coordinator/defense-requests', function () {
    $user = Auth::user();
    $roles = ['Coordinator', 'Administrative Assistant', 'Dean'];
    if (!$user || !in_array($user->role, $roles))
        abort(403);

    $records = DefenseRequest::query()
        ->whereIn('workflow_state', [
            'adviser-approved',
            'coordinator-review',
            'coordinator-approved',
            'coordinator-rejected',
            'panels-assigned',
            'scheduled'
        ])
        ->orderBy('adviser_reviewed_at', 'desc')
        ->get();

    return $records->map(fn($r) => [
        'id' => $r->id,
        'thesis_title' => $r->thesis_title,
        'workflow_state' => $r->workflow_state,
        'status' => $r->status,
    ]);
})->name('api.coordinator.defense-requests');

/*
|--------------------------------------------------------------------------
| Legacy / Extra
|--------------------------------------------------------------------------
*/
Route::get('/legacy/academic-records', [AcademicRecordController::class, 'index'])
    ->name('legacy.academic-records.index');
Route::get('/legacy/academic-records/dashboard', fn() => Inertia::render('legacy/AcademicRecordsDashboard'))
    ->name('legacy.academic-records.dashboard');
Route::get('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class, 'form'])->name('legacy.link.form');
Route::post('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class, 'link'])->name('legacy.link.submit');
Route::delete('/legacy/link', [\App\Http\Controllers\LegacyLinkController::class, 'unlink'])->name('legacy.link.unlink');
Route::get('/faculty/class-list', [\App\Http\Controllers\InstructorClassListController::class, 'page'])
    ->name('faculty.class-list.page');
Route::get('/legacy/faculty/class-list', [\App\Http\Controllers\InstructorClassListController::class, 'index'])
    ->name('legacy.faculty.class-list');

// Temporary test route for comprehensive exam eligibility
Route::get('/test-eligibility', [\App\Http\Controllers\Api\ComprehensiveExamEligibilityController::class, 'checkEligibility'])
    ->middleware('auth');

// Debug route to check academic records data
Route::get('/debug-academic-records', [\App\Http\Controllers\DebugController::class, 'academicRecordsDebug'])
    ->middleware('auth');

/*
|--------------------------------------------------------------------------
| Include default auth scaffolding (login, password, etc.)
|--------------------------------------------------------------------------
*/
if (file_exists(__DIR__ . '/auth.php')) {
    require __DIR__ . '/auth.php';
}
if (file_exists(__DIR__ . '/settings.php'))
    require __DIR__ . '/settings.php';

Route::middleware(['auth'])->group(function () {
    Route::get('/api/adviser/students', [AdviserStudentController::class, 'index']);
    Route::post('/api/adviser/students', [AdviserStudentController::class, 'store']);
    Route::post('/api/adviser/register_with_code', [AdviserStudentController::class, 'registerWithCode']);
    Route::get('/api/adviser/code', [AdviserStudentController::class, 'getAdviserCode']);
    Route::delete('/api/adviser/students/{student}', [AdviserStudentController::class, 'destroy']);

    Route::get('/api/advisers', [\App\Http\Controllers\CoordinatorAdviserController::class, 'all'])->name('api.advisers');
    Route::middleware(['auth'])->get('/api/adviser/has-students', [AdviserStudentController::class, 'hasStudents']);


    Route::get('/api/panelists', [\App\Http\Controllers\PanelistController::class, 'index'])->name('api.panelists');

    Route::get('/api/adviser/pending-students', [AdviserStudentController::class, 'pending']);
    Route::post('/api/adviser/pending-students/{student}/accept', [AdviserStudentController::class, 'acceptPending']);
    Route::post('/api/adviser/pending-students/{student}/reject', [AdviserStudentController::class, 'rejectPending']);


    // Student search for autocomplete
    Route::get('/api/students/search', [App\Http\Controllers\Api\StudentSearchController::class, 'search']);

    // Comprehensive exam eligibility API
    Route::get('/api/comprehensive-exam/eligibility', [App\Http\Controllers\Api\ComprehensiveExamEligibilityController::class, 'checkEligibility']);

    // Manual data scraping endpoint for testing
    Route::post('/api/comprehensive-exam/scrape-data', [App\Http\Controllers\Api\ComprehensiveExamEligibilityController::class, 'manualDataScraping']);

});

// Adviser view: Defense Requirement Details (for /adviser/defense-requirements/{id}/details)
Route::get('/adviser/defense-requirements/{id}/details', function ($id) {
    $user = Auth::user();
    if (!$user || !in_array($user->role, ['Adviser', 'Faculty']))
        abort(403);

    $defenseRequest = \App\Models\DefenseRequest::findOrFail($id);

    // Fetch all coordinators linked to this adviser
    $coordinators = $user->coordinators()
        ->select('users.id', 'users.first_name', 'users.middle_name', 'users.last_name', 'users.email')
        ->get()
        ->map(function ($c) {
            return [
                'id' => $c->id,
                'name' => trim($c->first_name . ' ' . ($c->middle_name ? strtoupper($c->middle_name[0]) . '. ' : '') . $c->last_name),
                'email' => $c->email,
            ];
        })
        ->values()
        ->all();

    return Inertia::render('adviser/defense-requirements/details-requirements', [
        'defenseRequest' => $defenseRequest,
        'userRole' => $user->role,
        'coordinators' => $coordinators, // <-- pass as prop
    ]);
})->name('adviser.defense-requirements.details');

/* Adviser: Upload documents for defense requirements */
Route::post('/adviser/defense-requirements/{defenseRequest}/documents', [DefenseRequestController::class, 'uploadDocuments'])
    ->name('adviser.defense-requirements.upload-documents');

Route::post('/adviser/defense-requirements/{id}/endorsement-form', function ($id) {
    $req = \App\Models\DefenseRequest::findOrFail($id);
    $url = request('url');
    if (!$url) {
        return response()->json(['error' => 'No URL provided'], 422);
    }
    // Extract the relative path if a full URL is provided
    if (preg_match('#/storage/(.+)$#', $url, $m)) {
        $relative = $m[1];
    } else {
        $relative = $url;
    }
    $req->endorsement_form = $relative;
    $req->save();
    return response()->json(['ok' => true]);
});

/* Document Generation API */
Route::post('/api/generate-document', [GeneratedDocumentController::class, 'generateDocument']);

/* Update Adviser Status for Defense Requirements */
Route::patch('/adviser/defense-requirements/{defenseRequest}/adviser-status', [\App\Http\Controllers\DefenseRequestController::class, 'updateAdviserStatus'])
    ->name('adviser.defense-requirements.update-adviser-status');



Route::get('/assistant/all-defense-list', function () {
    $user = Auth::user();
    // Authorization check
    if (!in_array($user->role, ['Administrative Assistant', 'Dean'])) {
        abort(403);
    }

    return Inertia::render('assistant/all-defense-list/Index');
})->name('assistant.all-defense-list');

Route::get('/assistant/all-defense-list/data', function () {
    $user = Auth::user();
    if (!in_array($user->role, ['Administrative Assistant', 'Dean'])) {
        abort(403);
    }

    // Fetch all approved/completed defense requests for AA
    $defenseRequests = DefenseRequest::query()
        ->with('aaVerification')
        ->whereIn('coordinator_status', ['Approved'])
        ->whereIn('workflow_state', [
            'coordinator-approved',
            'panels-assigned',
            'scheduled',
            'completed'
        ])
        ->orderByDesc('created_at')
        ->get([
            'id','first_name','middle_name','last_name','school_id','program',
            'thesis_title','defense_type','status','priority','workflow_state',
            'scheduled_date','defense_mode','defense_venue','panels_assigned_at',
            'defense_adviser','submitted_at',
            'coordinator_status',
            'amount',
            'reference_no',
            'coordinator_user_id',
        ])
        ->map(function($r){
            $programLevel = \App\Helpers\ProgramLevel::getLevel($r->program);
            $expectedTotal = \App\Models\PaymentRate::where('program_level', $programLevel)
                ->where('defense_type', $r->defense_type)
                ->sum('amount');

            $coordinator = null;
            if ($r->coordinator_user_id) {
                $coordUser = \App\Models\User::find($r->coordinator_user_id);
                if ($coordUser) {
                    $coordinator = trim($coordUser->first_name . ' ' . ($coordUser->middle_name ? strtoupper($coordUser->middle_name[0]) . '. ' : '') . $coordUser->last_name);
                }
            }

            return [
                'id' => $r->id,
                'first_name' => $r->first_name,
                'middle_name' => $r->middle_name,
                'last_name' => $r->last_name,
                'program' => $r->program,
                'thesis_title' => $r->thesis_title,
                'defense_type' => $r->defense_type,
                'priority' => $r->priority,
                'workflow_state' => $r->workflow_state,
                'status' => $r->status,
                'scheduled_date' => $r->scheduled_date?->format('Y-m-d'),
                'date_of_defense' => $r->scheduled_date
                    ? $r->scheduled_date->format('Y-m-d')
                    : ($r->created_at ? $r->created_at->format('Y-m-d') : null),
                'defense_mode' => $r->defense_mode,
                'mode_defense' => $r->defense_mode,
                'adviser' => $r->defense_adviser ?? '—',
                'submitted_at' => $r->submitted_at ? \Carbon\Carbon::parse($r->submitted_at)->format('Y-m-d H:i:s') : null,
                'coordinator_status' => $r->coordinator_status,
                'expected_rate' => $expectedTotal,
                'amount' => $r->amount,
                'reference_no' => $r->reference_no,
                'coordinator' => $coordinator,
            'aa_verification_status' => optional($r->aaVerification)->status ?? 'pending',
            'aa_verification_id' => optional($r->aaVerification)->id,
            ];
        });

    return response()->json($defenseRequests);  
})->name('assistant.all-defense-list.data');

Route::get('/coordinator/defense-requests', function () {
    $user = Auth::user();
    if (!$user || $user->role !== 'Coordinator') {
        abort(403);
    }
    return Inertia::render('coordinator/submissions/defense-request/Index');
})->name('coordinator.defense-requests');



Route::get('/assistant/all-defense-list/{id}/details', [DefenseRequestController::class, 'showAADetails'])
    ->name('assistant.all-defense-list.details');

// Add this route for manual testing
Route::post('/admin/sync-student-records', function() {
    $service = app(\App\Services\StudentRecordSyncService::class);
    $service->syncAllCompletedDefenses();
    return response()->json(['message' => 'Sync completed']);
})->middleware('auth');
