<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Services\LegacyPortalClient;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'identifier' => ['required','string','max:100'], // email or student number
            'password' => ['required','string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $identifier = (string)$this->input('identifier');
        $credentialsField = 'email';
        $credentials = [];

        if (preg_match('/^[0-9]{6,}$/', $identifier)) {
            // Require prior Google verification (domain check) before allowing numeric login
            $existing = User::where('student_number', $identifier)
                ->orWhere('school_id', $identifier)
                ->orWhere('email', $identifier.'@uic.edu.ph')
                ->orWhere('email', 'like', '%_'.$identifier.'@uic.edu.ph') // pattern: name_123456789@uic.edu.ph
                ->first();
            $sessionVerifiedEmail = session()->get('google_verified_email');
            $sessionVerifiedUser = null;
            if ($sessionVerifiedEmail) {
                $sessionVerifiedUser = User::where('email', $sessionVerifiedEmail)->first();
            }
            if (!$existing || !$existing->google_verified_at) {
                // Allow if session has verified Google email whose local part ends with _<identifier>
                $allowViaSession = false;
                if ($sessionVerifiedUser && $sessionVerifiedUser->google_verified_at) {
                    if ($sessionVerifiedUser->student_number === $identifier || $sessionVerifiedUser->school_id === $identifier) {
                        $allowViaSession = true;
                    } else {
                        $local = strstr($sessionVerifiedEmail, '@', true) ?: $sessionVerifiedEmail;
                        if (preg_match('/_(\d{6,})$/', $local, $m) && $m[1] === $identifier) {
                            $allowViaSession = true;
                        }
                    }
                }
                if (!$allowViaSession) {
                    throw ValidationException::withMessages([
                        'identifier' => 'Please sign in with Google (@uic.edu.ph) once before using your student number.',
                    ]);
                }
            }
            // Remote legacy portal authentication flow
            /** @var LegacyPortalClient $legacy */
            $legacy = app(LegacyPortalClient::class);
            try {
                $session = $legacy->login($identifier, (string)$this->input('password'));
            } catch (\Throwable $e) {
                RateLimiter::hit($this->throttleKey());
                Log::warning('Legacy remote auth failed (login)', ['id' => $identifier, 'error' => $e->getMessage()]);
                throw ValidationException::withMessages([
                    'identifier' => 'Legacy authentication failed.',
                ]);
            }

            // Non-fatal enrichment
            $nameParts = null;
            $programValue = null;
            try {
                $homeHtml = $legacy->fetchHomeHtml($session);
                $parsed = $legacy->extractStudentName($homeHtml);
                if ($parsed) {
                    $nameParts = $parsed;
                }
                // Quick program scrape (fallback) if keyword present
                if (preg_match('/Degree Program:\s*<b>([^<]+)<\/b>/i', $homeHtml, $pm)) {
                    $programValue = trim($pm[1]);
                }
            } catch (\Throwable $e) {
                Log::info('Legacy home/name enrichment skipped', [
                    'id' => $identifier,
                    'error' => $e->getMessage(),
                ]);
            }

            // Auto-provision or update local user
            // Prefer an existing record that already owns this student number to avoid duplicate constraint violations
            $studentUser = User::where('student_number', $identifier)
                ->orWhere('school_id', $identifier)
                ->first();
            $emailVariantUser = User::where('email', $identifier.'@uic.edu.ph')
                ->orWhere('email', 'like', '%_'.$identifier.'@uic.edu.ph')
                ->first();

            // Merge metadata if both exist (do NOT copy student_number to the emailVariantUser to avoid duplicates)
            if ($studentUser && $emailVariantUser && $studentUser->id !== $emailVariantUser->id) {
                $needsUpdate = [];
                // Copy google verification timestamp if only on email variant
                if (!$studentUser->google_verified_at && $emailVariantUser->google_verified_at) {
                    $needsUpdate['google_verified_at'] = $emailVariantUser->google_verified_at;
                }
                // Fill missing names/program
                foreach (['first_name','middle_name','last_name','program'] as $field) {
                    if (empty($studentUser->{$field}) && !empty($emailVariantUser->{$field})) {
                        $needsUpdate[$field] = $emailVariantUser->{$field};
                    }
                }
                if ($needsUpdate) {
                    try { $studentUser->update($needsUpdate); } catch (\Throwable $e) { Log::info('User merge partial update failed', ['error' => $e->getMessage()]); }
                }
                $user = $studentUser; // always use the primary numeric user
            } else {
                $user = $studentUser ?: $emailVariantUser;
            }

            if (!$user) {
                $payload = [
                    'student_number' => $identifier,
                    'school_id' => $identifier,
                    'email' => $identifier.'@uic.edu.ph',
                    'password' => Hash::make(Str::random(32)),
                    'role' => 'Student',
                ];
                if (!empty($nameParts)) {
                    $payload = array_merge($payload, $nameParts);
                }
                if ($programValue) {
                    $payload['program'] = $programValue;
                }
                $user = User::create($payload);
            } else {
                $update = [];
                // Only attach student_number/school_id if they are empty AND no other record owns this number
                if (empty($user->student_number) && !$studentUser) {
                    $update['student_number'] = $identifier;
                }
                if (empty($user->school_id) && !$studentUser) {
                    $update['school_id'] = $identifier;
                }
                if (!empty($nameParts)) {
                // Update missing name fields if currently null
                foreach (['first_name','middle_name','last_name'] as $k) {
                    if (empty($user->{$k}) && isset($nameParts[$k])) {
                        $update[$k] = $nameParts[$k];
                    }
                }
                }
                if ($programValue && empty($user->program)) {
                    $update['program'] = $programValue;
                }
                if ($update) {
                    $user->update($update);
                }
            }

            Auth::login($user, $this->boolean('remember'));

            // Cache legacy session (short TTL) for downstream data fetch (e.g., academic records)
            try {
                Cache::put('legacy_session_'.$user->id, $session, now()->addMinutes(10));
            } catch (\Throwable $e) {
                Log::info('Failed caching legacy session', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            }

            // Deeper program enrichment via academic records page if still missing
            if (empty($user->program)) {
                try {
                    $academicHtml = $legacy->fetchAcademicRecordsHtml($session);
                    $parsedAcademic = $legacy->parseAcademicRecords($academicHtml);
                    if (!empty($parsedAcademic['student']['program'])) {
                        $prog = trim($parsedAcademic['student']['program']);
                        if ($prog && empty($user->program)) {
                            $user->update(['program' => $prog]);
                        }
                    }
                } catch (\Throwable $e) {
                    Log::info('Program enrichment deferred', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('Legacy numeric login success', ['user_id' => $user->id, 'identifier' => $identifier]);
            RateLimiter::clear($this->throttleKey());
            return;
        } else {
            // Block direct email/password login; require Google OAuth path instead
            throw ValidationException::withMessages([
                'identifier' => 'Email/password login disabled. Use "Sign in with Google" first, then use your student number.',
            ]);
        }

    // (Email branch disabled above, so we only reach here for numeric which returns earlier.)
    }
    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
    return Str::transliterate(Str::lower((string)$this->input('identifier')).'|'.$this->ip());
    }
}
