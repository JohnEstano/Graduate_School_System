<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role; // FIX: import Role
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|string|in:Student,Administrative Assistant,Coordinator,Dean,Registrar', // include Registrar
            'school_id' => 'required|string|max:255',
            'program' => 'nullable|string|max:255',
        ]);

        $roleName = $validated['role'] ?? 'Student';
        $roleId = Role::where('name', $roleName)->value('id')
            ?? Role::where('name', 'Student')->value('id'); // fallback

        $user = User::create([
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'school_id' => $validated['school_id'],
            'program' => $validated['program'] ?? null,
            'role_id' => $roleId,     // FK to roles table
            'role' => $roleName,      // optional legacy column; remove when not needed
        ]);

        event(new Registered($user));
        Auth::login($user);

        // Update adviser status if matching adviser exists
        $adviser = \App\Models\Adviser::where('email', $user->email)->first();
        if ($adviser) {
            $adviser->status = 'active';
            $adviser->user_id = $user->id;
            $adviser->save();
        }

        return to_route('dashboard');
    }
}
