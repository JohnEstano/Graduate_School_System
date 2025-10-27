<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LegacyPortalClient;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ComprehensiveExamEligibilityController extends Controller
{
    public function __construct(
        protected LegacyPortalClient $legacyClient
    ) {}

    /**
     * Check if exam window is open
     */
    public function checkExamStatus(Request $request): JsonResponse
    {
        try {
            $examWindowOpen = SystemSetting::get('exam_window_open', true);
            
            return response()->json([
                'open' => $examWindowOpen,
                'isOpen' => $examWindowOpen,
                'message' => $examWindowOpen 
                    ? 'Comprehensive exam applications are currently open' 
                    : 'Comprehensive exam applications are currently closed'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to check exam window status', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'open' => true, // Fail open by default
                'isOpen' => true,
                'message' => 'Unable to verify exam window status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check comprehensive exam eligibility
     */
    public function checkEligibility(Request $request): JsonResponse
    {
        // Add debug logging to confirm API is being called
        Log::info('=== COMPREHENSIVE EXAM ELIGIBILITY API CALLED ===', [
            'timestamp' => now(),
            'user_agent' => $request->header('User-Agent'),
            'request_headers' => $request->headers->all()
        ]);

        $user = Auth::user();
        
        if (!$user) {
            Log::warning('Unauthorized access to eligibility API');
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        Log::info('Eligibility check started', ['user_id' => $user->id, 'user_email' => $user->email]);

        try {
            // Get legacy session
            $legacySession = Cache::get('legacy_session_' . $user->id);
            
            Log::info('Legacy session check', [
                'user_id' => $user->id,
                'session_exists' => !empty($legacySession),
                'session_keys' => $legacySession ? array_keys($legacySession) : []
            ]);
            
            if (!$legacySession) {
                Log::warning('No legacy session found for user', ['user_id' => $user->id]);
                return response()->json([
                    'eligible' => false,
                    'requirements' => [
                        [
                            'name' => 'Complete grades (registrar verified)',
                            'completed' => null,
                            'description' => 'Cannot verify - no legacy session'
                        ],
                        [
                            'name' => 'Complete documents submitted',
                            'completed' => null,
                            'description' => 'Cannot verify - no legacy session'
                        ],
                        [
                            'name' => 'No outstanding tuition balance',
                            'completed' => null,
                            'description' => 'Cannot verify - no legacy session'
                        ]
                    ],
                    'error' => 'Legacy session not available'
                ]);
            }

            // Check if data scraping is needed (but don't wait for it)
            $this->triggerDataScrapingIfNeeded($legacySession, $user);

            // Log if cached grade check exists
            $cacheKey = "grades_completion_check_{$user->id}";
            $hasCachedGradeCheck = Cache::has($cacheKey);
            Log::info('Grade check cache status', [
                'user_id' => $user->id,
                'cached' => $hasCachedGradeCheck,
                'cache_key' => $cacheKey
            ]);

            // Check all three requirements (database-first, then fallback to legacy API)
            $gradesComplete = $this->checkGradesCompletionFromDb($user) ?? $this->checkGradesCompletion($legacySession);
            $documentsComplete = $this->checkClearanceStatusFromDb($user) ?? $this->checkClearanceStatus($legacySession);
            $noOutstandingBalance = $this->checkTuitionBalance($user);
            
            Log::info('=== ELIGIBILITY CHECK RESULT ===', [
                'user_id' => $user->id,
                'gradesComplete' => $gradesComplete,
                'gradesComplete_type' => gettype($gradesComplete),
                'documentsComplete' => $documentsComplete,
                'documentsComplete_type' => gettype($documentsComplete),
                'noOutstandingBalance' => $noOutstandingBalance,
                'noOutstandingBalance_type' => gettype($noOutstandingBalance),
                'clearance_statuscode' => $user->clearance_statuscode,
                'balance' => $user->balance
            ]);
            
            return response()->json([
                'eligible' => $gradesComplete && $documentsComplete && $noOutstandingBalance,
                'requirements' => [
                    [
                        'name' => 'Complete grades (registrar verified)',
                        'completed' => $gradesComplete,
                        'description' => 'All academic records must show completed grades (no grade "40")'
                    ],
                    [
                        'name' => 'Complete documents submitted',
                        'completed' => $documentsComplete,
                        'description' => 'All clearance requirements must be satisfied (except tuition)'
                    ],
                    [
                        'name' => 'No outstanding tuition balance',
                        'completed' => $noOutstandingBalance,
                        'description' => 'Cashier clearance must show "Full Payment" as cleared'
                    ]
                ],
                'debug' => [
                    'legacy_session_available' => true,
                    'user_id' => $user->id,
                    'semester_info' => $this->getSemesterMappingInfo($legacySession),
                    'cached_data_available' => $this->legacyClient->getCachedScrapedData($user->id) !== null
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to check comprehensive exam eligibility', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'eligible' => false,
                'requirements' => [
                    [
                        'name' => 'Complete grades (registrar verified)',
                        'completed' => null,
                        'description' => 'Error checking status'
                    ],
                    [
                        'name' => 'Complete documents submitted',
                        'completed' => null,
                        'description' => 'Error checking status'
                    ],
                    [
                        'name' => 'No outstanding tuition balance',
                        'completed' => null,
                        'description' => 'Error checking status'
                    ]
                ],
                'error' => 'Failed to check eligibility: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Check grades completion from database (ALL semesters)
     * Returns null if no database data exists, true/false if data found
     * Checks for: incomplete grades (rating = 40 or empty) AND failed grades (rating < 74)
     */
    private function checkGradesCompletionFromDb($user): ?bool
    {
        try {
            // Get ALL academic records for the user from database
            $records = \App\Models\LegacyAcademicRecord::where('user_id', $user->id)
                ->get();
                
            if ($records->isEmpty()) {
                Log::info('No academic records in database for user', [
                    'user_id' => $user->id
                ]);
                return null; // No database data, fallback to API
            }
            
            // Check ALL records across all semesters for incomplete or failed grades
            $incompleteGrades = [];
            $failedGrades = [];
            
            foreach ($records as $record) {
                // Check for incomplete grade (rating = 40, 0, or empty/null)
                // NOTE: Legacy system returns 0 for incomplete grades that show as "40" in the UI
                if ($record->rating == 40 || $record->rating == '40' || 
                    $record->rating == 0 || $record->rating == '0' ||
                    $record->rating === '' || $record->rating === null || 
                    $record->rating === 'INC') {
                    $incompleteGrades[] = [
                        'semester_id' => $record->semester_id,
                        'code' => $record->course_code,
                        'title' => $record->course_title,
                        'rating' => $record->rating,
                        'reason' => 'Incomplete grade (rating = 40, 0, or empty)'
                    ];
                }
                
                // Check for failed grade (numeric rating < 75)
                // UIC passing grade is 75, so anything below is considered failing
                // Only check numeric ratings, skip non-numeric (like 'P', 'F', etc.)
                if (is_numeric($record->rating)) {
                    $numericRating = (float)$record->rating;
                    // Exclude 0 and 40 (incomplete grades)
                    if ($numericRating > 0 && $numericRating < 75 && $numericRating != 40 && $numericRating != 0) {
                        $failedGrades[] = [
                            'semester_id' => $record->semester_id,
                            'code' => $record->course_code,
                            'title' => $record->course_title,
                            'rating' => $record->rating,
                            'reason' => 'Failed grade (rating < 74)'
                        ];
                    }
                }
            }
            
            Log::info('Checked grades completion from database', [
                'user_id' => $user->id,
                'total_records' => $records->count(),
                'incomplete_count' => count($incompleteGrades),
                'failed_count' => count($failedGrades),
                'incomplete_grades' => $incompleteGrades,
                'failed_grades' => $failedGrades,
                'all_complete_and_passing' => empty($incompleteGrades) && empty($failedGrades)
            ]);
            
            // Return true only if NO incomplete grades AND NO failed grades
            return empty($incompleteGrades) && empty($failedGrades);
            
        } catch (\Exception $e) {
            Log::error('Failed to check grades from database', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return null; // Fallback to API on error
        }
    }

    /**
     * Check clearance status from database (current semester)
     * Returns null if no database data exists, true/false if data found
     * Checks clearance requirements: statuscode must be 7900 (Cleared)
     * Excludes Cashier "Full Payment" requirement (that's checked separately)
     */
    private function checkClearanceStatusFromDb($user): ?bool
    {
        try {
            // Get current semester ID from database
            $currentSemesterId = $this->getCurrentSemesterIdFromDb($user);
            
            if (!$currentSemesterId) {
                Log::info('No semester data in database for user', ['user_id' => $user->id]);
                return null; // No database data, fallback to API
            }
            
            // Get clearance statuses for current semester from database
            $clearanceStatuses = \App\Models\LegacyClearanceStatus::where('user_id', $user->id)
                ->where('semester_id', $currentSemesterId)
                ->get();
                
            if ($clearanceStatuses->isEmpty()) {
                Log::info('No clearance data in database for current semester', [
                    'user_id' => $user->id,
                    'semester_id' => $currentSemesterId
                ]);
                return null; // No database data, fallback to API
            }
            
            $unclearedRequirements = [];
            
            // Check each clearance area's requirements
            foreach ($clearanceStatuses as $clearance) {
                // Skip Cashier for this check (tuition balance checked separately)
                if ($clearance->area === 'Cashier') {
                    continue;
                }
                
                // Parse requirements JSON
                $requirements = is_string($clearance->requirements) 
                    ? json_decode($clearance->requirements, true) 
                    : $clearance->requirements;
                
                if (!is_array($requirements)) {
                    continue;
                }
                
                // Check each requirement
                foreach ($requirements as $requirement) {
                    // Check if statuscode is not 7900 (Cleared) and not 7850 (Promissory)
                    // Also check default_cleared flag
                    $statuscode = $requirement['statuscode'] ?? null;
                    $defaultCleared = $requirement['default_cleared'] ?? 1;
                    
                    if ($statuscode != 7900 && $statuscode != 7850) {
                        $unclearedRequirements[] = [
                            'area' => $clearance->area,
                            'requirement' => $requirement['remarks'] ?? 'Unknown requirement',
                            'statuscode' => $statuscode,
                            'default_cleared' => $defaultCleared
                        ];
                    }
                }
            }
            
            if (!empty($unclearedRequirements)) {
                Log::info('Found uncleared requirements (from database)', [
                    'user_id' => $user->id,
                    'semester_id' => $currentSemesterId,
                    'uncleared_count' => count($unclearedRequirements),
                    'uncleared_requirements' => $unclearedRequirements
                ]);
                return false;
            }
            
            Log::info('All clearance requirements satisfied (from database)', [
                'user_id' => $user->id,
                'semester_id' => $currentSemesterId,
                'areas_checked' => $clearanceStatuses->count()
            ]);
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('Failed to check clearance from database', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return null; // Fallback to API on error
        }
    }

    /**
     * Check tuition balance from Cashier clearance
     * Returns true if 'Full Payment' is cleared (statuscode = 7900), false otherwise
     */
    private function checkTuitionBalance($user): ?bool
    {
        try {
            // QUICK CHECK: Use clearance data stored on login (from clearance API by keyword)
            // This is faster and more reliable than parsing semester clearance data
            if ($user->clearance_statuscode !== null) {
                // Statuscode meanings:
                // 3300 = Has balance (NOT cleared)
                // 7900 = Cleared (no balance)
                // 7850 = Promissory (accepted as cleared)
                $noBalance = ($user->clearance_statuscode == 7900 || $user->clearance_statuscode == 7850);
                
                Log::info('Quick tuition balance check from user clearance data', [
                    'user_id' => $user->id,
                    'balance' => $user->balance,
                    'statuscode' => $user->clearance_statuscode,
                    'no_outstanding_balance' => $noBalance
                ]);
                
                return $noBalance;
            }
            
            // FALLBACK: Check database clearance status
            Log::info('No quick clearance data available, checking database', [
                'user_id' => $user->id
            ]);
            
            // Get current semester ID from database
            $currentSemesterId = $this->getCurrentSemesterIdFromDb($user);
            
            if (!$currentSemesterId) {
                Log::info('No semester data in database for user', ['user_id' => $user->id]);
                return null; // No database data
            }
            
            // Get Cashier clearance status from database
            $cashierClearance = \App\Models\LegacyClearanceStatus::where('user_id', $user->id)
                ->where('semester_id', $currentSemesterId)
                ->where('area', 'Cashier')
                ->first();
                
            if (!$cashierClearance) {
                Log::info('No Cashier clearance data in database', [
                    'user_id' => $user->id,
                    'semester_id' => $currentSemesterId
                ]);
                return null; // No database data
            }
            
            // Parse requirements JSON to find 'Full Payment'
            $requirements = is_string($cashierClearance->requirements) 
                ? json_decode($cashierClearance->requirements, true) 
                : $cashierClearance->requirements;
            
            if (!is_array($requirements)) {
                Log::warning('Cashier requirements is not an array', [
                    'user_id' => $user->id,
                    'requirements_type' => gettype($cashierClearance->requirements)
                ]);
                return null;
            }
            
            // Find 'Full Payment' requirement
            $fullPaymentCleared = false;
            $fullPaymentStatuscode = null;
            
            foreach ($requirements as $requirement) {
                $remarks = $requirement['remarks'] ?? '';
                
                // Check if this is the 'Full Payment' requirement
                if (stripos($remarks, 'Full Payment') !== false) {
                    $fullPaymentStatuscode = $requirement['statuscode'] ?? null;
                    $defaultCleared = $requirement['default_cleared'] ?? 0;
                    
                    // Cleared if statuscode is 7900 (Cleared) or 7850 (Promissory)
                    $fullPaymentCleared = ($fullPaymentStatuscode == 7900 || $fullPaymentStatuscode == 7850);
                    
                    Log::info('Found Full Payment requirement', [
                        'user_id' => $user->id,
                        'semester_id' => $currentSemesterId,
                        'statuscode' => $fullPaymentStatuscode,
                        'default_cleared' => $defaultCleared,
                        'is_cleared' => $fullPaymentCleared
                    ]);
                    
                    break;
                }
            }
            
            if ($fullPaymentStatuscode === null) {
                Log::warning('Full Payment requirement not found in Cashier clearance', [
                    'user_id' => $user->id,
                    'semester_id' => $currentSemesterId,
                    'requirements_count' => count($requirements)
                ]);
                return null;
            }
            
            Log::info('Checked tuition balance from database', [
                'user_id' => $user->id,
                'semester_id' => $currentSemesterId,
                'full_payment_statuscode' => $fullPaymentStatuscode,
                'no_outstanding_balance' => $fullPaymentCleared
            ]);
            
            return $fullPaymentCleared;
            
        } catch (\Exception $e) {
            Log::error('Failed to check tuition balance from database', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get current semester ID from database (uses most recent semester with data)
     */
    private function getCurrentSemesterIdFromDb($user): ?int
    {
        try {
            // Try to get the latest semester from academic records
            $latestRecord = \App\Models\LegacyAcademicRecord::where('user_id', $user->id)
                ->orderBy('semester_id', 'desc')
                ->first();
                
            if ($latestRecord) {
                return $latestRecord->semester_id;
            }
            
            // Fallback: try clearance data
            $latestClearance = \App\Models\LegacyClearanceStatus::where('user_id', $user->id)
                ->orderBy('semester_id', 'desc')
                ->first();
                
            if ($latestClearance) {
                return $latestClearance->semester_id;
            }
            
            return null; // No data in database
            
        } catch (\Exception $e) {
            Log::error('Failed to get current semester ID from database', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Check clearance status from legacy system
     * Checks statuscode for each requirement (must be 7900 or 7850)
     * Excludes Cashier area (checked separately in tuition balance)
     */
    private function checkClearanceStatus(array $legacySession): bool
    {
        try {
            // Dynamically get the current semester ID from academic records
            $currentSemesterId = $this->getCurrentSemesterId($legacySession);
            
            if (!$currentSemesterId) {
                Log::warning('No current semester ID found, falling back to default');
                $currentSemesterId = 500; // Fallback semester ID
            }
            
            Log::info('Using semester ID for clearance check', [
                'semester_id' => $currentSemesterId
            ]);
            
            // Fetch clearance data from legacy system
            $clearanceData = $this->legacyClient->fetchClearanceData($legacySession, $currentSemesterId);
            
            if (!$clearanceData || !is_array($clearanceData)) {
                Log::warning('No clearance data found for current semester', [
                    'semester_id' => $currentSemesterId
                ]);
                return false; // If no data, assume not complete
            }
            
            Log::info('Clearance data retrieved', [
                'semester_id' => $currentSemesterId,
                'clearance_areas' => count($clearanceData)
            ]);
            
            $unclearedRequirements = [];
            
            // Check if all requirements are cleared (statuscode = 7900 or 7850)
            foreach ($clearanceData as $clearanceItem) {
                $areaLabel = $clearanceItem['label'] ?? 'Unknown';
                
                // Skip Cashier for this check (tuition balance checked separately)
                if ($areaLabel === 'Cashier') {
                    continue;
                }
                
                if (isset($clearanceItem['requirements']) && is_array($clearanceItem['requirements'])) {
                    foreach ($clearanceItem['requirements'] as $requirement) {
                        $statuscode = $requirement['statuscode'] ?? null;
                        $remarks = $requirement['remarks'] ?? 'Unknown requirement';
                        
                        // Check if statuscode is NOT 7900 (Cleared) and NOT 7850 (Promissory)
                        if ($statuscode != 7900 && $statuscode != 7850) {
                            $unclearedRequirements[] = [
                                'area' => $areaLabel,
                                'requirement' => $remarks,
                                'statuscode' => $statuscode,
                                'default_cleared' => $requirement['default_cleared'] ?? 0
                            ];
                            
                            Log::info('Found uncleared requirement', [
                                'semester_id' => $currentSemesterId,
                                'clearance_area_id' => $clearanceItem['clearance_area_id'] ?? 'unknown',
                                'label' => $areaLabel,
                                'requirement' => $remarks,
                                'statuscode' => $statuscode
                            ]);
                        }
                    }
                }
            }
            
            if (!empty($unclearedRequirements)) {
                Log::info('Found uncleared requirements', [
                    'semester_id' => $currentSemesterId,
                    'uncleared_count' => count($unclearedRequirements),
                    'uncleared_requirements' => $unclearedRequirements
                ]);
                return false;
            }
            
            Log::info('All clearance requirements satisfied', [
                'semester_id' => $currentSemesterId
            ]);
            
            return true; // All requirements are cleared
            
        } catch (\Exception $e) {
            Log::error('Failed to check clearance status', [
                'error' => $e->getMessage()
            ]);
            return false; // Assume not complete if check fails
        }
    }

    /**
     * Check grades completion from academic records (API fallback)
     * Checks for: incomplete grades (rating = 40 or empty) AND failed grades (rating < 74)
     */
    private function checkGradesCompletion(array $legacySession): bool
    {
        // Cache the expensive grade check for 10 minutes per user
        $userId = Auth::id();
        $cacheKey = "grades_completion_check_{$userId}";
        
        return Cache::remember($cacheKey, 600, function () use ($legacySession) {
            Log::info('Performing fresh comprehensive grade check (not cached)', [
                'user_id' => Auth::id(),
                'cache_duration' => '10 minutes'
            ]);
            
            try {
                // Fetch academic records the same way as the academic records page
                $academicHtml = $this->legacyClient->fetchAcademicRecordsHtml($legacySession);
                $parsed = $this->legacyClient->parseAcademicRecords($academicHtml);
                $init = $this->legacyClient->extractAcademicInitParams($academicHtml);
                
                if (!$init) {
                    Log::warning('Academic init params not found');
                    return false;
                }
                
                $allIncompleteGrades = [];
                $allFailedGrades = [];
                $totalSemestersChecked = 0;
                $startTime = microtime(true);
                
                // Check ALL available semesters, not just the current one
                $semestersToCheck = $parsed['semesters'] ?? [];
                
                Log::info('Starting OPTIMIZED comprehensive grade check', [
                    'available_semesters' => count($semestersToCheck),
                    'init_semester' => $init['semester_id'],
                    'strategy' => 'Check recent 6 semesters first, expand if issues found'
                ]);
            
            // OPTIMIZATION 1: Check semesters in reverse order (newest first)
            // This way we find recent incomplete/failed grades faster
            $semestersToCheck = array_reverse($semestersToCheck);
            
            // OPTIMIZATION 2: Smart semester limiting
            // For comprehensive exam eligibility, recent grades (last 6 semesters = ~2 years)
            // are most relevant. Only check last 6 semesters unless issues are found.
            // This reduces check time from 70s to ~12s for most students!
            $maxSemestersToCheck = 6;  // ~2 years of recent coursework
            $foundIssuesEarly = false;
            
            foreach ($semestersToCheck as $index => $semester) {
                $semesterId = $semester['id'];
                $totalSemestersChecked++;
                
                // OPTIMIZATION 3: After checking first 6 semesters (~2 years), if all are passing,
                // skip the rest (old semesters unlikely to affect comprehensive exam eligibility)
                if ($index >= $maxSemestersToCheck && !$foundIssuesEarly) {
                    Log::info('✓ Recent 6 semesters clean - skipping older semesters', [
                        'checked' => $totalSemestersChecked - 1,
                        'skipped' => count($semestersToCheck) - ($totalSemestersChecked - 1),
                        'time_saved' => round((count($semestersToCheck) - ($totalSemestersChecked - 1)) * 2, 0) . ' seconds'
                    ]);
                    break;
                }
                
                try {
                    // Get academic records for this specific semester
                    $rawJson = $this->legacyClient->fetchAcademicRecordJson(
                        $legacySession,
                        $init['student_id'],
                        $init['educational_level_id'],
                        $semesterId
                    );
                    
                    // Normalize the records
                    $normalized = array_map(fn($r) => $this->legacyClient->normalizeAcademicRecordRow($r), $rawJson);
                    
                    // Check for incomplete and failed grades in this semester
                    foreach ($normalized as $record) {
                        $rating = $record['rating_show'] ?? '';
                        
                        // Check if rating is "40", "0" (incomplete) or empty
                        // NOTE: Legacy system returns 0 for incomplete grades that show as "40" in the UI
                        if ($rating === '40' || $rating === 40 || $rating === '0' || $rating === 0 || 
                            $rating === '' || $rating === null || $rating === 'INC') {
                            $incompleteRecord = [
                                'semester_id' => $semesterId,
                                'semester_label' => $semester['label'] ?? 'unknown',
                                'code' => $record['code'] ?? 'unknown',
                                'title' => $record['title'] ?? 'unknown',
                                'rating' => $rating,
                                'reason' => 'Incomplete grade (rating = 40, 0, or empty)'
                            ];
                            $allIncompleteGrades[] = $incompleteRecord;
                            $foundIssuesEarly = true; // Mark that we found issues
                        }
                        // Check for failed grade (numeric rating < 75)
                        // UIC passing grade is 75, so anything below is considered failing
                        else if (is_numeric($rating)) {
                            $numericRating = (float)$rating;
                            // Only flag as failed if rating is > 0 and < 75 (excluding 0 and 40 which are incomplete)
                            if ($numericRating > 0 && $numericRating < 75 && $numericRating != 40 && $numericRating != 0) {
                                $failedRecord = [
                                    'semester_id' => $semesterId,
                                    'semester_label' => $semester['label'] ?? 'unknown',
                                    'code' => $record['code'] ?? 'unknown',
                                    'title' => $record['title'] ?? 'unknown',
                                    'rating' => $rating,
                                    'reason' => 'Failed grade (rating < 75, passing is 75+)'
                                ];
                                $allFailedGrades[] = $failedRecord;
                                $foundIssuesEarly = true; // Mark that we found issues
                            }
                        }
                    }
                    
                } catch (\Exception $e) {
                    Log::error('Error checking semester', [
                        'semester_id' => $semesterId,
                        'error' => $e->getMessage()
                    ]);
                    // Continue checking other semesters
                }
                
                // OPTIMIZATION: Log progress every 5 semesters instead of every semester
                if ($totalSemestersChecked % 5 === 0) {
                    $elapsed = round(microtime(true) - $startTime, 2);
                    Log::info("Progress: {$totalSemestersChecked}/" . count($semestersToCheck) . " semesters ({$elapsed}s)");
                }
            }
            
            $totalTime = round(microtime(true) - $startTime, 2);
            Log::info('Comprehensive grade check completed', [
                'semesters_checked' => $totalSemestersChecked,
                'incomplete_grades_found' => count($allIncompleteGrades),
                'failed_grades_found' => count($allFailedGrades),
                'total_time_seconds' => $totalTime,
                'avg_time_per_semester' => round($totalTime / max($totalSemestersChecked, 1), 2)
            ]);
            
            // If ANY semester has incomplete OR failed grades, return false
            if (!empty($allIncompleteGrades) || !empty($allFailedGrades)) {
                return false;
            }
            
            return true; // All grades are complete and passing across all semesters
            
            } catch (\Exception $e) {
                Log::error('Failed to check grades completion', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                return false; // Assume not complete if check fails
            }
        }); // End Cache::remember
    }

    /**
     * Get the current semester ID from academic records page
     */
    private function getCurrentSemesterId(array $legacySession): ?string
    {
        try {
            Log::info('=== GETTING CURRENT SEMESTER ID ===');
            
            // Fetch and parse academic records to get semester information
            $academicHtml = $this->legacyClient->fetchAcademicRecordsHtml($legacySession);
            $parsed = $this->legacyClient->parseAcademicRecords($academicHtml);
            
            // Get the current semester ID
            $currentSemesterId = $parsed['current_semester_id'] ?? null;
            
            // Get all available semesters for logging
            $semesters = $parsed['semesters'] ?? [];
            
            Log::info('Semester information extracted', [
                'current_semester_id' => $currentSemesterId,
                'total_semesters_available' => count($semesters),
                'semesters' => array_map(function($sem) {
                    return [
                        'id' => $sem['id'],
                        'label' => $sem['label'],
                        'selected' => $sem['selected']
                    ];
                }, $semesters)
            ]);
            
            // If no current semester found, try to get the first available one
            if (!$currentSemesterId && !empty($semesters)) {
                $firstSemester = $semesters[0];
                $currentSemesterId = $firstSemester['id'];
                
                Log::info('No current semester found, using first available', [
                    'fallback_semester_id' => $currentSemesterId,
                    'fallback_label' => $firstSemester['label']
                ]);
            }
            
            // If still no semester ID, try to find any selected semester
            if (!$currentSemesterId) {
                foreach ($semesters as $semester) {
                    if ($semester['selected']) {
                        $currentSemesterId = $semester['id'];
                        Log::info('Found selected semester', [
                            'selected_semester_id' => $currentSemesterId,
                            'selected_label' => $semester['label']
                        ]);
                        break;
                    }
                }
            }
            
            if ($currentSemesterId) {
                Log::info('Successfully determined current semester ID', [
                    'semester_id' => $currentSemesterId
                ]);
            } else {
                Log::warning('Unable to determine current semester ID from academic records');
            }
            
            return $currentSemesterId;
            
        } catch (\Exception $e) {
            Log::error('Failed to get current semester ID', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Get comprehensive semester mapping information for debugging
     */
    private function getSemesterMappingInfo(array $legacySession): array
    {
        try {
            // Fetch and parse academic records to get semester information
            $academicHtml = $this->legacyClient->fetchAcademicRecordsHtml($legacySession);
            $parsed = $this->legacyClient->parseAcademicRecords($academicHtml);
            
            $semesters = $parsed['semesters'] ?? [];
            $currentSemesterId = $parsed['current_semester_id'] ?? null;
            
            return [
                'current_semester_id' => $currentSemesterId,
                'total_semesters' => count($semesters),
                'available_semesters' => array_map(function($sem) {
                    return [
                        'id' => $sem['id'],
                        'label' => $sem['label'],
                        'selected' => $sem['selected'],
                        'is_current' => $sem['selected'] // Usually the selected one is current
                    ];
                }, $semesters),
                'semester_id_pattern' => $this->analyzeSemesterIdPattern($semesters)
            ];
            
        } catch (\Exception $e) {
            return [
                'error' => 'Failed to get semester mapping info: ' . $e->getMessage(),
                'available_semesters' => [],
                'current_semester_id' => null
            ];
        }
    }

    /**
     * Analyze the pattern of semester IDs to help understand the numbering system
     */
    private function analyzeSemesterIdPattern(array $semesters): array
    {
        if (empty($semesters)) {
            return ['pattern' => 'No semesters available'];
        }
        
        $ids = array_map(function($sem) {
            return (int)$sem['id'];
        }, $semesters);
        
        sort($ids);
        
        $pattern = [
            'lowest_id' => min($ids),
            'highest_id' => max($ids),
            'total_count' => count($ids),
            'sample_ids' => array_slice($ids, 0, 5), // First 5 IDs as sample
            'id_gaps' => []
        ];
        
        // Check for gaps in ID sequence
        for ($i = 1; $i < count($ids); $i++) {
            $gap = $ids[$i] - $ids[$i-1];
            if ($gap > 1) {
                $pattern['id_gaps'][] = [
                    'from' => $ids[$i-1],
                    'to' => $ids[$i],
                    'gap_size' => $gap
                ];
            }
        }
        
        return $pattern;
    }

    /**
     * Manual data scraping endpoint for testing and debugging
     */
    public function manualDataScraping(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            // Get legacy session
            $legacySession = Cache::get('legacy_session_' . $user->id);
            
            if (!$legacySession) {
                return response()->json([
                    'success' => false,
                    'error' => 'No legacy session found. Please log into the legacy system first.'
                ]);
            }

            Log::info('=== MANUAL DATA SCRAPING TRIGGERED ===', [
                'user_id' => $user->id,
                'triggered_by' => 'manual_request'
            ]);

            // Force fresh data scraping (ignore cache)
            $scrapedData = $this->legacyClient->performLoginDataScraping(
                $legacySession,
                $user->school_id ?? null
            );

            // Cache the results
            if ($scrapedData['success']) {
                $this->legacyClient->cacheScrapedData($user->id, $scrapedData);
            }

            // Return comprehensive results
            return response()->json([
                'success' => $scrapedData['success'],
                'timestamp' => $scrapedData['timestamp'],
                'user_id' => $user->id,
                'school_id' => $user->school_id,
                'summary' => [
                    'semesters_found' => count($scrapedData['semesters'] ?? []),
                    'clearance_semesters' => count($scrapedData['clearance_data'] ?? []),
                    'grade_semesters' => count($scrapedData['all_semester_grades'] ?? []),
                    'student_records' => count($scrapedData['student_info'] ?? []),
                    'errors_count' => count($scrapedData['errors'] ?? [])
                ],
                'detailed_data' => [
                    'semesters' => $scrapedData['semesters'] ?? [],
                    'current_semester_id' => $scrapedData['current_semester_id'],
                    'student_info' => $scrapedData['student_info'] ?? [],
                    'clearance_summary' => $this->summarizeClearanceData($scrapedData['clearance_data'] ?? []),
                    'grades_summary' => $this->summarizeGradesData($scrapedData['all_semester_grades'] ?? []),
                ],
                'errors' => $scrapedData['errors'] ?? [],
                'raw_data' => $request->input('include_raw') ? $scrapedData : null
            ]);

        } catch (\Exception $e) {
            Log::error('Manual data scraping failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Data scraping failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Summarize clearance data for easy viewing
     */
    private function summarizeClearanceData(array $clearanceData): array
    {
        $summary = [];
        
        foreach ($clearanceData as $semesterId => $semesterData) {
            $clearanceAreas = $semesterData['data'] ?? [];
            $summary[$semesterId] = [
                'semester_id' => $semesterId,
                'semester_label' => $semesterData['semester_label'] ?? 'Unknown',
                'total_areas' => count($clearanceAreas),
                'areas' => []
            ];
            
            foreach ($clearanceAreas as $area) {
                $requirements = $area['requirements'] ?? [];
                $totalReqs = count($requirements);
                $clearedReqs = count(array_filter($requirements, fn($req) => ($req['default_cleared'] ?? 0) == 1));
                
                $summary[$semesterId]['areas'][] = [
                    'label' => $area['label'] ?? 'Unknown Area',
                    'clearance_area_id' => $area['clearance_area_id'] ?? null,
                    'total_requirements' => $totalReqs,
                    'cleared_requirements' => $clearedReqs,
                    'completion_rate' => $totalReqs > 0 ? round(($clearedReqs / $totalReqs) * 100, 2) : 100,
                    'all_cleared' => $clearedReqs === $totalReqs
                ];
            }
        }
        
        return $summary;
    }

    /**
     * Summarize grades data for easy viewing
     */
    private function summarizeGradesData(array $gradesData): array
    {
        $summary = [];
        
        foreach ($gradesData as $semesterId => $semesterData) {
            $grades = $semesterData['grades'] ?? [];
            $incompleteGrades = array_filter($grades, function($grade) {
                $rating = $grade['rating_show'] ?? '';
                return $rating === '40' || $rating === 40 || $rating === '' || $rating === null;
            });
            
            $summary[$semesterId] = [
                'semester_id' => $semesterId,
                'semester_label' => $semesterData['semester_label'] ?? 'Unknown',
                'total_subjects' => count($grades),
                'incomplete_subjects' => count($incompleteGrades),
                'completion_rate' => count($grades) > 0 ? round(((count($grades) - count($incompleteGrades)) / count($grades)) * 100, 2) : 100,
                'all_complete' => count($incompleteGrades) === 0,
                'incomplete_details' => array_map(function($grade) {
                    return [
                        'code' => $grade['code'] ?? 'Unknown',
                        'title' => $grade['title'] ?? 'Unknown',
                        'rating' => $grade['rating_show'] ?? 'No grade'
                    ];
                }, $incompleteGrades)
            ];
        }
        
        return $summary;
    }

    /**
     * Perform automatic data scraping when user accesses the eligibility API
     */
    /**
     * Trigger data scraping in background if needed (non-blocking)
     * Only scrapes if data is old or missing
     */
    private function triggerDataScrapingIfNeeded(array $legacySession, $user): void
    {
        try {
            // Check if we have recent cached data (within last hour)
            $cachedData = $this->legacyClient->getCachedScrapedData($user->id);
            
            if ($cachedData && isset($cachedData['timestamp'])) {
                $cacheAge = now()->diffInMinutes($cachedData['timestamp']);
                if ($cacheAge < 60) { // Data is less than 1 hour old
                    Log::info('Using cached scraped data', [
                        'user_id' => $user->id,
                        'cache_age_minutes' => $cacheAge
                    ]);
                    return; // Use cached data, no scraping needed
                }
            }

            // Data is old or missing - trigger scraping in background
            // DO NOT wait for it to complete
            Log::info('Data scraping needed - will use database/API fallback for now', [
                'user_id' => $user->id,
                'school_id' => $user->school_id ?? 'not_available'
            ]);

            // Note: Actual background scraping should be triggered via queue/job
            // For now, we'll skip the blocking scrape and rely on database data
            // or direct API calls in the check methods
            
        } catch (\Exception $e) {
            Log::error('Failed to check scraping status', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            // Don't throw - continue with normal flow
        }
    }

    /**
     * Perform comprehensive data scraping (BLOCKING - should only be called from background jobs)
     */
    private function performAutomaticDataScraping(array $legacySession, $user): void
    {
        try {
            Log::info('Performing comprehensive data scraping for user', [
                'user_id' => $user->id,
                'school_id' => $user->school_id ?? 'not_available'
            ]);

            // Perform comprehensive data scraping
            $scrapedData = $this->legacyClient->performLoginDataScraping(
                $legacySession, 
                $user->school_id ?? null
            );

            // Cache the scraped data
            if ($scrapedData['success']) {
                $this->legacyClient->cacheScrapedData($user->id, $scrapedData);
                
                Log::info('Comprehensive data scraping completed successfully', [
                    'user_id' => $user->id,
                    'semesters_scraped' => count($scrapedData['semesters'] ?? []),
                    'clearance_areas_scraped' => count($scrapedData['clearance_data'] ?? []),
                    'errors' => count($scrapedData['errors'] ?? [])
                ]);
            } else {
                Log::warning('Comprehensive data scraping completed with errors', [
                    'user_id' => $user->id,
                    'errors' => $scrapedData['errors'] ?? []
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to perform comprehensive data scraping', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            // Don't throw - continue with normal flow
        }
    }
}