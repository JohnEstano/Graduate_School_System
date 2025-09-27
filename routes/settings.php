<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\DocumentTemplate;
use Illuminate\Http\Request;

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
    Route::get('/settings/appearance', fn () => Inertia::render('settings/appearance'))->name('appearance');

    // Document Templates (Dean / Coordinator)
    Route::get('/settings/documents', function () {
        abort_unless(in_array(Auth::user()->role,['Dean','Coordinator']),403);
        return Inertia::render('settings/documents/Index');
    })->name('settings.documents');

    Route::get('/settings/documents/{template}/edit', function (DocumentTemplate $template) {
        abort_unless(in_array(Auth::user()->role,['Dean','Coordinator']),403);
        return Inertia::render('settings/documents/TemplateEditor', [
            'templateId' => $template->id,
            'template'   => $template
        ]);
    })->name('settings.documents.edit');

    // E‑Signatures
    Route::get('/settings/signatures', function () {
        return Inertia::render('settings/signatures/Index');
    })->name('settings.signatures');

    // General Settings (Coordinator only)
    Route::get('/settings/general', function () {
        abort_unless(Auth::user()->role === 'Coordinator', 403);
        $acceptDefense = \DB::table('settings')->where('key', 'accept_defense')->value('value');
        $acceptDefense = $acceptDefense === null ? true : $acceptDefense === '1'; // <-- FIXED
        return Inertia::render('settings/general', [
            'initialAcceptDefense' => $acceptDefense,
        ]);
    })->name('settings.general');

    Route::post('/api/settings/general', function (Request $request) {
        abort_unless(Auth::user()->role === 'Coordinator', 403);
        $accept = $request->input('acceptDefense') ? '1' : '0';
        \DB::table('settings')->updateOrInsert(
            ['key' => 'accept_defense'],
            ['value' => $accept]
        );
        return response()->json(['ok' => true, 'acceptDefense' => $accept]);
    });
});
