<?php

namespace App\Helpers;

class ProgramLevel
{
    /**
     * Get the program level ("Masteral", "Doctorate", or "Bachelors") based on the program name or code.
     * 
     * FOR TESTING: Map all Bachelor programs to "Masteral" since payment rates only exist for Masteral/Doctorate
     */
    public static function getLevel(?string $program): string
    {
        if (!$program) return 'Masteral';

        $p = strtolower(trim(preg_replace('/\s+/', ' ', $program)));

        // Doctorate keywords and abbreviations - CHECK FIRST
        $doctorateKeywords = [
            'doctor', 'doctorate', 'doctoral', 'phd', 'ph.d', 'ph. d',
            'dba', 'edd', 'ed.d', 'dsc', 'dpm', 'dpa'
        ];

        foreach ($doctorateKeywords as $kw) {
            if (str_contains($p, $kw)) {
                return 'Doctorate';
            }
        }

        // FOR TESTING: Map ALL other programs (including Bachelors) to Masteral
        // This ensures payment rates work since we only have Masteral/Doctorate rates
        return 'Masteral';
    }
}