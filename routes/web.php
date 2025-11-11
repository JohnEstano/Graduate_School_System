<?php



use App\Http\Controllers\HonorariumSummaryController;
use App\Http\Controllers\StudentRecordController;
use App\Http\Controllers\EmailsController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DefenseRequestController;
use App\Http\Controllers\DefenseRequirementController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PanelistController;
use App\Http\Controllers\ComprehensiveExamController;
use App\Http\Controllers\PaymentSubmissionController;
use App\Http\Controllers\CoordinatorCompreExamController;
use App\Http\Controllers\CoordinatorExamScoreController;
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
// REMOVED: use App\Http\Controllers\Assistant\DefenseBatchController;
use App\Http\Controllers\ExamSubjectOfferingController;
use Illuminate\Http\Request;
use App\Models\ExamSubjectOffering;
use App\Http\Controllers\RegistrarExamApplicationController;
use App\Http\Controllers\DeanCompreExamController;
use App\Http\Controllers\Api\ComprehensiveExamEligibilityController as ApiCompreEligController;


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

// Moved to authenticated routes - must be logged in to add panelists
// Route::post('/programs/{programId}/panelists', [HonorariumSummaryController::class, 'storePanelist'])
//     ->name('programs.panelists.store');

// The routes here means that to be rendered or accessed, you need to login or have prior authentication.
Route::middleware('guest')->group(function () {
    // BASIC login page (adjust Inertia component path to what you actually have)
    Route::get('/login', fn() => Inertia::render('auth/Login'))->name('login');
    // Uncomment if you allow registration
    // Route::get('/register', fn() => Inertia::render('auth/Register'))->name('register');
});

/*
|--------------------------------------------------------------------------
| Debug / Diagnostics (DISABLE IN PRODUCTION!)
|--------------------------------------------------------------------------
*/
// ⚠️ TODO: Remove or protect these routes in production
Route::get('/test-upload-limits', function () {
    if (app()->environment('production')) {
        abort(404);
    }
    return response()->json([
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'max_input_time' => ini_get('max_input_time'),
        'upload_config' => config('upload'),
    ]);
});

// Test route to preview all email layouts
Route::get('/test-email-layouts', function () {
    $emails = [
        'adviser-invitation' => 'Adviser Invitation',
        'comprehensive-exam-approved' => 'Comprehensive Exam Approved',
        'comprehensive-exam-payment-approved' => 'Comprehensive Exam Payment Approved',
        'comprehensive-exam-payment-rejected' => 'Comprehensive Exam Payment Rejected',
        'comprehensive-exam-rejected' => 'Comprehensive Exam Rejected',
        'comprehensive-exam-results-posted' => 'Comprehensive Exam Results Posted',
        'comprehensive-exam-submitted' => 'Comprehensive Exam Submitted',
        'defense-approved' => 'Defense Approved',
        'defense-assigned-coordinator' => 'Defense Assigned to Coordinator',
        'defense-panel-invitation' => 'Defense Panel Invitation',
        'defense-rejected' => 'Defense Rejected',
        'defense-scheduled' => 'Defense Scheduled',
        'defense-scheduled-adviser' => 'Defense Scheduled (Adviser)',
        'defense-scheduled-student' => 'Defense Scheduled (Student)',
        'defense-submitted' => 'Defense Submitted',
        'document-submitted' => 'Document Submitted',
        'student-accepted-by-adviser' => 'Student Accepted by Adviser',
        'student-assigned-to-adviser' => 'Student Assigned to Adviser',
        'student-invitation' => 'Student Invitation',
        'student-registered-notification' => 'Student Registered Notification',
        'student-rejected-by-adviser' => 'Student Rejected by Adviser',
        'welcome-mail' => 'Welcome Mail',
    ];
    
    $html = '<html><head><title>Email Layout Previews</title>';
    $html .= '<style>body{font-family:Arial,sans-serif;margin:40px;background:#f5f5f5;}';
    $html .= 'h1{color:#333;}ul{list-style:none;padding:0;}';
    $html .= 'li{margin:10px 0;}a{display:block;padding:15px;background:white;';
    $html .= 'text-decoration:none;color:#dc2626;border-radius:5px;box-shadow:0 2px 4px rgba(0,0,0,0.1);';
    $html .= 'transition:all 0.3s;}a:hover{background:#dc2626;color:white;transform:translateX(5px);}</style>';
    $html .= '</head><body><h1>📧 Email Layout Previews</h1><ul>';
    
    foreach ($emails as $key => $label) {
        $html .= "<li><a href='/test-email-layout/{$key}'>{$label}</a></li>";
    }
    
    $html .= '</ul></body></html>';
    return $html;
});

Route::get('/test-email-layout/{template}', function ($template) {
    // Sample data for different email templates
    $data = match($template) {
        'adviser-invitation' => [
            'adviserName' => 'Dr. Juan Dela Cruz',
            'coordinatorName' => 'Dr. Maria Santos',
        ],
        'comprehensive-exam-approved' => [
            'student' => (object)[
                'first_name' => 'John',
                'middle_name' => 'Michael',
                'last_name' => 'Doe',
                'school_id' => '2023-12345',
            ],
            'examApplication' => (object)[
                'student_id' => '2023-12345',
                'program' => 'Master of Science in Computer Science',
                'school_year' => '2024-2025',
                'exam_date' => \Carbon\Carbon::parse('2025-12-15'),
                'exam_time' => '9:00 AM',
            ],
            'approvedBy' => 'Coordinator',
            'approverName' => 'Dr. Maria Santos',
        ],
        'comprehensive-exam-payment-approved' => [
            'student' => (object)[
                'first_name' => 'John',
                'middle_name' => 'Michael',
                'last_name' => 'Doe',
                'school_id' => '2023-12345',
            ],
            'payment' => (object)[
                'id' => 1,
                'or_number' => 'OR-2025-12345',
                'amount' => 1500.00,
                'payment_date' => \Carbon\Carbon::parse('2025-11-01'),
            ],
            'examApplication' => (object)[
                'id' => 1,
                'student_id' => '2023-12345',
                'program' => 'Master of Science in Computer Science',
                'school_year' => '2024-2025',
            ],
        ],
        'comprehensive-exam-payment-rejected' => [
            'student' => (object)[
                'first_name' => 'John',
                'middle_name' => 'Michael',
                'last_name' => 'Doe',
                'school_id' => '2023-12345',
            ],
            'payment' => (object)[
                'id' => 1,
                'or_number' => 'OR-2025-12345',
                'amount' => 1500.00,
            ],
            'examApplication' => (object)[
                'id' => 1,
                'student_id' => '2023-12345',
                'program' => 'Master of Science in Computer Science',
                'school_year' => '2024-2025',
            ],
            'rejectionReason' => 'Invalid receipt. Please upload a clear copy of the official receipt.',
        ],
        'comprehensive-exam-rejected' => [
            'student' => (object)[
                'first_name' => 'John',
                'middle_name' => 'Michael',
                'last_name' => 'Doe',
                'school_id' => '2023-12345',
            ],
            'examApplication' => (object)[
                'id' => 1,
                'student_id' => '2023-12345',
                'program' => 'Master of Science in Computer Science',
                'school_year' => '2024-2025',
            ],
            'rejectedBy' => 'Coordinator',
            'rejectorName' => 'Dr. Maria Santos',
            'rejectionReason' => 'Incomplete requirements. Please submit all required documents.',
        ],
        'comprehensive-exam-results-posted' => [
            'student' => (object)[
                'first_name' => 'John',
                'middle_name' => 'Michael',
                'last_name' => 'Doe',
            ],
            'examResult' => (object)[
                'exam_date' => \Carbon\Carbon::parse('2025-12-15'),
                'status' => 'Passed',
                'overall_score' => 85,
                'remarks' => 'Congratulations on passing your comprehensive exam!',
            ],
            'examApplication' => (object)[
                'id' => 1,
                'application_id' => 'EXAM-2024-001',
                'student_id' => '2023-12345',
                'program' => 'Master of Science in Computer Science',
                'school_year' => '2024-2025',
            ],
            'subjects' => [
                ['subject_name' => 'Advanced Algorithms', 'score' => 88],
                ['subject_name' => 'Machine Learning', 'score' => 85],
                ['subject_name' => 'Database Systems', 'score' => 82],
                ['subject_name' => 'Software Engineering', 'score' => 86],
            ],
            'resultStatus' => 'passed',
            'averageScore' => 85,
        ],
        'comprehensive-exam-submitted' => [
            'coordinatorName' => 'Dr. Maria Santos',
            'student' => (object)[
                'first_name' => 'John',
                'middle_name' => 'Michael',
                'last_name' => 'Doe',
                'school_id' => '2023-12345',
                'program' => 'Master of Science in Computer Science',
            ],
            'examApplication' => (object)[
                'id' => 1,
                'student_id' => '2023-12345',
                'program' => 'Master of Science in Computer Science',
                'school_year' => '2024-2025',
                'submitted_at' => \Carbon\Carbon::parse('2025-11-01 10:30:00'),
            ],
        ],
        'defense-approved' => [
            'student' => (object)[
                'first_name' => 'John',
                'middle_name' => 'Michael',
                'last_name' => 'Doe',
                'school_id' => '2023-12345',
            ],
            'defenseRequest' => (object)[
                'id' => 1,
                'thesis_title' => 'Machine Learning Applications in Healthcare',
                'defense_type' => 'Proposal Defense',
                'program' => 'Master of Science in Computer Science',
            ],
            'approvedBy' => 'adviser',
            'comment' => 'Your defense request looks good. Please proceed with scheduling.',
        ],
        'defense-rejected' => [
            'student' => (object)[
                'first_name' => 'John',
                'middle_name' => 'Michael',
                'last_name' => 'Doe',
                'school_id' => '2023-12345',
            ],
            'defenseRequest' => (object)[
                'id' => 1,
                'thesis_title' => 'Machine Learning Applications in Healthcare',
                'defense_type' => 'Proposal Defense',
                'program' => 'Master of Science in Computer Science',
            ],
            'rejectedBy' => 'coordinator',
            'rejectionReason' => 'Please revise your methodology section and resubmit the requirements.',
        ],
        'defense-scheduled', 'defense-scheduled-student', 'defense-scheduled-adviser' => [
            'recipient' => (object)[
                'first_name' => 'John',
                'last_name' => 'Doe',
            ],
            'defenseRequest' => (object)[
                'id' => 1,
                'first_name' => 'John',
                'middle_name' => 'Michael',
                'last_name' => 'Doe',
                'school_id' => '2023-12345',
                'thesis_title' => 'Machine Learning Applications in Healthcare',
                'defense_type' => 'Proposal Defense',
                'program' => 'Master of Science in Computer Science',
                'defense_adviser' => 'Dr. Juan Dela Cruz',
                'defense_chairperson' => 'Dr. Jane Smith',
                'defense_panelist1' => 'Dr. Robert Johnson',
                'defense_panelist2' => 'Dr. Emily Brown',
                'defense_panelist3' => 'Dr. Michael Wilson',
                'defense_panelist4' => null,
                'scheduled_date' => \Carbon\Carbon::parse('2025-11-15'),
                'scheduled_time' => '2:00 PM',
                'scheduled_end_time' => '4:00 PM',
                'defense_mode' => 'Face to Face',
                'defense_venue' => 'Graduate School Conference Room A',
            ],
            'changes' => null,
        ],
        'defense-panel-invitation' => [
            'panelistName' => 'Jane Smith',
            'role' => 'chair',
            'studentName' => 'John Michael Doe',
            'defenseTitle' => 'Machine Learning Applications in Healthcare',
            'adviserName' => 'Dr. Juan Dela Cruz',
            'defenseDate' => '2025-11-15',
            'defenseTime' => '2:00 PM',
            'defenseEndTime' => '4:00 PM',
            'defenseMode' => 'Face to Face',
            'defenseVenue' => 'Graduate School Conference Room A',
            'otherPanels' => [
                (object)['name' => 'Dr. Robert Johnson', 'role' => 'Panelist'],
                (object)['name' => 'Dr. Emily Brown', 'role' => 'Panelist'],
            ],
        ],
        'defense-assigned-coordinator' => [
            'coordinatorName' => 'Dr. Maria Santos',
            'studentName' => 'John Michael Doe',
            'adviserName' => 'Dr. Juan Dela Cruz',
            'defenseRequest' => (object)[
                'school_id' => '2023-12345',
                'program' => 'Master of Science in Computer Science',
                'thesis_title' => 'Machine Learning Applications in Healthcare',
                'defense_type' => 'Proposal Defense',
                'created_at' => \Carbon\Carbon::parse('2025-10-24 10:30:00'),
            ],
        ],
        'defense-submitted' => [
            'adviser' => (object)[
                'first_name' => 'Juan',
                'middle_name' => 'Santos',
                'last_name' => 'Dela Cruz',
            ],
            'defenseRequest' => (object)[
                'id' => 1,
                'first_name' => 'John',
                'middle_name' => 'Michael',
                'last_name' => 'Doe',
                'school_id' => '2023-12345',
                'program' => 'Master of Science in Computer Science',
                'defense_type' => 'Proposal Defense',
                'thesis_title' => 'Machine Learning Applications in Healthcare',
                'submitted_at' => \Carbon\Carbon::parse('2025-10-24 10:30:00'),
            ],
        ],
        'document-submitted' => [
            'teacher' => (object)[
                'first_name' => 'Jane',
                'last_name' => 'Smith',
            ],
            'student' => (object)[
                'first_name' => 'John',
                'middle_name' => 'Michael',
                'last_name' => 'Doe',
                'school_id' => '2023-12345',
                'program' => 'Master of Science in Computer Science',
            ],
            'documentType' => 'Thesis Manuscript',
            'documentUrl' => url('/documents/1'),
        ],
        'student-accepted-by-adviser' => [
            'studentFullName' => 'John Michael Doe',
            'adviserFullName' => 'Dr. Juan Dela Cruz',
            'adviserEmail' => 'juan.delacruz@uic.edu.ph',
            'adviserProgram' => 'Computer Science Department',
        ],
        'student-assigned-to-adviser' => [
            'adviserName' => 'Juan Dela Cruz',
            'coordinatorName' => 'Dr. Maria Santos',
            'studentName' => 'John Michael Doe',
            'studentEmail' => 'john.doe@uic.edu.ph',
            'studentProgram' => 'Master of Science in Computer Science',
        ],
        'student-invitation' => [
            'coordinatorName' => 'Dr. Maria Santos',
        ],
        'student-registered-notification' => [
            'adviserName' => 'Dr. Juan Dela Cruz',
            'coordinatorName' => 'Dr. Maria Santos',
            'studentName' => 'John Michael Doe',
            'studentEmail' => 'john.doe@uic.edu.ph',
            'studentNumber' => '2023-12345',
            'studentProgram' => 'Master of Science in Computer Science',
            'actionUrl' => url('/dashboard'),
        ],
        'student-rejected-by-adviser' => [
            'studentFullName' => 'John Michael Doe',
            'adviserFullName' => 'Dr. Juan Dela Cruz',
            'adviserEmail' => 'juan.delacruz@uic.edu.ph',
            'coordinatorName' => 'Dr. Maria Santos',
            'coordinatorEmail' => 'maria.santos@uic.edu.ph',
        ],
        'welcome-mail' => [
            'name' => 'John Doe',
            'email' => 'john.doe@uic.edu.ph',
        ],
        default => [],
    };
    
    try {
        return view("emails.{$template}", $data);
    } catch (\Exception $e) {
        // Try alternative naming conventions
        $alternatives = [
            'welcome-mail' => 'WelcomeMail',
        ];
        
        if (isset($alternatives[$template])) {
            try {
                return view("emails.{$alternatives[$template]}", $data);
            } catch (\Exception $e2) {
                return response("<h1>Email template not found</h1><p>Template: emails.{$template}</p><p>Error: {$e2->getMessage()}</p><p><a href='/test-email-layouts'>← Back to list</a></p>", 404);
            }
        }
        
        return response("<h1>Email template not found</h1><p>Template: emails.{$template}</p><p>Error: {$e->getMessage()}</p><p><a href='/test-email-layouts'>← Back to list</a></p>", 404);
    }
});

use Illuminate\Support\Facades\Mail;

// ⚠️ TODO: Remove in production
Route::get('/test-mail', function () {
    if (app()->environment('production')) {
        abort(404);
    }
    Mail::raw('This is a test email to Mailpit!', function ($message) {
        $message->to('test@example.com')
                ->subject('Hello Mailpit!');
    });
    return 'Email sent!';
});

/*
|--------------------------------------------------------------------------
| Authenticated + Verified
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::middleware('role:Coordinator')->get('/api/coordinator/code', [CoordinatorAdviserController::class, 'getCoordinatorCode']);
    Route::post('/api/adviser/register-with-coordinator-code', [\App\Http\Controllers\CoordinatorAdviserController::class, 'registerWithCode']);
    Route::middleware('role:Coordinator')->get('/coordinator/defense-requests/all-defense-requests', [\App\Http\Controllers\DefenseRequestController::class, 'allForCoordinator']);

    // Removed duplicate routes (lines 314-315)

    // Coordinator Adviser Management Routes
    Route::middleware('role:Coordinator')->group(function () {
        Route::get('/api/coordinator/advisers', [CoordinatorAdviserController::class, 'index']);
        Route::get('/api/coordinator/advisers/search', [CoordinatorAdviserController::class, 'search']);
        Route::put('/api/coordinator/advisers/{id}', [CoordinatorAdviserController::class, 'update']);
        Route::post('/api/coordinator/advisers', [CoordinatorAdviserController::class, 'store']);
        Route::post('/api/coordinator/advisers/{id}/send-invitation', [CoordinatorAdviserController::class, 'sendInvitation']);
        Route::delete('/api/coordinator/advisers/{id}', [CoordinatorAdviserController::class, 'destroy']);

        // Coordinator manages adviser-student relationships
        Route::get('/api/coordinator/advisers/{adviser}/students', [\App\Http\Controllers\CoordinatorAdviserController::class, 'students']);
        Route::get('/api/coordinator/advisers/{adviser}/pending-students', [\App\Http\Controllers\CoordinatorAdviserController::class, 'pendingStudents']);
        Route::post('/api/coordinator/advisers/{adviser}/students', [\App\Http\Controllers\CoordinatorAdviserController::class, 'storeStudent']);
        Route::delete('/api/coordinator/advisers/{adviser}/students/{student}', [\App\Http\Controllers\CoordinatorAdviserController::class, 'destroyStudent']);
        Route::get('/api/coordinator/students/search', [CoordinatorAdviserController::class, 'searchStudents']);
    });
    //PAYMENTVERIFIATION AA
    Route::middleware('role:Administrative Assistant')->prefix('aa')->group(function () {
        Route::get('/payment-verifications', [PaymentVerificationController::class, 'index'])->name('aa.payment-verifications');
        Route::post('/payment-verifications/{id}/status', [PaymentVerificationController::class, 'updateStatus'])->name('aa.payment-verifications.update-status');
        Route::post('/payment-verifications/batch', [PaymentVerificationController::class, 'addToBatch'])->name('aa.payment-verifications.batch');
        Route::get('/payment-batch/{batchId}/export', [PaymentVerificationController::class, 'exportBatch'])->name('aa.payment-batch.export');
        Route::post('/payment-verifications/bulk-update', [PaymentVerificationController::class, 'bulkUpdateStatus']);
    });

    // AA Verification Status Update by Defense Request ID (for details page)
    Route::middleware('role:Administrative Assistant')->post('/assistant/aa-verification/{defenseRequestId}/status', [PaymentVerificationController::class, 'updateStatusByDefenseRequest'])
        ->name('assistant.aa-verification.update-status');

    // Payment Trends API for Assistant Dashboard
    Route::middleware('role:Administrative Assistant')->get('/api/assistant/payment-trends', [\App\Http\Controllers\Api\PaymentTrendsController::class, 'getPaymentTrends'])
        ->name('api.assistant.payment-trends');

    //PAYMENT RATESS ETC.
   


    Route::middleware('role:Dean,Administrative Assistant,Coordinator')->group(function () {
        Route::post('/dean/payment-rates', [\App\Http\Controllers\PaymentRateController::class, 'update'])
            ->name('dean.payment-rates.update');
        Route::get('/dean/payment-rates', [\App\Http\Controllers\PaymentRateController::class, 'index'])
            ->name('dean.payment-rates.index');
        Route::get('/dean/payment-rates/data', [\App\Http\Controllers\PaymentRateController::class, 'data'])
            ->name('dean.payment-rates.data');
    });


    // Settings: Document Templates (Dean / Coordinator only)
    Route::middleware('role:Dean,Coordinator')->get('/settings/documents', function () {
        return Inertia::render('settings/documents/Index');
    })->name('settings.documents');

    Route::middleware('role:Dean,Coordinator')->get('/settings/documents/{template}/edit', function (\App\Models\DocumentTemplate $template) {
        return Inertia::render('settings/documents/TemplateEditor', [
            'templateId' => $template->id,
            'template' => $template
        ]);
    })->name('settings.documents.edit');


    // HONORARIUM ROUTES
    // Panelist management
    Route::post('/programs/{programId}/panelists', [HonorariumSummaryController::class, 'storePanelist'])
        ->name('programs.panelists.store');
    
    // Page 1 - List all program
    
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

    // Panelist individual PDF download
    Route::get('/honorarium/panelist/{panelistId}/download-pdf', [HonorariumSummaryController::class, 'downloadPanelistPdf'])
        ->name('honorarium.downloadPanelistPDF');

    //student-records routes
    Route::get('/student-records', [StudentRecordController::class, 'index'])->name('student-records.index');
    
    // Program students view (Inertia page) - MUST come before {id} route
    Route::get('/student-records/program/{programId}', [StudentRecordController::class, 'showProgramStudents'])
        ->name('student-records.showProgramStudents');
    
    // Individual student record view (JSON API)
    Route::get('/student-records/{id}', [StudentRecordController::class, 'show'])->name('student-records.show');
    
    // Download endpoints
    Route::get('/student-records/{id}/download-pdf', [StudentRecordController::class, 'downloadPdf'])->name('student-records.downloadPdf');
    Route::get('/student-records/{id}/download-docs', [StudentRecordController::class, 'downloadDocs'])
        ->name('student-records.downloadDocs');
    
    // Update and delete
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

    /* Notifications */
    Route::get('/notification', fn() => Inertia::render('notification/Index'))->name('notification.index');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');

    /* Payments */
    Route::get('/payment', [PaymentSubmissionController::class, 'index'])->name('payment.index');
    Route::post('/payment', [PaymentSubmissionController::class, 'store'])->name('payment.store');
    Route::get('/api/payment/or-unique', [PaymentSubmissionController::class, 'checkOrUnique'])->name('api.payment.or-unique');

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

    /* Public Payment Rates API - accessible to all authenticated users */
    Route::get('/api/payment-rates', [\App\Http\Controllers\PaymentRateController::class, 'data'])
        ->name('api.payment-rates.data');

    /* SuperAdmin API Routes */
    Route::middleware('role:Super Admin')->group(function () {
        Route::post('/api/superadmin/settings/exam-window', [\App\Http\Controllers\SuperAdminController::class, 'updateExamWindow'])
            ->name('api.superadmin.settings.exam-window');
        Route::post('/api/superadmin/settings/payment-window', [\App\Http\Controllers\SuperAdminController::class, 'updatePaymentWindow'])
            ->name('api.superadmin.settings.payment-window');
        Route::post('/api/superadmin/settings/eligibility-bypass', [\App\Http\Controllers\SuperAdminController::class, 'updateEligibilityBypass'])
            ->name('api.superadmin.settings.eligibility-bypass');
    });

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
    Route::middleware(['auth', 'role:Coordinator'])->group(function () {
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
    
    /* Coordinator Comprehensive Exam */
    Route::middleware(['auth', 'role:Coordinator'])->group(function () {
        Route::get('/coordinator/compre-exam', [CoordinatorCompreExamController::class, 'index'])
            ->name('coordinator.compre-exam.index');
        Route::get('/coordinator/compre-payment', [PaymentSubmissionController::class, 'coordinatorIndex'])
            ->name('coordinator.compre-payment.index');
        Route::post('/coordinator/compre-payment/{id}/approve', [PaymentSubmissionController::class, 'approve'])
            ->name('coordinator.compre-payment.approve');
        Route::post('/coordinator/compre-payment/{id}/reject', [PaymentSubmissionController::class, 'reject'])
            ->name('coordinator.compre-payment.reject');
        Route::post('/coordinator/compre-payment/{id}/retrieve', [PaymentSubmissionController::class, 'retrieve'])
            ->name('coordinator.compre-payment.retrieve');
        Route::post('/coordinator/compre-payment/bulk-approve', [PaymentSubmissionController::class, 'bulkApprove'])
            ->name('coordinator.compre-payment.bulk-approve');
        Route::post('/coordinator/compre-payment/bulk-reject', [PaymentSubmissionController::class, 'bulkReject'])
            ->name('coordinator.compre-payment.bulk-reject');
        Route::post('/coordinator/compre-payment/bulk-retrieve', [PaymentSubmissionController::class, 'bulkRetrieve'])
            ->name('coordinator.compre-payment.bulk-retrieve');
        Route::get('/coordinator/compre-exam-schedule', [ExamSubjectOfferingController::class, 'page'])
            ->name('coordinator.compre-exam-schedule.index');
        Route::post('/coordinator/compre-exam-schedule/offerings', [ExamSubjectOfferingController::class, 'store'])
            ->name('coordinator.compre-exam-schedule.offerings.store');
        Route::put('/coordinator/compre-exam-schedule/offerings/{offering}', [ExamSubjectOfferingController::class, 'update'])
            ->name('coordinator.compre-exam-schedule.offerings.update');
        Route::delete('/coordinator/compre-exam-schedule/offerings/{offering}', [ExamSubjectOfferingController::class, 'destroy'])
            ->name('coordinator.compre-exam-schedule.offerings.destroy');
    });

    // Coordinator: Post Scores workflow
    Route::middleware(['auth'])->group(function () {
        // fetch subjects for an application (JSON)
        Route::get('/api/exam-applications/{application}/subjects', [CoordinatorExamScoreController::class, 'subjects'])
            ->name('api.exam-applications.subjects');
        // save posted scores
        Route::post('/coordinator/exam-applications/{application}/scores', [CoordinatorExamScoreController::class, 'save'])
            ->name('coordinator.exam-applications.scores');
    });

    Route::middleware(['auth','verified'])->group(function () {
        // Student-safe schedules index (active + with date/time)
        Route::get('/student/exam-subject-offerings', function (Request $request) {
            $validated = $request->validate([
                'program' => ['required','string'],
                'school_year' => ['required','regex:/^\d{4}-\d{4}$/'],
            ]);

            return ExamSubjectOffering::query()
                ->where('program', $validated['program'])
                ->where('school_year', $validated['school_year'])
                ->where('is_active', true)
                ->whereNotNull('exam_date')
                ->whereNotNull('start_time')
                ->whereNotNull('end_time')
                ->orderBy('subject_name')
                ->get([
                    'id','program','school_year','subject_code','subject_name',
                    'exam_date','start_time','end_time','is_active',
                ]);
        })->name('student.exam-subject-offerings.index');

        // If you also want to keep the API index for coordinators, ensure it’s not restricted to coordinator-only middleware.
        // Route::get('/api/exam-subject-offerings', [ExamSubjectOfferingController::class, 'index'])
        //     ->name('api.exam-subject-offerings.index');
    });

    Route::middleware(['auth','verified','role:Registrar'])->group(function () {
        // Registrar Applications page
        Route::get('/registrar/compre-exam', [RegistrarExamApplicationController::class, 'indexPage'])
            ->name('registrar.compre-exam.index');

        // JSON list + decision
        Route::get('/api/registrar/exam-applications', [RegistrarExamApplicationController::class, 'list'])
            ->name('api.registrar.exam-applications');

        Route::post('/registrar/exam-applications/{application}/decision', [RegistrarExamApplicationController::class, 'decide'])
            ->name('registrar.exam-applications.decide');
        Route::post('/registrar/exam-applications/{application}/retrieve', [RegistrarExamApplicationController::class, 'retrieve'])
            ->name('registrar.exam-applications.retrieve');

        Route::get('/api/registrar/exam-applications/{application}/reviews', [RegistrarExamApplicationController::class, 'reviews'])
            ->name('api.registrar.exam-applications.reviews');
    });

    Route::middleware(['auth','verified','role:Dean'])->group(function () {
        // Dean page
        Route::get('/dean/compre-exam', [DeanCompreExamController::class, 'page'])
            ->name('dean.compre-exam.index');
        // APIs
        Route::get('/api/dean/exam-applications', [DeanCompreExamController::class, 'list'])
            ->name('api.dean.exam-applications');
        Route::post('/dean/exam-applications/{application}/decision', [DeanCompreExamController::class, 'decide'])
            ->name('dean.exam-applications.decide');
        Route::post('/dean/exam-applications/bulk-decision', [DeanCompreExamController::class, 'bulkDecision'])
            ->name('dean.exam-applications.bulk-decision');
        Route::post('/dean/exam-applications/{application}/revert', [DeanCompreExamController::class, 'revert'])
            ->name('dean.exam-applications.revert');
        Route::post('/dean/exam-applications/bulk-revert', [DeanCompreExamController::class, 'bulkRevert'])
            ->name('dean.exam-applications.bulk-revert');
        Route::get('/api/dean/exam-applications/{application}/reviews', [DeanCompreExamController::class, 'reviews'])
            ->name('api.dean.exam-applications.reviews');
    });

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
        
        // Add direct routes for coordinator panel and schedule saving
        Route::post('/defense-requests/{id}/panels', [DefenseRequestController::class, 'savePanels'])
            ->name('coordinator.defense-requests.panels.save');
        Route::post('/defense-requests/{id}/schedule', [DefenseRequestController::class, 'saveSchedule'])
            ->name('coordinator.defense-requests.schedule.save');
        
        Route::get('/panel-members', [CoordinatorDefenseController::class, 'panelMembersAll'])
            ->name('defense.panel-members');
        
        // Add the missing panel-members-all route
        Route::get('/defense/panel-members-all', [CoordinatorDefenseController::class, 'availablePanelMembersJson'])
            ->name('defense.panel-members-all');

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

    Route::middleware('role:Coordinator')->get('/coordinator/adviser-list', function () {
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

    Route::get('/api/exam-subject-offerings', [ExamSubjectOfferingController::class, 'index'])
        ->name('api.exam-subject-offerings.index');


    // Coordinators API - for dean dashboard
    Route::get('/api/coordinators', function () {
        return User::where('role', 'Coordinator')
            ->select('id', 'first_name', 'middle_name', 'last_name', 'email')
            ->get()
            ->map(function ($user) {
                // Get students count through coordinated advisers
                $studentsCount = User::whereIn('id', function($query) use ($user) {
                    $query->select('student_id')
                        ->from('adviser_student')
                        ->whereIn('adviser_id', function($subquery) use ($user) {
                            $subquery->select('adviser_id')
                                ->from('adviser_coordinator')
                                ->where('coordinator_id', $user->id);
                        })
                        ->where('status', 'accepted');
                })->count();

                // Get advisers count
                $advisersCount = $user->coordinatedAdvisers()->count();

                // Get unique programs from students
                $programs = User::whereIn('id', function($query) use ($user) {
                    $query->select('student_id')
                        ->from('adviser_student')
                        ->whereIn('adviser_id', function($subquery) use ($user) {
                            $subquery->select('adviser_id')
                                ->from('adviser_coordinator')
                                ->where('coordinator_id', $user->id);
                        })
                        ->where('status', 'accepted');
                })
                ->whereNotNull('program')
                ->where('program', '!=', '')
                ->pluck('program')
                ->unique()
                ->values()
                ->toArray();

                return [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ' ' . $user->last_name),
                    'first_name' => $user->first_name,
                    'middle_name' => $user->middle_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'students_count' => $studentsCount,
                    'advisers_count' => $advisersCount,
                    'programs' => $programs,
                ];
            });
    });

    // Administrative Assistants API - for dean dashboard
    Route::get('/api/assistants', function () {
        return User::where('role', 'Administrative Assistant')
            ->select('id', 'first_name', 'middle_name', 'last_name', 'email')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ' ' . $user->last_name),
                    'first_name' => $user->first_name,
                    'middle_name' => $user->middle_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'students_count' => 0, // Assistants don't have students
                    'advisers_count' => 0, // Assistants don't have advisers
                ];
            });
    });

    // Coordinator Programs API - Get programs for logged-in coordinator
    Route::get('/api/coordinator/programs', function () {
        $user = Auth::user();
        
        if ($user->role !== 'Coordinator') {
            return response()->json([]);
        }

        // Get unique programs from students assigned to this coordinator
        $programs = User::whereIn('id', function($query) use ($user) {
            $query->select('student_id')
                ->from('adviser_student')
                ->whereIn('adviser_id', function($subquery) use ($user) {
                    $subquery->select('adviser_id')
                        ->from('adviser_coordinator')
                        ->where('coordinator_id', $user->id);
                })
                ->where('status', 'accepted');
        })
        ->whereNotNull('program')
        ->where('program', '!=', '')
        ->pluck('program')
        ->unique()
        ->values();

        return response()->json($programs);
    });
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

// Comprehensive Exam status and eligibility APIs (student + registrar UIs)
// Use the default controller for both pages
Route::get('/api/comprehensive-exam/status', [ApiCompreEligController::class, 'checkExamStatus']);
Route::get('/api/comprehensive-exam/eligibility', [ApiCompreEligController::class, 'checkEligibility']);

Route::middleware('role:Coordinator,Administrative Assistant,Dean')->get('/api/coordinator/defense-requests', function () {
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

// Temporary test route for comprehensive exam eligibility (uses default controller)
Route::get('/test-eligibility', [ApiCompreEligController::class, 'checkEligibility'])
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


    Route::middleware('role:Coordinator')->get('/api/coordinator/pending-honorariums', function () {
        $user = Auth::user();

        // Get defense requests assigned to this coordinator that are approved
        $approvedRequestIds = \App\Models\DefenseRequest::where('coordinator_user_id', $user->id)
            ->where('coordinator_status', 'Approved')
            ->pluck('id');

        // Count requests where:
        // 1. AA verification record exists with status 'pending', OR
        // 2. AA verification record doesn't exist yet (null status, treated as pending)
        $pendingCount = 0;
        foreach ($approvedRequestIds as $requestId) {
            $aaVerification = \App\Models\AaPaymentVerification::where('defense_request_id', $requestId)->latest()->first();
            
            // If no record exists (null) or record exists with 'pending' status
            if (!$aaVerification || $aaVerification->status === 'pending') {
                $pendingCount++;
            }
        }

        return response()->json(['pending_count' => $pendingCount]);
    });

    // Dean pending honorariums (all approved defense requests)
    Route::middleware('role:Dean')->get('/api/dean/pending-honorariums', function () {
        // Get ALL approved defense requests
        $approvedRequestIds = \App\Models\DefenseRequest::where('coordinator_status', 'Approved')
            ->pluck('id');

        // Count requests where AA verification is pending or doesn't exist
        $pendingCount = 0;
        foreach ($approvedRequestIds as $requestId) {
            $aaVerification = \App\Models\AaPaymentVerification::where('defense_request_id', $requestId)->latest()->first();
            
            if (!$aaVerification || $aaVerification->status === 'pending') {
                $pendingCount++;
            }
        }

        return response()->json(['pending_count' => $pendingCount]);
    });

    // Assistant pending honorariums (all approved defense requests)
    Route::middleware('role:Administrative Assistant')->get('/api/assistant/pending-honorariums', function () {
        $user = Auth::user();

        // Get ALL approved defense requests
        $approvedRequestIds = \App\Models\DefenseRequest::where('coordinator_status', 'Approved')
            ->pluck('id');

        // Count requests where AA verification is pending or doesn't exist
        $pendingCount = 0;
        foreach ($approvedRequestIds as $requestId) {
            $aaVerification = \App\Models\AaPaymentVerification::where('defense_request_id', $requestId)->latest()->first();
            
            if (!$aaVerification || $aaVerification->status === 'pending') {
                $pendingCount++;
            }
        }

        return response()->json(['pending_count' => $pendingCount]);
    });


    // Student search for autocomplete
    Route::get('/api/students/search', [App\Http\Controllers\Api\StudentSearchController::class, 'search']);

    // Comprehensive exam eligibility APIs
    // Removed legacy duplicates that conflicted with V2 endpoints and caused 500s

});

// Adviser view: Defense Requirement Details (for /adviser/defense-requirements/{id}/details)
Route::get('/adviser/defense-requirements/{id}/details', function ($id) {
    $user = Auth::user();
    if (!$user || !in_array($user->role, ['Adviser', 'Faculty']))
        abort(403);

    $defenseRequest = \App\Models\DefenseRequest::with(['aaVerification'])->findOrFail($id);

    // Find the student from defense request
    $student = \App\Models\User::where('school_id', $defenseRequest->school_id)->first();

    // Get the coordinator who assigned this specific student-adviser relationship
    $coordinators = [];
    if ($student) {
        // Check if this student has an adviser relationship with the current user
        $pivot = DB::table('adviser_student')
            ->where('adviser_id', $user->id)
            ->where('student_id', $student->id)
            ->first();

        // If there's a coordinator who assigned this relationship, use that coordinator
        if ($pivot && $pivot->requested_by) {
            $coordinator = \App\Models\User::find($pivot->requested_by);
            if ($coordinator) {
                $coordinators = [[
                    'id' => $coordinator->id,
                    'name' => trim($coordinator->first_name . ' ' . ($coordinator->middle_name ? strtoupper($coordinator->middle_name[0]) . '. ' : '') . $coordinator->last_name),
                    'email' => $coordinator->email,
                ]];
            }
        }
    }

    return Inertia::render('adviser/defense-requirements/details-requirements', [
        'defenseRequest' => $defenseRequest,
        'userRole' => $user->role,
        'coordinators' => $coordinators,
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

/* NEW: Hardcoded Endorsement PDF Generation (replaces template system) */
Route::post('/api/generate-endorsement-pdf', [\App\Http\Controllers\EndorsementPdfController::class, 'generate'])
    ->middleware('auth')
    ->name('api.generate-endorsement-pdf');

/* Upload Endorsement Form (Web route for session auth) */
Route::post('/api/defense-requests/{defenseRequest}/upload-endorsement', [DefenseRequestController::class, 'uploadDocuments'])
    ->middleware('auth')
    ->name('api.defense-requests.upload-endorsement');

/* Update Adviser Status for Defense Requirements */
Route::patch('/adviser/defense-requirements/{defenseRequest}/adviser-status', [\App\Http\Controllers\DefenseRequestController::class, 'updateAdviserStatus'])
    ->middleware(['auth'])
    ->name('adviser.defense-requirements.update-adviser-status');

/* Update Coordinator Status for Defense Requirements */
Route::patch('/coordinator/defense-requirements/{defenseRequest}/coordinator-status', [\App\Http\Controllers\DefenseRequestController::class, 'updateCoordinatorStatus'])
    ->middleware(['auth'])
    ->name('coordinator.defense-requirements.coordinator-status');

/* Add Coordinator Signature to Endorsement Form */
Route::post('/api/defense-requests/{defenseRequest}/add-coordinator-signature', [\App\Http\Controllers\DefenseRequestController::class, 'addCoordinatorSignature'])
    ->middleware(['auth'])
    ->name('api.defense-requests.add-coordinator-signature');

Route::get('/assistant/all-defense-list', function () {
    $user = Auth::user();
    // Authorization check
    if (!in_array($user->role, ['Administrative Assistant', 'Dean'])) {
        abort(403);
    }

    return Inertia::render('assistant/all-defense-list/Index');
})->name('assistant.all-defense-list');

Route::middleware('role:Administrative Assistant,Dean')->get('/assistant/all-defense-list/data', function () {
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
            'id',
            'first_name',
            'middle_name',
            'last_name',
            'school_id',
            'program',
            'thesis_title',
            'defense_type',
            'status',
            'priority',
            'workflow_state',
            'scheduled_date',
            'defense_mode',
            'defense_venue',
            'panels_assigned_at',
            'defense_adviser',
            'submitted_at',
            'coordinator_status',
            'amount',
            'reference_no',
            'coordinator_user_id',
        ])
        ->map(function ($r) {
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
                'invalid_comment' => optional($r->aaVerification)->invalid_comment,
            ];
        });

    return response()->json($defenseRequests);
})->name('assistant.all-defense-list.data');

Route::middleware('role:Coordinator')->get('/coordinator/defense-requests', function () {
    $user = Auth::user();
    if (!$user || $user->role !== 'Coordinator') {
        abort(403);
    }
    return Inertia::render('coordinator/submissions/defense-request/Index');
})->name('coordinator.defense-requests');



Route::get('/assistant/all-defense-list/{id}/details', [DefenseRequestController::class, 'showAADetails'])
    ->name('assistant.all-defense-list.details');

// Add this route for manual testing
Route::post('/admin/sync-student-records', function () {
    $service = app(\App\Services\StudentRecordSyncService::class);
    $service->syncAllCompletedDefenses();
    return response()->json(['message' => 'Sync completed']);
})->middleware('auth');

// Test Mailpit
Route::get('/test-mailpit', function () {
    Mail::raw('Test email from Laravel to Mailpit!', function ($message) {
        $message->to('test@example.com')->subject('Laravel Test Email');
    });
    return 'Email sent! Check Mailpit at <a href="http://localhost:8025" target="_blank">http://localhost:8025</a>';
});

// Check UIC API Bearer Token
Route::middleware('auth')->get('/check-bearer-token', function () {
    $user = Auth::user();
    $token = \App\Helpers\UicApiHelper::getToken();
    
    return response()->json([
        'has_token' => $token !== null,
        'token_preview' => $token ? substr($token, 0, 30) . '...' : null,
        'full_token' => $token, // ⚠️ REMOVE IN PRODUCTION!
        'is_valid' => $token ? \App\Helpers\UicApiHelper::isTokenValid() : false,
        'user_id' => $user->id,
        'user_email' => $user->email,
        'cache_key' => 'uic_bearer_token_' . $user->id,
    ]);
})->name('check.bearer.token');
