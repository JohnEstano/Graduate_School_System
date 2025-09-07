<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Services\LegacyPortalClient;

class AcademicRecordController extends Controller
{
    public function index(Request $request, LegacyPortalClient $legacy)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $session = Cache::get('legacy_session_'.$user->id);
        if (!$session) {
            return response()->json(['error' => 'Legacy session missing. Re-login required.'], 440);
        }

        $semesterIdOverride = $request->query('semester_id');

        try {
            // Fetch base HTML to get init parameters + semester list
            $html = $legacy->fetchAcademicRecordsHtml($session);
            $parsed = $legacy->parseAcademicRecords($html);
            $init = $legacy->extractAcademicInitParams($html);
            if (!$init) {
                return response()->json(['error' => 'Init params not found'], 500);
            }
            $semesterId = $semesterIdOverride ?: $init['semester_id'];
            $rawJson = $legacy->fetchAcademicRecordJson(
                $session,
                $init['student_id'],
                $init['educational_level_id'],
                $semesterId
            );
            $normalized = array_map(fn($r) => $legacy->normalizeAcademicRecordRow($r), $rawJson);
            // Attempt derive GWA if any row exposes general_weighted_average
            $gwa = null;
            foreach ($rawJson as $r) {
                if (!empty($r['general_weighted_average'])) { $gwa = $r['general_weighted_average']; break; }
            }
            $payload = [
                'student' => $parsed['student'],
                'semesters' => $parsed['semesters'],
                'current_semester_id' => $semesterId,
                'records' => $normalized,
                'gwa' => $gwa ?? $parsed['gwa'],
            ];
            return response()->json(['data' => $payload]);
        } catch (\Throwable $e) {
            Log::warning('Academic record fetch failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            return response()->json(['error' => 'Unable to fetch academic records'], 502);
        }
    }
}
