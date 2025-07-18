<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');


// The routes here means that to be rendered or accessed, you need to login or have prior authentication.
Route::middleware(['auth', 'verified'])->group(function () {
    //Dashboard route

    Route::get('dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');


    //Notification route
    Route::get('notification', function () {
        return Inertia::render('notification/Index');
    })->name('notification.index');

    //Payment route
    Route::get('payment', function () {
        return Inertia::render('payment/Index');
    })->name('payment.index');


    //Schedule route
    Route::get('schedule', function () {
        return Inertia::render('schedule/Index');
    })->name('schedule.index');


    //Submissions routes 
    //Defense Request route
    Route::get('defense-request', function () {
        return Inertia::render('submissions/defense-request/Index');
    })->name('defense-request.index');
    //Comprehensive Exam route
    Route::get('comprehensive-exam', function () {
        return Inertia::render('submissions/comprehensive-exam/Index');
    })->name('comprehensive-exam.index');

    

});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
