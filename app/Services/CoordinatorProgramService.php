<?php

namespace App\Services;

class CoordinatorProgramService
{
    /**
     * Coordinator program assignments mapping
     * Key: coordinator email
     * Value: array of full program names
     */
    private static array $coordinatorPrograms = [
        'pacosta@uic.edu.ph' => [
            'Doctor in Business Management',
            'Master in Business Administration (with Thesis and Non-Thesis)',
            'Master in Business Administration for Health Professionals',
        ],
        
        'gscoordinator_maed@uic.edu.ph' => [
            'Doctor of Philosophy in Counseling',
            'Doctor of Philosophy in Physical Education',
            'Doctor of Philosophy in Mathematics',
            'Master of Arts in Education major in Physical Education',
            'Master in Counseling',
            'Master of Arts in Counseling',
        ],
        
        'gscoordinator_pharmacy@uic.edu.ph' => [
            'Doctor of Philosophy in Pharmacy',
            'Master of Science in Pharmacy',
            'Master of Science in Medical Technology',
        ],
        
        'gscoordinator_phd@uic.edu.ph' => [
            'Doctor of Philosophy in Education major in Applied Linguistics',
            'Doctor of Philosophy in Education major in Educational Leadership',
            'Doctor of Philosophy in Education major in Filipino',
            'Master of Arts in Education major in English',
            'Master of Arts in Education major in Filipino',
        ],
        
        'aalontaga@uic.edu.ph' => [
            'Master of Arts in Education major in Music Education',
        ],
        
        'vbadong@uic.edu.ph' => [
            'Master of Arts in Teaching College Chemistry',
            'Master of Arts in Teaching College Physics',
            'Master of Arts in Engineering Education major in Civil Engineering',
            'Master of Arts in Engineering Education major in Electronics and Communications Engineering',
        ],
        
        'gbuelis@uic.edu.ph' => [
            'Master of Science in Medical Technology',
        ],
        
        'hbeltran@uic.edu.ph' => [
            'Doctor in Business Management major in Information Systems',
            'Doctor of Philosophy in Information Technology Integration',
            'Master of Arts in Education major in Information Technology Integration',
            'Master in Information Systems',
            'Master in Information Technology',
        ],
        
        'talderite@uic.edu.ph' => [
            'Master of Arts in Education major in Mathematics',
            'Master of Arts in Education major in Sociology',
            'Master of Arts in Education major in Religious Education',
            'Master of Arts in Education major in Values Education',
            'Master of Arts in Educational Management',
            'Master of Arts in Elementary Education',
        ],
    ];

    /**
     * Get all programs assigned to a specific coordinator by email
     */
    public static function getProgramsByEmail(string $email): array
    {
        return self::$coordinatorPrograms[$email] ?? [];
    }

    /**
     * Get all coordinator emails
     */
    public static function getAllCoordinatorEmails(): array
    {
        return array_keys(self::$coordinatorPrograms);
    }

    /**
     * Get all coordinator-program mappings
     */
    public static function getAllMappings(): array
    {
        return self::$coordinatorPrograms;
    }

    /**
     * Check if an email is a registered coordinator
     */
    public static function isCoordinator(string $email): bool
    {
        return array_key_exists($email, self::$coordinatorPrograms);
    }

    /**
     * Get coordinator for a specific program (returns first match)
     */
    public static function getCoordinatorByProgram(string $programName): ?string
    {
        foreach (self::$coordinatorPrograms as $email => $programs) {
            if (in_array($programName, $programs)) {
                return $email;
            }
        }
        return null;
    }

    /**
     * Search programs by partial name match
     */
    public static function searchPrograms(string $searchTerm): array
    {
        $results = [];
        $searchTerm = strtolower($searchTerm);
        
        foreach (self::$coordinatorPrograms as $email => $programs) {
            foreach ($programs as $program) {
                if (str_contains(strtolower($program), $searchTerm)) {
                    $results[] = [
                        'coordinator_email' => $email,
                        'program_name' => $program,
                    ];
                }
            }
        }
        
        return $results;
    }

    /**
     * Get statistics about coordinator workload
     */
    public static function getCoordinatorStats(): array
    {
        $stats = [];
        foreach (self::$coordinatorPrograms as $email => $programs) {
            $stats[] = [
                'coordinator_email' => $email,
                'program_count' => count($programs),
                'programs' => $programs,
            ];
        }
        
        // Sort by program count (most busy first)
        usort($stats, fn($a, $b) => $b['program_count'] <=> $a['program_count']);
        
        return $stats;
    }

    /**
     * Generate a program code from full program name
     */
    public static function generateProgramCode(string $programName): string
    {
        // Handle specific program patterns
        $patterns = [
            '/Doctor in Business Management/i' => 'DBM',
            '/Doctor of Philosophy in (.+)/i' => 'PhD',
            '/Master in Business Administration/i' => 'MBA',
            '/Master of Arts in Education major in (.+)/i' => 'MAED',
            '/Master of Arts in Teaching College (.+)/i' => 'MAT',
            '/Master of Arts in Engineering Education/i' => 'MAEE',
            '/Master of Science in (.+)/i' => 'MS',
            '/Master in Information (.+)/i' => 'MI',
            '/Master in Counseling/i' => 'MIC',
            '/Master of Arts in Counseling/i' => 'MAC',
            '/Master of Arts in (.+)/i' => 'MA',
        ];

        foreach ($patterns as $pattern => $code) {
            if (preg_match($pattern, $programName)) {
                return $code;
            }
        }

        // Fallback: create acronym from first letters
        $words = explode(' ', $programName);
        $acronym = '';
        foreach ($words as $word) {
            if (strlen($word) > 2 && !in_array(strtolower($word), ['in', 'of', 'and', 'for', 'with', 'major'])) {
                $acronym .= strtoupper(substr($word, 0, 1));
            }
        }
        
        return substr($acronym, 0, 6) ?: 'PROG';
    }

    /**
     * Print all coordinators with their programs in a clean, readable format
     */
    public static function printAllCoordinators(): string
    {
        $output = "=== UIC GRADUATE PROGRAM COORDINATORS ===\n\n";
        
        foreach (self::$coordinatorPrograms as $email => $programs) {
            $output .= "📧 " . strtoupper($email) . "\n";
            $output .= "👥 Program Coordinator\n";
            $output .= "📚 Programs Assigned (" . count($programs) . "):\n";
            
            foreach ($programs as $index => $program) {
                $code = self::generateProgramCode($program);
                $output .= "   " . ($index + 1) . ". [{$code}] {$program}\n";
            }
            
            $output .= "\n" . str_repeat("-", 80) . "\n\n";
        }
        
        $totalCoordinators = count(self::$coordinatorPrograms);
        $totalPrograms = array_sum(array_map('count', self::$coordinatorPrograms));
        
        $output .= "📊 SUMMARY:\n";
        $output .= "   • Total Coordinators: {$totalCoordinators}\n";
        $output .= "   • Total Program Assignments: {$totalPrograms}\n";
        $output .= "   • Average Programs per Coordinator: " . round($totalPrograms / $totalCoordinators, 1) . "\n";
        
        return $output;
    }

    /**
     * Export coordinator data for seeding or other uses
     */
    public static function exportForSeeder(): array
    {
        $exportData = [];
        
        foreach (self::$coordinatorPrograms as $email => $programs) {
            $exportData[] = [
                'email' => $email,
                'role' => 'Coordinator',
                'programs' => implode(', ', $programs),
                'program_count' => count($programs),
            ];
        }
        
        return $exportData;
    }

    /**
     * Get programs grouped by degree level
     */
    public static function getProgramsByDegreeLevel(): array
    {
        $grouped = [
            'Doctoral' => [],
            'Masters' => [],
            'Other' => [],
        ];
        
        foreach (self::$coordinatorPrograms as $email => $programs) {
            foreach ($programs as $program) {
                if (str_contains($program, 'Doctor')) {
                    $grouped['Doctoral'][] = [
                        'program' => $program,
                        'coordinator' => $email,
                    ];
                } elseif (str_contains($program, 'Master')) {
                    $grouped['Masters'][] = [
                        'program' => $program,
                        'coordinator' => $email,
                    ];
                } else {
                    $grouped['Other'][] = [
                        'program' => $program,
                        'coordinator' => $email,
                    ];
                }
            }
        }
        
        return $grouped;
    }
}