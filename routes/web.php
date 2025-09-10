<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DefenseRequestController;
use App\Http\Controllers\HonorariumSummaryController;
use App\Http\Controllers\StudentRecordController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// The routes here means that to be rendered or accessed, you need to login or have prior authentication.
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard route

    Route::get('dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    // Notification route
    Route::get('notification', function () {
        return Inertia::render('notification/Index');
    })->name('notification.index');

    // Payment route
    Route::get('payment', function () {
        return Inertia::render('payment/Index');
    })->name('payment.index');

    // Schedule route
    Route::get('schedule', function () {
        return Inertia::render('schedule/Index');
    })->name('schedule.index');

    // Submissions routes
    // Defense Request route
    Route::get('/defense-request', [DefenseRequestController::class, 'index'])
        ->name('defense-request.index');

    Route::post('/defense-request', [DefenseRequestController::class, 'store'])
        ->name('defense-request.store');

    Route::patch('/defense-requests/{defenseRequest}/status', [DefenseRequestController::class, 'updateStatus'])->name('defense-requests.update-status');
    Route::patch('/defense-requests/{defenseRequest}/priority', [DefenseRequestController::class, 'updatePriority'])->name('defense-requests.update-priority');
    Route::patch('/defense-requests/bulk-status', [DefenseRequestController::class, 'bulkUpdateStatus']);
    Route::patch('/defense-requests/bulk-priority', [DefenseRequestController::class, 'bulkUpdatePriority']);

  
    // Comprehensive Exam route
    Route::get('comprehensive-exam', function () {
        return Inertia::render('student/submissions/comprehensive-exam/Index');
    })->name('comprehensive-exam.index');

    //Honorarium route
    // honorarium-summary route
    Route::get('/honorarium-summary', [HonorariumSummaryController::class, 'Index'])
    ->name('honorarium-summary.index');
    Route::get('/honorarium-summary/{record}/download', [HonorariumSummaryController::class, 'download'])
    ->name('honorarium-summary.download');
    //student-records route
    Route::get('/student-records', [StudentRecordController::class, 'index'])->name('student-records.index');
    Route::put('/student-records/{studentRecord}', [StudentRecordController::class, 'update'])->name('student-records.update');
    Route::delete('/student-records/{studentRecord}', [StudentRecordController::class, 'destroy'])->name('student-records.destroy');
    
    
    //Schedules route
    Route::get('schedules', function () {
        return Inertia::render('coordinator/schedule/Index');
    })->name('schedules.index');

    Route::get('/defense-requests/calendar', [DefenseRequestController::class, 'calendar']);

    // Messaging routes
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

});

    
  Route::get('/api/defense-requests/count', [DefenseRequestController::class, 'count']);



require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
