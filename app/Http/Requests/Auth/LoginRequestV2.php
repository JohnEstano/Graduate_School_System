<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Support\Str;
use App\Models\User;
use App\Services\LegacyPortalClient;
use App\Services\StudentProfileEnricher;

class LoginRequestV2 extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'identifier' => ['required','string','max:100'],
            'password' => ['required','string'],
        ];
    }

    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();
        $identifier = trim((string)$this->input('identifier'));
        $password = (string)$this->input('password');

        $isNumeric = preg_match('/^[0-9]{6,}$/', $identifier);
        $mappedNumeric = null;
        if (!$isNumeric && preg_match('/_(\d{6,})$/', $identifier, $m)) {
            $mappedNumeric = $m[1];
        }
        if ($isNumeric) {
            $mappedNumeric = $identifier;
        }

        $legacySession = null;
        /** @var LegacyPortalClient $legacy */
        $legacy = app(LegacyPortalClient::class);
    $isCoordinator = false; $isStaff = false;
        try {
            if ($mappedNumeric) {
                $legacySession = $legacy->login($mappedNumeric, $password);
            } else {
                $legacySession = $legacy->loginCoordinator($identifier, $password); // unified staff login
                $isStaff = true; // determine exact role after fetching home page
            }
        } catch (\Throwable $e) {
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'identifier' => 'Legacy authentication failed.',
            ]);
        }

        // Find or create user
        $user = null;
        if ($mappedNumeric) {
            $user = User::where('student_number', $mappedNumeric)
                ->orWhere('school_id', $mappedNumeric)
                ->orWhere('email', $mappedNumeric.'@uic.edu.ph')
                ->first();
        }
        if (!$user) {
            $email = str_contains($identifier,'@') ? strtolower($identifier) : strtolower($identifier).'@uic.edu.ph';
            $user = User::where('email', $email)->first();
        }
        if (!$user) {
            $user = User::create([
                'email' => str_contains($identifier,'@') ? strtolower($identifier) : strtolower($identifier).'@uic.edu.ph',
                'student_number' => $mappedNumeric,
                'school_id' => $mappedNumeric,
                'password' => Hash::make(Str::random(32)),
                'role' => $isStaff ? 'Faculty' : ($mappedNumeric ? env('DEBUG_V2_DEFAULT_ROLE','Student') : 'Faculty'),
            ]);
            // Base role pivot assignment
            if ($mappedNumeric) {
                $user->addRole('Student');
            }
            if ($isStaff) {
                $user->addRole('Faculty');
            }
        } else {
            // Attach numeric if learned
            $updates = [];
            if ($mappedNumeric && empty($user->student_number)) $updates['student_number'] = $mappedNumeric;
            if ($mappedNumeric && empty($user->school_id)) $updates['school_id'] = $mappedNumeric;
            if ($isStaff && !in_array($user->role, ['Coordinator','Faculty','Dean','Chair'])) {
                $updates['role'] = 'Faculty';
            }
            if ($updates) { $user->update($updates); }
            if ($mappedNumeric) $user->addRole('Student');
            if ($isStaff) $user->addRole('Faculty');
        }

        Auth::login($user, $this->boolean('remember'));

        if ($legacySession) {
            try { Cache::put('legacy_session_'.$user->id, $legacySession, now()->addMinutes(30)); } catch (\Throwable $e) {}
            try {
                app(StudentProfileEnricher::class)->enrich($user, $legacySession, $isStaff);
            } catch (\Throwable $e) {
                Log::debug('Login enrichment failed: '.$e->getMessage());
            }
        }
        RateLimiter::clear($this->throttleKey());
    }

    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) return;
        event(new Lockout($this));
        $seconds = RateLimiter::availableIn($this->throttleKey());
        throw ValidationException::withMessages([
            'identifier' => 'Too many attempts. Try again in '.ceil($seconds/60).' minutes.'
        ]);
    }

    public function throttleKey(): string
    {
        return Str::lower($this->ip().'|'.(string)$this->input('identifier'));
    }
}
