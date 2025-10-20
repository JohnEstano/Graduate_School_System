<?php

namespace App\Helpers;

class ProgramLevel
{
    /**
     * Get the program level ("Masteral" or "Doctorate") based on the program name or code.
     */
    public static function getLevel(?string $program): string
    {
        if (!$program) return 'Masteral';

        $p = strtolower(trim(preg_replace('/\s+/', ' ', $program)));

        // Doctorate keywords and abbreviations
        $doctorateKeywords = [
            'phd', 'ph.d', 'doctor', 'doctoral', 'doctorate',
            'edd', 'ed.d',
            'dm', 'd.m', 'dba', 'd.b.a',
        ];

        foreach ($doctorateKeywords as $kw) {
            if (str_contains($p, $kw)) {
                return 'Doctorate';
            }
        }

        // Fallback by leading letter D- vs M-
        if (preg_match('/^(d[.\-\s]|doctor)/', $p)) return 'Doctorate';

        return 'Masteral';
    }
}