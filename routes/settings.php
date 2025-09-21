<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
| Central settings & profile routes.
| Provides both /settings/profile and legacy /profile path (same name: profile.edit).
*/
Route::middleware(['auth','verified'])->group(function () {

    // /settings -> /settings/profile
    Route::redirect('/settings', '/settings/profile')->name('settings');

    // Primary profile edit page (settings section)
    Route::get('/settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Legacy direct /profile path (same component) – keeps Ziggy route('profile.edit') working
    Route::get('/profile', [ProfileController::class, 'edit']);

    // Password (if separate form)
    Route::get('/settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('/settings/password', [PasswordController::class, 'update'])->name('password.update');

    // Appearance (example page)
    Route::get('/settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');
});
