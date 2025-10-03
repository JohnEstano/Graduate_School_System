<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Handles post-login enrichment of a user's profile using legacy portal data.
 * - Students: name parts, program
 * - Staff   : canonical role, role title, name parts, enrollment stats (if coordinator)
 *
 * All operations are best-effort and swallow exceptions to avoid blocking login.
 */
class StudentProfileEnricher
{
    public function __construct(protected LegacyPortalClient $legacy) {}

    /**
     * Enrich a user given a legacy session array from LegacyPortalClient::login().
     * @param User $user
     * @param array $legacySession ['cookies'=>...,'cookie_header'=>..., 'raw'=>...]
     * @param bool $isStaff Provided from login phase (non-numeric identifier path)
     */
    public function enrich(User $user, array $legacySession, bool $isStaff = false): void
    {
        try {
            $homeHtml = $this->legacy->fetchHomeHtml($legacySession);
        } catch (\Throwable $e) {
            Log::debug('Enrichment: fetchHomeHtml failed: '.$e->getMessage());
            $homeHtml = null;
        }

        // Staff enrichment
        $isCoordinator = false;
        if ($isStaff && $homeHtml) {
            try {
                $roleInfo = $this->legacy->extractStaffRole($homeHtml);
                $nameParts = $this->legacy->extractCoordinatorNameParts($homeHtml) ?: null;
                $employeeId = $this->legacy->extractEmployeeIdFromHome($homeHtml);
                $changes = [];
                if ($roleInfo) {
                    $canonical = $roleInfo['role'];
                    if ($canonical === 'Coordinator') $isCoordinator = true;
                    if ($user->role !== $canonical) {
                        $changes['role'] = $canonical;
                    }
                    // Multi-role pivot addition
                    $user->addRole($canonical);
                    if ($roleInfo['title'] && (!$user->extra_role_title || $user->extra_role_title !== $roleInfo['title'])) {
                        if (Schema::hasColumn('users', 'extra_role_title')) {
                            $changes['extra_role_title'] = $roleInfo['title'];
                        } else {
                            Cache::put('coord_role_title_'.$user->id, $roleInfo['title'], now()->addHours(6));
                        }
                    }
                }
                if ($employeeId && Schema::hasColumn('users', 'employee_id') && (!$user->employee_id || $user->employee_id !== $employeeId)) {
                    $changes['employee_id'] = $employeeId;
                }
                if ($nameParts) {
                    foreach (['first_name','middle_name','last_name'] as $key) {
                        if (($nameParts[$key] ?? null) && $user->$key !== $nameParts[$key]) {
                            $changes[$key] = $nameParts[$key];
                        }
                    }
                }
                if ($changes) { $user->forceFill($changes)->save(); }

                // Attempt to fetch employee profile metadata (department, photo)
                if ($employeeId) {
                    try {
                        $profileHtml = $this->legacy->fetchEmployeeProfileHtml($legacySession, $employeeId);
                        $meta = $this->legacy->parseEmployeeProfileMeta($profileHtml);
                        if ($meta) {
                            $metaChanges = [];
                            foreach ($meta as $k => $v) {
                                if (Schema::hasColumn('users', $k) && (!$user->$k || $user->$k !== $v)) {
                                    $metaChanges[$k] = $v;
                                }
                            }
                            if (Schema::hasColumn('users', 'employee_profile_fetched_at')) {
                                $metaChanges['employee_profile_fetched_at'] = now();
                            }
                            if ($metaChanges) {
                                $user->forceFill($metaChanges)->save();
                            }
                        }
                    } catch (\Throwable $e) {
                        Log::debug('Enrichment: employee profile meta fetch failed: '.$e->getMessage());
                    }
                }
            } catch (\Throwable $e) {
                Log::debug('Enrichment: staff parsing failed: '.$e->getMessage());
            }
        }

        // Student enrichment (run even if staff has student number) for name + program.
        if ($homeHtml && $user->student_number) {
            try {
                $studentName = $this->legacy->extractStudentName($homeHtml);
                $changes = [];
                if ($studentName) {
                    foreach (['first_name','middle_name','last_name'] as $k) {
                        // Only overwrite if empty or different & we trust source
                        if (($studentName[$k] ?? null) && (!$user->$k || $user->$k !== $studentName[$k])) {
                            $changes[$k] = $studentName[$k];
                        }
                    }
                }
                // Program via academic records (only if program empty or stale)
                if (!$user->program) {
                    try {
                        $acadHtml = $this->legacy->fetchAcademicRecordsHtml($legacySession);
                        $parsed = $this->legacy->parseAcademicRecords($acadHtml);
                        $program = $parsed['student']['program'] ?? null;
                        if ($program) {
                            $changes['program'] = $program;
                        }
                    } catch (\Throwable $inner) {
                        Log::debug('Enrichment: academic program fetch failed: '.$inner->getMessage());
                    }
                }
                if ($changes) { $user->forceFill($changes)->save(); }
            } catch (\Throwable $e) {
                Log::debug('Enrichment: student name/program parsing failed: '.$e->getMessage());
            }
        }

        // Coordinator-specific background stats
        if ($isCoordinator) {
            try {
                $statsHtml = $this->legacy->fetchEnrollmentStatisticsHtml($legacySession);
                $stats = $this->legacy->parseEnrollmentStats($statsHtml);
                if ($stats) {
                    Cache::put('coord_enrollment_stats_'.$user->id, $stats, now()->addMinutes(30));
                }
            } catch (\Throwable $e) {
                Log::debug('Enrichment: enrollment stats failed: '.$e->getMessage());
            }
        }
    }
}
