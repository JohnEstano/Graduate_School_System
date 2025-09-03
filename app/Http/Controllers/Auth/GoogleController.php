<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Http\RedirectResponse;

class GoogleController extends Controller
{
    /**
     * Redirect the user to Google for authentication.
     */
    public function redirect(): RedirectResponse
    {
    return Socialite::driver('google')->redirect();
    }

    /**
     * Handle callback from Google.
     */
    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            return redirect()->route('login')->withErrors(['google' => 'Google authentication failed.']);
        }

        $email = strtolower($googleUser->getEmail());

        // Enforce domain restriction
        if (!str_ends_with($email, '@uic.edu.ph')) {
            return redirect()->route('login')->withErrors(['google' => 'Only institutional @uic.edu.ph emails are allowed.']);
        }

        // Try to find existing user
        $user = User::where('email', $email)->first();

        if (!$user) {
            // Attempt to split name into parts
            $fullName = $googleUser->getName() ?: '';
            $parts = preg_split('/\s+/', trim($fullName));
            $first = array_shift($parts) ?: 'User';
            $last = count($parts) ? array_pop($parts) : 'Account';
            $middle = count($parts) ? implode(' ', $parts) : null;

            $user = User::create([
                'first_name' => $first,
                'middle_name' => $middle,
                'last_name' => $last,
                'email' => $email,
                'password' => Hash::make(Str::random(32)), // random password, not used for login
                'role' => 'Student', // default role; adjust if needed
                'program' => null,
                'school_id' => null,
            ]);
        }

        Auth::login($user, true);

        return redirect()->intended(route('dashboard'));
    }
}
