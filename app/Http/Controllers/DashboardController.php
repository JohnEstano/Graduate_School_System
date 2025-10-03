<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        if (! $user) {
            abort(401);
        }

        $roleName = is_object($user->role) ? $user->role->name : $user->role;
        if (in_array($roleName, ['Faculty', 'Adviser']) && !$user->adviser_code) {
            $user->generateAdviserCode();
        }

        // --- Add this block ---
        $studentsCount = 0;
        if (in_array($roleName, ['Faculty', 'Adviser'])) {
            $studentsCount = $user->advisedStudents()->count();
        }
        // --- End block ---

        // --- compute effective role (from _dev_develop) ---
        $effective = $user->role;
        if (! $effective) {
            // if using a roles package / pivot, try to derive a priority-based effective role
            if (method_exists($user, 'allRoleNames')) {
                $all = $user->allRoleNames();
                $priority = ['Coordinator','Dean','Chair','Faculty','Student'];
                foreach ($priority as $p) {
                    if (in_array($p, $all, true)) {
                        $effective = $p;
                        break;
                    }
                }
                if (! $effective && ! empty($all)) {
                    $effective = $all[0];
                }
            }
        }

        // --- student-specific defense requirement / request lookup (from develop) ---
        $latestRequirement = null;
        $defenseRequests = collect();
        $defenseRequest = null;

        try {
            // latest defense requirement for the student (if your model uses user_id)
            if (class_exists(\App\Models\DefenseRequirement::class)) {
                $latestRequirement = \App\Models\DefenseRequirement::where('user_id', $user->id)
                    ->orderByDesc('created_at')
                    ->first();
            }

            // get all defense requests that match the student's identity (school_id + name)
            if (class_exists(\App\Models\DefenseRequest::class)) {
                $defenseRequests = \App\Models\DefenseRequest::where('school_id', $user->school_id)
                    ->where('first_name', $user->first_name)
                    ->where('last_name', $user->last_name)
                    ->orderByDesc('date_of_defense')
                    ->get();
            }

            // find a related defense request using thesis_title from the latest requirement (if present)
            if ($latestRequirement && class_exists(\App\Models\DefenseRequest::class)) {
                $defenseRequest = \App\Models\DefenseRequest::where('thesis_title', $latestRequirement->thesis_title)
                    ->where('school_id', $user->school_id)
                    ->where('first_name', $user->first_name)
                    ->where('last_name', $user->last_name)
                    ->latest()
                    ->first();
            }

            if (in_array($roleName, ['Coordinator','Administrative Assistant','Dean'])) {
                // Send ALL defense requests for coordinator
                $defenseRequests = \App\Models\DefenseRequest::orderByDesc('created_at')->get();
            }
        } catch (\Throwable $e) {
            // don't crash the dashboard for missing models/columns — log if you want
            \Log::debug('Dashboard student-defense lookup failed: '.$e->getMessage());
            // keep defaults (null / empty collection)
        }

        // --- prepare the Inertia payload (combines both branches) ---
        $props = [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'first_name' => $user->first_name,
                    'middle_name' => $user->middle_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'role' => $effective,
                    'school_id' => $user->school_id,
                    'avatar' => $user->employee_photo_url ?? null,
                    // --- Add this line ---
                    'advisers' => $user->advisers()->get(['id','name','first_name','last_name','email','adviser_code']),
                ],
            ],
            'defenseRequirement' => $latestRequirement,
            'defenseRequest' => $defenseRequest,
            'defenseRequests' => $defenseRequests,
            'studentsCount' => $studentsCount,
        ];

        return Inertia::render('dashboard/Index', $props);
    }
}
