<?php

namespace App\Http\Controllers;

use App\Services\LegacyPortalClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class InstructorClassListController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $session = Cache::get('legacy_session_'.$user->id);
        $payload = ['rows' => [], 'periods' => [], 'selected_period_id' => null, 'short_period_label' => null];
        $error = null;
        if ($session) {
            try {
                /** @var LegacyPortalClient $legacy */
                $legacy = app(LegacyPortalClient::class);
                $periodId = $request->query('period_id');
                if ($periodId) {
                    $html = $legacy->setInstructorClassListPeriod($session, $periodId) ?? $legacy->fetchInstructorClassListHtml($session);
                    // persist updated header
                    Cache::put('legacy_session_'.$user->id, $session, now()->addMinutes(30));
                } else {
                    $html = $legacy->fetchInstructorClassListHtml($session);
                }
                $payload = $legacy->parseInstructorClassList($html);
            } catch (\Throwable $e) {
                $error = 'Failed to fetch class list.';
                Log::debug('Instructor class list fetch failure: '.$e->getMessage());
            }
        } else {
            $error = 'Legacy session missing; please re-login.';
        }
        return response()->json(array_merge($payload, [
            'count' => count($payload['rows'] ?? []),
            'error' => $error,
        ]));
    }

    public function page(Request $request)
    {
        return Inertia::render('faculty/ClassList');
    }
}
