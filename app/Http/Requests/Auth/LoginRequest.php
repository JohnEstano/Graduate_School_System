<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Support\Str;
use App\Models\User;
use App\Services\LegacyPortalClient;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'identifier' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string'],
        ];
    }

    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();
        
        $identifier = trim((string)$this->input('identifier'));
        $password = (string)$this->input('password');

        Log::info("Login: Starting authentication", [
            'identifier' => $identifier,
            'has_password' => !empty($password)
        ]);

        // Super Admin bypass
        if ($identifier === 'superadmin@uic.edu.ph' || $identifier === 'superadmin') {
            $superAdmin = User::where('email', 'superadmin@uic.edu.ph')->first();
            
            if (!$superAdmin) {
                $superAdmin = User::create([
                    'first_name' => 'Super',
                    'middle_name' => null,
                    'last_name' => 'Admin',
                    'email' => 'superadmin@uic.edu.ph',
                    'password' => Hash::make('supersecurepassword'),
                    'role' => 'Super Admin',
                    'school_id' => 'ADMIN001',
                ]);
            }
            
            if (Hash::check($password, $superAdmin->password)) {
                Auth::login($superAdmin, $this->boolean('remember'));
                RateLimiter::clear($this->throttleKey());
                return;
            } else {
                RateLimiter::hit($this->throttleKey());
                throw ValidationException::withMessages([
                    'identifier' => 'Invalid Super Admin credentials.',
                ]);
            }
        }

        // Detect numeric student ID
        $isNumeric = preg_match('/^[0-9]{6,}$/', $identifier);
        $mappedNumeric = null;
        
        if (!$isNumeric && preg_match('/_(\d{6,})$/', $identifier, $m)) {
            $mappedNumeric = $m[1];
        }
        
        if ($isNumeric) {
            $mappedNumeric = $identifier;
        }

        $legacySession = null;
        $legacy = app(LegacyPortalClient::class);
        $isStaff = false;
        
        // Find existing user
        $user = null;
        if ($mappedNumeric) {
            $user = User::where('student_number', $mappedNumeric)
                ->orWhere('school_id', $mappedNumeric)
                ->orWhere('email', $mappedNumeric . '@uic.edu.ph')
                ->orWhere('email', 'LIKE', '%_' . $mappedNumeric . '@uic.edu.ph')
                ->first();
        }
        
        if (!$user) {
            $email = str_contains($identifier, '@') ? strtolower($identifier) : strtolower($identifier) . '@uic.edu.ph';
            $user = User::where('email', $email)->first();
            
            // Try extracting student ID from UIC email
            if (!$user && str_contains($email, '_') && str_contains($email, '@uic.edu.ph')) {
                $parts = explode('_', explode('@', $email)[0]);
                if (count($parts) >= 2) {
                    $possibleStudentId = $parts[1];
                    $user = User::where('school_id', $possibleStudentId)->first();
                }
            }
        }
        
        // Legacy authentication
        try {
            Log::info("Login: Attempting legacy authentication", [
                'mapped_numeric' => $mappedNumeric,
                'is_student' => !empty($mappedNumeric),
                'existing_user' => $user ? 'yes' : 'no'
            ]);
            
            if ($mappedNumeric) {
                $legacySession = $legacy->login($mappedNumeric, $password);
                Log::info("Login: Legacy student login successful", [
                    'student_id' => $mappedNumeric
                ]);
            } else {
                $legacySession = $legacy->loginCoordinator($identifier, $password);
                $isStaff = true;
                Log::info("Login: Legacy staff login successful", [
                    'identifier' => $identifier
                ]);
            }
        } catch (\Throwable $e) {
            Log::error("Login: Legacy authentication failed", [
                'error' => $e->getMessage(),
                'identifier' => $identifier
            ]);
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'identifier' => 'Invalid credentials.',
            ]);
        }

        // Fetch clearance data for new students
        $clearanceData = null;
        if (!$user && !$isStaff && $mappedNumeric) {
            Log::info("Login: New student - fetching clearance data before creating user", [
                'student_number' => $mappedNumeric
            ]);
            
            try {
                $clearanceData = $this->fetchClearanceDataForNewUser($legacy, $legacySession, $mappedNumeric);
                
                if ($clearanceData) {
                    Log::info("Login: Got clearance data for new student", [
                        'firstname' => $clearanceData['firstname'] ?? 'N/A',
                        'lastname' => $clearanceData['lastname'] ?? 'N/A',
                        'account_id' => $clearanceData['account_id'] ?? 'N/A'
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning("Login: Could not fetch clearance data", ['error' => $e->getMessage()]);
            }
        }
        
        // Create user if doesn't exist
        if (!$user) {
            Log::info("Login: Creating new user", [
                'identifier' => $identifier,
                'mapped_numeric' => $mappedNumeric,
                'is_staff' => $isStaff,
                'has_clearance_data' => !empty($clearanceData)
            ]);
            
            $email = str_contains($identifier, '@') ? strtolower($identifier) : strtolower($identifier) . '@uic.edu.ph';
            
            $userData = [
                'email' => $email,
                'student_number' => $mappedNumeric,
                'school_id' => $mappedNumeric,
                'password' => Hash::make(Str::random(32)),
                'role' => $isStaff ? 'Faculty' : 'Student',
            ];
            
            if ($clearanceData) {
                $userData['first_name'] = $clearanceData['firstname'] ?? 'New';
                $userData['last_name'] = $clearanceData['lastname'] ?? 'User';
                $userData['middle_name'] = $clearanceData['middlename'] ?? null;
                $userData['legacy_account_id'] = $clearanceData['account_id'] ?? null;
                $userData['student_number_legacy'] = $clearanceData['student_number'] ?? null;
                $userData['degree_code'] = $clearanceData['degree_code'] ?? null;
                $userData['degree_program_id'] = $clearanceData['degree_program_id'] ?? null;
                $userData['year_level'] = $clearanceData['year_level'] ?? null;
                $userData['balance'] = $clearanceData['balance'] ?? null;
                $userData['clearance_statuscode'] = $clearanceData['statuscode'] ?? null;
                $userData['legacy_data_synced_at'] = now();
            } else {
                $userData['first_name'] = 'New';
                $userData['last_name'] = 'User';
            }
            
            $user = User::create($userData);
            
            Log::info("Login: User created successfully", [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'name' => $user->first_name . ' ' . $user->last_name,
                'has_legacy_account_id' => !empty($user->legacy_account_id)
            ]);
            
            // Set flag for first login - will trigger page reload to get updated user data
            session()->put('first_login', true);
            
            if ($mappedNumeric) {
                $user->addRole('Student');
            }
            if ($isStaff) {
                $user->addRole('Faculty');
            }
        } else {
            // Update existing user
            $updates = [];
            if ($mappedNumeric && empty($user->student_number)) {
                $updates['student_number'] = $mappedNumeric;
            }
            if ($mappedNumeric && empty($user->school_id)) {
                $updates['school_id'] = $mappedNumeric;
            }
            if ($isStaff && !in_array($user->role, ['Coordinator', 'Faculty', 'Dean', 'Chair'])) {
                $updates['role'] = 'Faculty';
            }
            if ($updates) {
                Log::info("Login: Updating existing user", [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'updates' => $updates
                ]);
                $user->update($updates);
            }
            if ($mappedNumeric) {
                $user->addRole('Student');
            }
            if ($isStaff) {
                $user->addRole('Faculty');
            }
        }

        Log::info("Login: About to authenticate user session", [
            'user_id' => $user->id,
            'email' => $user->email,
            'remember' => $this->boolean('remember')
        ]);
        
        Auth::login($user, $this->boolean('remember'));
        
        Log::info("Login: User session authenticated successfully", [
            'user_id' => $user->id,
            'auth_check' => Auth::check(),
            'auth_user_id' => Auth::id(),
            'session_id' => session()->getId()
        ]);

        if ($legacySession) {
            Log::info("Login: Processing legacy session data", [
                'user_id' => $user->id,
                'has_legacy_session' => !empty($legacySession)
            ]);
            
            try {
                Cache::put('legacy_session_' . $user->id, $legacySession, now()->addMinutes(30));
                Log::info("Login: Legacy session cached", [
                    'user_id' => $user->id
                ]);
            } catch (\Throwable $e) {
                Log::error("Login: Failed to cache legacy session", [
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
            }
            
            // CRITICAL: Fetch account_id from clearance API (if not already done during user creation)
            // This is the master key that connects everything in the legacy system
            if ($user->role === 'Student' && (!$user->legacy_account_id || !$user->clearance_statuscode) && $user->last_name && $user->last_name !== 'User') {
                try {
                    Log::info("Login: Fetching/refreshing clearance data from API", [
                        'user_id' => $user->id,
                        'last_name' => $user->last_name,
                        'has_legacy_account_id' => !empty($user->legacy_account_id),
                        'has_clearance_statuscode' => !empty($user->clearance_statuscode)
                    ]);
                    
                    $this->fetchAndStoreLegacyAccountId($legacy, $user);
                } catch (\Throwable $e) {
                    Log::error("Login: Failed to fetch clearance data", [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                }
            } elseif ($user->legacy_account_id && $user->clearance_statuscode) {
                Log::info("Login: Skipping clearance fetch - already have complete clearance data", [
                    'user_id' => $user->id,
                    'legacy_account_id' => $user->legacy_account_id
                ]);
            }
            
            // Set flag for background profile enrichment
            try {
                Log::info("Login: Setting flags for background enrichment", [
                    'user_id' => $user->id,
                    'is_staff' => $isStaff
                ]);
                
                // Store enrichment data for background processing
                Cache::put('pending_enrichment_' . $user->id, [
                    'is_staff' => $isStaff,
                    'timestamp' => now()
                ], now()->addMinutes(10));
                
                Log::info("Login: Background enrichment flag set", [
                    'user_id' => $user->id
                ]);
            } catch (\Throwable $e) {
                Log::error("Login: Failed to set enrichment flag", [
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
            }
        } else {
            Log::info("Login: No legacy session data available", [
                'user_id' => $user->id
            ]);
        }
        
        RateLimiter::clear($this->throttleKey());
    }

    public function ensureIsNotRateLimited(): void
    {
        if (!RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }
        
        event(new Lockout($this));
        $seconds = RateLimiter::availableIn($this->throttleKey());
        
        throw ValidationException::withMessages([
            'identifier' => 'Too many attempts. Try again in ' . ceil($seconds / 60) . ' minutes.'
        ]);
    }

    public function throttleKey(): string
    {
        return Str::lower($this->ip() . '|' . (string)$this->input('identifier'));
    }

    private function fetchAndStoreLegacyAccountId(LegacyPortalClient $legacy, User $user): void
    {
        $lastName = strtoupper($user->last_name);
        $legacySession = Cache::get('legacy_session_' . $user->id);
        
        if (!$legacySession) {
            return;
        }
        
        $clearanceData = $legacy->fetchClearanceByKeyword($legacySession, $lastName);
        
        if (!is_array($clearanceData) || empty($clearanceData)) {
            return;
        }
        
        $matchedRecord = null;
        foreach ($clearanceData as $record) {
            if (isset($record['student_number']) && $user->student_number && 
                $record['student_number'] == $user->student_number) {
                $matchedRecord = $record;
                break;
            }
            if (isset($record['firstname'], $record['lastname']) &&
                strtoupper($record['firstname']) == strtoupper($user->first_name) &&
                strtoupper($record['lastname']) == strtoupper($user->last_name)) {
                $matchedRecord = $record;
                break;
            }
        }
        
        if (!$matchedRecord && count($clearanceData) === 1) {
            $matchedRecord = $clearanceData[0];
        }
        
        if (!$matchedRecord || !isset($matchedRecord['account_id'])) {
            return;
        }
        
        $updateData = [
            'legacy_account_id' => $matchedRecord['account_id'],
            'legacy_data_synced_at' => now(),
        ];
        
        if (isset($matchedRecord['student_number']) && $matchedRecord['student_number']) {
            $updateData['student_number_legacy'] = $matchedRecord['student_number'];
            if (empty($user->student_number)) {
                $updateData['student_number'] = $matchedRecord['student_number'];
            }
        }
        if (isset($matchedRecord['degree_code'])) {
            $updateData['degree_code'] = $matchedRecord['degree_code'];
        }
        if (isset($matchedRecord['degree_program_id'])) {
            $updateData['degree_program_id'] = $matchedRecord['degree_program_id'];
        }
        if (isset($matchedRecord['year_level'])) {
            $updateData['year_level'] = $matchedRecord['year_level'];
        }
        if (isset($matchedRecord['balance'])) {
            $updateData['balance'] = $matchedRecord['balance'];
        }
        if (isset($matchedRecord['statuscode'])) {
            $updateData['clearance_statuscode'] = $matchedRecord['statuscode'];
        }
        
        $user->update($updateData);
    }

    private function fetchClearanceDataForNewUser(LegacyPortalClient $legacy, array $legacySession, string $studentNumber): ?array
    {
        try {
            $homeHtml = $legacy->fetchHomeHtml($legacySession);
            $studentName = $legacy->extractStudentName($homeHtml);
            
            if (!$studentName || !isset($studentName['last_name'])) {
                return null;
            }
            
            $clearanceData = $legacy->fetchClearanceByKeyword($legacySession, $studentName['last_name']);
            
            if (!is_array($clearanceData) || empty($clearanceData)) {
                return null;
            }
            
            foreach ($clearanceData as $record) {
                if (isset($record['student_number']) && $record['student_number'] == $studentNumber) {
                    return $record;
                }
            }
            
            if (count($clearanceData) === 1) {
                return $clearanceData[0];
            }
            
            return null;
        } catch (\Throwable $e) {
            Log::error("Login: Failed to fetch clearance data for new user", ['error' => $e->getMessage()]);
            return null;
        }
    }
}
