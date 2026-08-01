<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to Google's OAuth page.
     */
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->with(['prompt' => 'select_account'])
            ->redirect();
    }

    /**
     * Handle the Google OAuth callback.
     */
    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            Log::error('Google SSO callback failed', ['error' => $e->getMessage()]);
            return redirect()->route('login')
                ->withErrors(['identifier' => 'Google sign-in failed. Please try again.']);
        }

        $email = $googleUser->getEmail();

        if (! $email) {
            return redirect()->route('login')
                ->withErrors(['identifier' => 'Your Google account does not expose an email address.']);
        }

        // Find existing user by email
        $user = User::where('email', $email)->first();

        if (! $user) {
            // Auto-create a new user from Google profile
            $user = User::create([
                'first_name' => $googleUser->user['given_name'] ?? '',
                'last_name'  => $googleUser->user['family_name'] ?? '',
                'email'      => $email,
                'password'   => bcrypt(uniqid()), // SSO users have no real password; random hash satisfies NOT NULL
                'role'       => 'Student',
                'google_verified_at' => now(),
            ]);
        } else {
            // Mark existing user as Google-verified
            if (! $user->google_verified_at) {
                $user->google_verified_at = now();
                $user->save();
            }
        }

        Auth::login($user, true);
        request()->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }
}
