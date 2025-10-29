<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Http\Controllers\Auth\AuthenticatedSessionV2Controller;

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    // API Login (default)
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);
    
    // Local Login
    Route::get('login-local', [AuthenticatedSessionController::class, 'createLocal'])
        ->name('login.local');
    
    Route::post('login-local', [AuthenticatedSessionController::class, 'storeLocal'])
        ->name('login.local.submit');
    
    Route::post('login-with-uic-api', [AuthenticatedSessionV2Controller::class, 'loginWithUICAPI'])
        ->name('login.uic.api');

    // V2 Debug login (no OAuth) - only enabled when DEBUG_LOGIN_V2=true or APP_ENV != production
    Route::get('login-v2', [\App\Http\Controllers\Auth\AuthenticatedSessionV2Controller::class, 'create'])
        ->name('login.v2.get');
    Route::post('login-v2', [\App\Http\Controllers\Auth\AuthenticatedSessionV2Controller::class, 'store'])
        ->name('login.v2');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});

Route::post('/login-registered', function (Request $request) {
    $credentials = $request->validate([
        'identifier' => 'required|string',
        'password' => 'required|string',
    ]);

    $user = User::where('email', $credentials['identifier'])
        ->orWhere('school_id', $credentials['identifier'])
        ->first();

    if ($user && $user->password && Hash::check($credentials['password'], $user->password)) {
        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();
        return redirect()->intended('/dashboard');
    }

    return back()->withErrors([
        'identifier' => 'These credentials do not match our records.',
    ]);
})->name('login.registered');
