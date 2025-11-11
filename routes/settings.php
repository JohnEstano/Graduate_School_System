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
        $role = Auth::user()->role;
        abort_unless(in_array($role, ['Coordinator', 'Adviser', 'Faculty']), 403);

        // Coordinator: defense submissions
        $acceptDefense = null;
        if ($role === 'Coordinator') {
            $acceptDefense = \DB::table('settings')->where('key', 'accept_defense')->value('value');
            $acceptDefense = $acceptDefense === null ? true : $acceptDefense === '1';
        }

        // Adviser/Faculty: adviser code and auto-accept
        $autoAccept = null;
        $adviserCode = null;
        if (in_array($role, ['Adviser', 'Faculty'])) {
            $autoAccept = \DB::table('adviser_settings')->where('adviser_id', Auth::id())->value('auto_accept_students');
            $autoAccept = $autoAccept === null ? false : $autoAccept == 1;
            $adviserCode = Auth::user()->adviser_code;
        }

        return Inertia::render('settings/general', [
            'role' => $role,
            'initialAcceptDefense' => $acceptDefense,
            'initialAutoAccept' => $autoAccept,
            'initialAdviserCode' => $adviserCode,
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

    // Adviser code reset
    Route::post('/settings/adviser/reset-code', function (Request $request) {
        $user = Auth::user();
        abort_unless(in_array($user->role, ['Adviser', 'Faculty']), 403);
        $user->adviser_code = null;
        $user->generateAdviserCode();
        $user->save();
        return response()->json(['adviser_code' => $user->adviser_code]);
    });

    // Adviser auto-accept toggle
    Route::post('/settings/adviser/auto-accept', function (Request $request) {
        $user = Auth::user();
        abort_unless(in_array($user->role, ['Adviser', 'Faculty']), 403);
        $autoAccept = $request->input('autoAccept') ? 1 : 0;
        \DB::table('adviser_settings')->updateOrInsert(
            ['adviser_id' => $user->id],
            ['auto_accept_students' => $autoAccept]
        );
        return response()->json(['autoAccept' => $autoAccept]);
    });

    Route::get('/settings/adviser', function () {
        $user = Auth::user();
        abort_unless(in_array($user->role, ['Adviser', 'Faculty']), 403);

        $autoAccept = \DB::table('adviser_settings')->where('adviser_id', $user->id)->value('auto_accept_students');
        $autoAccept = $autoAccept === null ? false : $autoAccept == 1;

        return Inertia::render('settings/adviser', [
            'initialAutoAccept' => $autoAccept,
            'initialAdviserCode' => $user->adviser_code,
        ]);
    })->name('settings.adviser');

    // Dean Delegation Settings
    Route::get('/settings/dean-delegation', function () {
        abort_unless(Auth::user()->role === 'Dean', 403);
        return Inertia::render('settings/dean-delegation');
    })->name('settings.dean-delegation');

    // API: Get coordinators and their delegation status
    Route::get('/api/dean/coordinator-delegation', function () {
        abort_unless(Auth::user()->role === 'Dean', 403);
        
        $deanId = Auth::id();
        
        // Get all coordinators
        $coordinators = \DB::table('users')
            ->where('role', 'Coordinator')
            ->select('id', 'first_name', 'last_name', 'email', 'program')
            ->get()
            ->map(function ($coord) use ($deanId) {
                $setting = \DB::table('coordinator_delegation_settings')
                    ->where('dean_id', $deanId)
                    ->where('coordinator_id', $coord->id)
                    ->first();
                
                return [
                    'id' => $coord->id,
                    'name' => trim($coord->first_name . ' ' . $coord->last_name),
                    'email' => $coord->email,
                    'program' => $coord->program,
                    'can_sign_on_behalf' => $setting ? (bool)$setting->can_sign_on_behalf : false,
                ];
            });
        
        return response()->json($coordinators);
    });

    // API: Update delegation setting
    Route::post('/api/dean/coordinator-delegation', function (Request $request) {
        abort_unless(Auth::user()->role === 'Dean', 403);
        
        $validated = $request->validate([
            'coordinator_id' => 'required|exists:users,id',
            'can_sign_on_behalf' => 'required|boolean',
        ]);
        
        $deanId = Auth::id();
        
        \DB::table('coordinator_delegation_settings')->updateOrInsert(
            [
                'dean_id' => $deanId,
                'coordinator_id' => $validated['coordinator_id'],
            ],
            [
                'can_sign_on_behalf' => $validated['can_sign_on_behalf'],
                'updated_at' => now(),
            ]
        );
        
        return response()->json(['ok' => true]);
    });
});
