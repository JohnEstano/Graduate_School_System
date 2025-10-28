<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class SuperAdminController extends Controller
{
    /**
     * Update exam window setting
     */
    public function updateExamWindow(Request $request)
    {
        // Verify user is Super Admin (with space)
        if (!Auth::check() || Auth::user()->role !== 'Super Admin') {
            abort(403, 'Unauthorized access');
        }

        $validated = $request->validate([
            'value' => 'required|boolean'
        ]);

        SystemSetting::set('exam_window_open', $validated['value'], 'boolean', 'Controls whether students can submit comprehensive exam applications');

        // Return a redirect back with flash message for Inertia
        return redirect()->back()->with('success', $validated['value'] ? 'Exam window opened successfully' : 'Exam window closed successfully');
    }

    /**
     * Get SuperAdmin dashboard data
     */
    public function dashboard()
    {
        // Get stats
        $stats = [
            'total_users' => User::count(),
            'total_programs' => \App\Models\Program::count(),
            'pending_requests' => \App\Models\DefenseRequest::where('status', 'Pending')->count(),
        ];

        // Get exam settings
        $examSettings = [
            'exam_window_open' => SystemSetting::get('exam_window_open', true)
        ];

        return inertia('dashboard/Index', [
            'stats' => $stats,
            'examSettings' => $examSettings
        ]);
    }
}
