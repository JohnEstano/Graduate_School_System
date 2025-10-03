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

    // Mark Google verification timestamp WITHOUT logging user in yet.
    // Flow requirement: Return user to login screen with student number form now enabled.
        $user->markGoogleVerified();

        // Derive a suggested identifier (student number or faculty username) from email local part.
        $local = strstr($email, '@', true) ?: $email; // part before @
        $suggestedIdentifier = null;
        // Pattern: name_230000001047 -> extract numeric segment after last underscore if 6+ digits
        if (preg_match('/_(\d{6,})$/', $local, $m)) {
            $suggestedIdentifier = $m[1];
        } else {
            // Fallback: use the entire local part (e.g., faculty username like gdiapana)
            $suggestedIdentifier = $local;
        }

        // Store session flags for login page consumption.
        session()->put('google_verified_email', $email);
        session()->flash('google_success', 'Google verification successful. You may now sign in.');
        session()->flash('google_suggested_identifier', $suggestedIdentifier);

    // Do NOT Auth::login($user); user must still pass numeric legacy auth.
    return redirect()->route('login');
    }
}
