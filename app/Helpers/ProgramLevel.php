<?php

namespace App\Helpers;

class ProgramLevel
{
    /**
     * Get the program level ("Masteral" or "Doctorate") based on the program name.
     */
    public static function getLevel(string $program): string
    {
        // List of doctorate programs
        $doctorate = [
            'Doctor in Business Management',
            'Doctor of Philosophy in Education major in Applied Linguistics',
            'Doctor of Philosophy in Education major in Educational Leadership',
            'Doctor of Philosophy in Education major in Filipino',
            'Doctor of Philosophy in Education major in Mathematics',
            'Doctor of Philosophy in Education major in Counseling',
            'Doctor of Philosophy in Education major in Information Technology Integration',
            'Doctor of Philosophy in Education major in Physical Education',
            'DOCTOR OF PHILOSOPHY IN PHARMACY',
        ];

        // Normalize for case-insensitive and whitespace-insensitive comparison
        $normalized = strtolower(trim(preg_replace('/\s+/', ' ', $program)));

        foreach ($doctorate as $doc) {
            $docNorm = strtolower(trim(preg_replace('/\s+/', ' ', $doc)));
            if ($normalized === $docNorm) {
                return 'Doctorate';
            }
        }

        // Default: try to guess by keywords
        if (stripos($program, 'doctor') !== false || stripos($program, 'philosophy') !== false) {
            return 'Doctorate';
        }
        return 'Masteral';
    }
}