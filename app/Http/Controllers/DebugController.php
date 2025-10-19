<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Services\LegacyPortalClient;

class DebugController extends Controller
{
    public function academicRecordsDebug(LegacyPortalClient $legacy)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $session = Cache::get('legacy_session_' . $user->id);
        if (!$session) {
            return response()->json(['error' => 'No legacy session'], 400);
        }

        try {
            // Get academic records the same way as eligibility controller
            $academicHtml = $legacy->fetchAcademicRecordsHtml($session);
            $parsed = $legacy->parseAcademicRecords($academicHtml);
            $init = $legacy->extractAcademicInitParams($academicHtml);
            
            if (!$init) {
                return response()->json(['error' => 'No init params found']);
            }
            
            // Get the actual academic record data (JSON)
            $rawJson = $legacy->fetchAcademicRecordJson(
                $session,
                $init['student_id'],
                $init['educational_level_id'],
                $init['semester_id']
            );
            
            // Normalize the records
            $normalized = array_map(fn($r) => $legacy->normalizeAcademicRecordRow($r), $rawJson);
            
            // Check for grade "40"
            $gradesWithIssues = [];
            foreach ($normalized as $record) {
                $rating = $record['rating_show'] ?? '';
                if ($rating === '40' || $rating === 40 || $rating === '' || $rating === null) {
                    $gradesWithIssues[] = [
                        'code' => $record['code'],
                        'title' => $record['title'],
                        'rating' => $rating,
                        'rating_type' => gettype($rating)
                    ];
                }
            }
            
            return response()->json([
                'init_params' => $init,
                'raw_records_count' => count($rawJson),
                'normalized_records_count' => count($normalized),
                'first_5_raw' => array_slice($rawJson, 0, 5),
                'first_5_normalized' => array_slice($normalized, 0, 5),
                'grades_with_issues' => $gradesWithIssues,
                'all_ratings' => array_map(fn($r) => [
                    'code' => $r['code'],
                    'rating' => $r['rating_show'],
                    'type' => gettype($r['rating_show'])
                ], $normalized)
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}