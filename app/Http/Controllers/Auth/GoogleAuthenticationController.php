<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class GoogleAuthenticationController extends Controller
{
    public function redirect(): Response
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $exception) {
            report($exception);

            return redirect()->route('login')->with('error', 'Google sign-in could not be completed. Please try again.');
        }

        $email = strtolower(trim((string) $googleUser->getEmail()));
        $allowedDomain = strtolower((string) config('services.google.allowed_domain'));

        $isEmailVerified = (bool) data_get($googleUser->getRaw(), 'email_verified', false);

        if ($email === '' || ! $googleUser->getId() || ! $isEmailVerified) {
            return redirect()->route('login')->with('error', 'Google did not provide a verified email address.');
        }

        if ($allowedDomain !== '' && ! str_ends_with($email, '@'.$allowedDomain)) {
            return redirect()->route('login')->with('error', 'Please use your institutional Google account.');
        }

        $user = User::where('google_id', $googleUser->getId())->first()
            ?? User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (! $user) {
            return redirect()->route('login')->with('error', 'No existing Graduate School System account is linked to this Google email. Sign in with your institutional credentials first.');
        }

        if ($user->google_id && $user->google_id !== $googleUser->getId()) {
            return redirect()->route('login')->with('error', 'This Google account is already linked to a different system account.');
        }

        $user->forceFill([
            'google_id' => $googleUser->getId(),
            'google_verified_at' => now(),
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        Auth::login($user, true);
        request()->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }
}
