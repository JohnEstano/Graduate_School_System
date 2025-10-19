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

        Log::info("LoginRequestV2: Starting authentication", [
            'identifier' => $identifier,
            'has_password' => !empty($password)
        ]);

        // Super Admin bypass - check for local Super Admin account first
        if ($identifier === 'superadmin@uic.edu.ph' || $identifier === 'superadmin') {
            $superAdmin = User::where('email', 'superadmin@uic.edu.ph')->first();
            if (!$superAdmin) {
                // Create Super Admin if it doesn't exist
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

        $isNumeric = preg_match('/^[0-9]{6,}$/', $identifier);
        $mappedNumeric = null;
        if (!$isNumeric && preg_match('/_(\d{6,})$/', $identifier, $m)) {
            $mappedNumeric = $m[1];
        }
        if ($isNumeric) {
            $mappedNumeric = $identifier;
        }

        Log::info("LoginRequestV2: Parsed identifier", [
            'is_numeric' => $isNumeric,
            'mapped_numeric' => $mappedNumeric
        ]);

        $legacySession = null;
        /** @var LegacyPortalClient $legacy */
        $legacy = app(LegacyPortalClient::class);
        $isCoordinator = false; $isStaff = false;
        
        // Find or create user FIRST - Enhanced for UIC email format
        $user = null;
        Log::info("LoginRequestV2: Looking for existing user BEFORE legacy auth", [
            'mapped_numeric' => $mappedNumeric,
            'identifier' => $identifier
        ]);
        
        if ($mappedNumeric) {
            // Try multiple lookup strategies for students
            $user = User::where('student_number', $mappedNumeric)
                ->orWhere('school_id', $mappedNumeric)
                ->orWhere('email', $mappedNumeric.'@uic.edu.ph')
                ->orWhere('email', 'LIKE', '%_'.$mappedNumeric.'@uic.edu.ph') // New UIC format: firstname_id@uic.edu.ph
                ->first();
                
            if ($user) {
                Log::info("LoginRequestV2: Found existing student user - will verify password with legacy", [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
            }
        }
        if (!$user) {
            $email = str_contains($identifier,'@') ? strtolower($identifier) : strtolower($identifier).'@uic.edu.ph';
            $user = User::where('email', $email)->first();
            
            if ($user) {
                Log::info("LoginRequestV2: Found user by email - will verify password with legacy", [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
            }
            
            // If still not found and it looks like a UIC email, try extracting the student ID
            if (!$user && str_contains($email, '_') && str_contains($email, '@uic.edu.ph')) {
                $parts = explode('_', explode('@', $email)[0]);
                if (count($parts) >= 2) {
                    $possibleStudentId = $parts[1]; // Extract student ID from email
                    $user = User::where('school_id', $possibleStudentId)->first();
                    
                    if ($user) {
                        Log::info("LoginRequestV2: Found user by extracted student ID - will verify password", [
                            'user_id' => $user->id,
                            'extracted_id' => $possibleStudentId
                        ]);
                    }
                }
            }
        }
        
        // NOW do legacy authentication - required for password verification
        try {
            Log::info("LoginRequestV2: Attempting legacy authentication", [
                'mapped_numeric' => $mappedNumeric,
                'is_student' => !empty($mappedNumeric),
                'existing_user' => $user ? 'yes' : 'no'
            ]);
            
            if ($mappedNumeric) {
                $legacySession = $legacy->login($mappedNumeric, $password);
                Log::info("LoginRequestV2: Legacy student login successful", [
                    'student_id' => $mappedNumeric
                ]);
            } else {
                $legacySession = $legacy->loginCoordinator($identifier, $password); // unified staff login
                $isStaff = true; // determine exact role after fetching home page
                Log::info("LoginRequestV2: Legacy staff login successful", [
                    'identifier' => $identifier
                ]);
            }
        } catch (\Throwable $e) {
            Log::error("LoginRequestV2: Legacy authentication failed", [
                'error' => $e->getMessage(),
                'identifier' => $identifier
            ]);
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'identifier' => 'Legacy authentication failed.',
            ]);
        }

        // If user doesn't exist yet, fetch clearance data FIRST (for students)
        $clearanceData = null;
        if (!$user && !$isStaff && $mappedNumeric) {
            Log::info("LoginRequestV2: New student - fetching clearance data before creating user", [
                'student_number' => $mappedNumeric
            ]);
            
            try {
                // Try to fetch clearance data to get real name
                $clearanceData = $this->fetchClearanceDataForNewUser($legacy, $legacySession, $mappedNumeric);
                
                if ($clearanceData) {
                    Log::info("LoginRequestV2: Got clearance data for new student", [
                        'firstname' => $clearanceData['firstname'] ?? 'N/A',
                        'lastname' => $clearanceData['lastname'] ?? 'N/A',
                        'account_id' => $clearanceData['account_id'] ?? 'N/A'
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning("LoginRequestV2: Could not fetch clearance data for new student", [
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        // If user doesn't exist yet, create it
        if (!$user) {
            Log::info("LoginRequestV2: Creating new user", [
                'identifier' => $identifier,
                'mapped_numeric' => $mappedNumeric,
                'is_staff' => $isStaff,
                'has_clearance_data' => !empty($clearanceData)
            ]);
            
            // Create new user with proper initial data
            $email = str_contains($identifier,'@') ? strtolower($identifier) : strtolower($identifier).'@uic.edu.ph';
            
            // Use real data from clearance API if available
            $userData = [
                'email' => $email,
                'student_number' => $mappedNumeric,
                'school_id' => $mappedNumeric,
                'password' => Hash::make(Str::random(32)),
                'role' => $isStaff ? 'Faculty' : ($mappedNumeric ? env('DEBUG_V2_DEFAULT_ROLE','Student') : 'Faculty'),
            ];
            
            // Add real name and data from clearance if available
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
                // Fallback to placeholder names
                $userData['first_name'] = 'New';
                $userData['last_name'] = 'User';
            }
            
            $user = User::create($userData);
            
            Log::info("LoginRequestV2: User created successfully", [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'name' => $user->first_name . ' ' . $user->last_name,
                'has_legacy_account_id' => !empty($user->legacy_account_id)
            ]);
            
            // Set flag for first login - will trigger page reload to get updated user data
            session()->put('first_login', true);
            
            // Base role pivot assignment
            if ($mappedNumeric) {
                $user->addRole('Student');
            }
            if ($isStaff) {
                $user->addRole('Faculty');
            }
        } else {
            Log::info("LoginRequestV2: Using existing user", [
                'user_id' => $user->id,
                'email' => $user->email,
                'name' => $user->display_name ?? 'No name'
            ]);
            
            // Attach numeric if learned
            $updates = [];
            if ($mappedNumeric && empty($user->student_number)) $updates['student_number'] = $mappedNumeric;
            if ($mappedNumeric && empty($user->school_id)) $updates['school_id'] = $mappedNumeric;
            if ($isStaff && !in_array($user->role, ['Coordinator','Faculty','Dean','Chair'])) {
                $updates['role'] = 'Faculty';
            }
            if ($updates) { 
                Log::info("LoginRequestV2: Updating existing user", [
                    'user_id' => $user->id,
                    'updates' => $updates
                ]);
                $user->update($updates); 
            }
            if ($mappedNumeric) {
                $user->addRole('Student');
                Log::info("LoginRequestV2: Added Student role to existing user", [
                    'user_id' => $user->id
                ]);
            }
            if ($isStaff) {
                $user->addRole('Faculty');
                Log::info("LoginRequestV2: Added Faculty role to existing user", [
                    'user_id' => $user->id
                ]);
            }
        }

        Log::info("LoginRequestV2: About to log in user", [
            'user_id' => $user->id,
            'email' => $user->email,
            'remember' => $this->boolean('remember')
        ]);

        Auth::login($user, $this->boolean('remember'));

        Log::info("LoginRequestV2: User logged in successfully", [
            'user_id' => $user->id,
            'auth_check' => Auth::check(),
            'auth_user_id' => Auth::id()
        ]);

        if ($legacySession) {
            Log::info("LoginRequestV2: Processing legacy session data", [
                'user_id' => $user->id,
                'has_legacy_session' => !empty($legacySession)
            ]);
            
            try { 
                Cache::put('legacy_session_'.$user->id, $legacySession, now()->addMinutes(30)); 
                Log::info("LoginRequestV2: Legacy session cached", [
                    'user_id' => $user->id
                ]);
            } catch (\Throwable $e) {
                Log::error("LoginRequestV2: Failed to cache legacy session", [
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
            }
            
            // CRITICAL: Fetch account_id from clearance API (if not already done during user creation)
            // This is the master key that connects everything in the legacy system
            // Also fetch if missing clearance_statuscode (needed for tuition balance check)
            if ($user->role === 'Student' && (!$user->legacy_account_id || !$user->clearance_statuscode) && $user->last_name && $user->last_name !== 'User') {
                try {
                    Log::info("LoginRequestV2: Fetching/refreshing clearance data from API", [
                        'user_id' => $user->id,
                        'last_name' => $user->last_name,
                        'has_legacy_account_id' => !empty($user->legacy_account_id),
                        'has_clearance_statuscode' => !empty($user->clearance_statuscode)
                    ]);
                    
                    $this->fetchAndStoreLegacyAccountId($legacy, $user);
                } catch (\Throwable $e) {
                    Log::error("LoginRequestV2: Failed to fetch clearance data", [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            } elseif ($user->legacy_account_id && $user->clearance_statuscode) {
                Log::info("LoginRequestV2: Skipping clearance fetch - already have complete clearance data", [
                    'user_id' => $user->id,
                    'legacy_account_id' => $user->legacy_account_id
                ]);
            }
            
            // MOVE PROFILE ENRICHMENT TO BACKGROUND (NON-BLOCKING)
            // Store flags for background processing
            try {
                Log::info("LoginRequestV2: Setting flags for background enrichment", [
                    'user_id' => $user->id,
                    'is_staff' => $isStaff
                ]);
                
                // Store enrichment data for background processing
                Cache::put('pending_enrichment_' . $user->id, [
                    'is_staff' => $isStaff,
                    'timestamp' => now()
                ], now()->addMinutes(10));
                
                Log::info("LoginRequestV2: Background enrichment flag set", [
                    'user_id' => $user->id
                ]);
            } catch (\Throwable $e) {
                Log::error("LoginRequestV2: Failed to set enrichment flag", [
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
            }
        } else {
            Log::info("LoginRequestV2: No legacy session data available", [
                'user_id' => $user->id
            ]);
        }
        
        // DATA SCRAPING REMOVED FROM LOGIN FLOW
        // Data will be scraped on-demand when user visits comprehensive exam page
        // This prevents 2-minute login delays
        
        Log::info("LoginRequestV2: Clearing rate limiter", [
            'throttle_key' => $this->throttleKey()
        ]);
        
        RateLimiter::clear($this->throttleKey());
        
        Log::info("LoginRequestV2: Authentication process completed successfully", [
            'user_id' => $user->id,
            'final_email' => $user->fresh()->email,
            'final_name' => $user->fresh()->display_name ?? 'No display name'
        ]);
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

    /**
     * Fetch and store legacy account_id from clearance API
     * This is the MASTER KEY that connects everything in the legacy system
     */
    private function fetchAndStoreLegacyAccountId(LegacyPortalClient $legacy, User $user): void
    {
        $lastName = strtoupper($user->last_name);
        
        Log::info("LoginRequestV2: Calling clearance API by keyword", [
            'user_id' => $user->id,
            'keyword' => $lastName
        ]);
        
        // Get legacy session from cache for authenticated request
        $legacySession = Cache::get('legacy_session_' . $user->id);
        if (!$legacySession) {
            Log::warning("LoginRequestV2: No legacy session available for clearance fetch", [
                'user_id' => $user->id
            ]);
            return;
        }
        
        // Call the clearance API endpoint
        $clearanceData = $legacy->fetchClearanceByKeyword($legacySession, $lastName);
        
        if (!is_array($clearanceData) || empty($clearanceData)) {
            Log::warning("LoginRequestV2: Empty or invalid clearance data", [
                'user_id' => $user->id,
                'last_name' => $lastName
            ]);
            return;
        }
        
        // Find matching record by student number or name
        $matchedRecord = null;
        foreach ($clearanceData as $record) {
            // Match by student number if available
            if (isset($record['student_number']) && $user->student_number && 
                $record['student_number'] == $user->student_number) {
                $matchedRecord = $record;
                break;
            }
            
            // Match by first name + last name
            if (isset($record['firstname'], $record['lastname']) &&
                strtoupper($record['firstname']) == strtoupper($user->first_name) &&
                strtoupper($record['lastname']) == strtoupper($user->last_name)) {
                $matchedRecord = $record;
                break;
            }
        }
        
        // If only one record returned, use it
        if (!$matchedRecord && count($clearanceData) === 1) {
            $matchedRecord = $clearanceData[0];
            Log::info("LoginRequestV2: Using single clearance record", [
                'user_id' => $user->id
            ]);
        }
        
        if (!$matchedRecord || !isset($matchedRecord['account_id'])) {
            Log::warning("LoginRequestV2: No matching clearance record found", [
                'user_id' => $user->id,
                'records_count' => count($clearanceData)
            ]);
            return;
        }
        
        // Extract all valuable data from clearance response
        $updateData = [
            'legacy_account_id' => $matchedRecord['account_id'],
            'legacy_data_synced_at' => now(),
        ];
        
        // Add optional fields if available
        if (isset($matchedRecord['student_number']) && $matchedRecord['student_number']) {
            $updateData['student_number_legacy'] = $matchedRecord['student_number'];
            
            // Also update main student_number if empty
            if (empty($user->student_number)) {
                $updateData['student_number'] = $matchedRecord['student_number'];
            }
        }
        
        if (isset($matchedRecord['degree_code']) && $matchedRecord['degree_code']) {
            $updateData['degree_code'] = $matchedRecord['degree_code'];
        }
        
        if (isset($matchedRecord['degree_program_id']) && $matchedRecord['degree_program_id']) {
            $updateData['degree_program_id'] = $matchedRecord['degree_program_id'];
        }
        
        if (isset($matchedRecord['year_level']) && $matchedRecord['year_level']) {
            $updateData['year_level'] = $matchedRecord['year_level'];
        }
        
        if (isset($matchedRecord['balance']) && $matchedRecord['balance']) {
            $updateData['balance'] = $matchedRecord['balance'];
        }
        
        if (isset($matchedRecord['statuscode'])) {
            $updateData['clearance_statuscode'] = $matchedRecord['statuscode'];
        }
        
        // Update user with legacy data
        $user->update($updateData);
        
        Log::info("LoginRequestV2: Successfully stored legacy account data", [
            'user_id' => $user->id,
            'legacy_account_id' => $matchedRecord['account_id'],
            'student_number_legacy' => $matchedRecord['student_number'] ?? null,
            'degree_code' => $matchedRecord['degree_code'] ?? null,
            'year_level' => $matchedRecord['year_level'] ?? null,
            'full_record' => $matchedRecord
        ]);
    }

    /**
     * Fetch clearance data for a new user (before user creation)
     * Returns clearance record or null
     */
    private function fetchClearanceDataForNewUser(LegacyPortalClient $legacy, array $legacySession, string $studentNumber): ?array
    {
        try {
            // Try to fetch by student number first (most reliable)
            // We don't have a last name yet, so we'll fetch and search by student number
            
            // Option 1: Try common last names or fetch all recent students
            // For now, we'll use a different approach - fetch the student's home page
            // which usually contains their name
            
            Log::info("LoginRequestV2: Attempting to fetch student name from legacy home page", [
                'student_number' => $studentNumber
            ]);
            
            // Fetch home page to get student name
            $homeHtml = $legacy->fetchHomeHtml($legacySession);
            $studentName = $legacy->extractStudentName($homeHtml);
            
            if (!$studentName || !isset($studentName['last_name'])) {
                Log::warning("LoginRequestV2: Could not extract student name from home page", [
                    'student_number' => $studentNumber
                ]);
                return null;
            }
            
            Log::info("LoginRequestV2: Extracted student name from home page", [
                'student_number' => $studentNumber,
                'last_name' => $studentName['last_name']
            ]);
            
            // Now fetch clearance data by last name
            $clearanceData = $legacy->fetchClearanceByKeyword($legacySession, $studentName['last_name']);
            
            if (!is_array($clearanceData) || empty($clearanceData)) {
                Log::warning("LoginRequestV2: No clearance data returned", [
                    'last_name' => $studentName['last_name']
                ]);
                return null;
            }
            
            // Find matching record by student number
            foreach ($clearanceData as $record) {
                if (isset($record['student_number']) && $record['student_number'] == $studentNumber) {
                    Log::info("LoginRequestV2: Found matching clearance record", [
                        'student_number' => $studentNumber,
                        'account_id' => $record['account_id'] ?? 'N/A'
                    ]);
                    return $record;
                }
            }
            
            // If only one record and matches the last name, use it
            if (count($clearanceData) === 1) {
                Log::info("LoginRequestV2: Using single clearance record", [
                    'student_number' => $studentNumber
                ]);
                return $clearanceData[0];
            }
            
            Log::warning("LoginRequestV2: No matching clearance record found", [
                'student_number' => $studentNumber,
                'records_count' => count($clearanceData)
            ]);
            
            return null;
            
        } catch (\Throwable $e) {
            Log::error("LoginRequestV2: Failed to fetch clearance data for new user", [
                'student_number' => $studentNumber,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
