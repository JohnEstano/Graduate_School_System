<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            abort(401);
        }

        $roleName = is_object($user->role) ? $user->role->name : $user->role;
        if (in_array($roleName, ['Faculty', 'Adviser']) && method_exists($user, 'generateAdviserCode') && !$user->adviser_code) {
            $user->generateAdviserCode();
        }

        // --- Add this block ---
        $studentsCount = 0;
        if (in_array($roleName, ['Faculty', 'Adviser']) && method_exists($user, 'advisedStudents')) {
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
        } catch (\Throwable $e) {
            // don't crash the dashboard for missing models/columns — log if you want
            Log::debug('Dashboard student-defense lookup failed: '.$e->getMessage());
            // keep defaults (null / empty collection)
        }

        // --- prepare the Inertia payload (combines both branches) ---
        $props = [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name ?? trim($user->first_name . ' ' . $user->last_name),
                    'first_name' => $user->first_name,
                    'middle_name' => $user->middle_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'role' => $effective,
                    'school_id' => $user->school_id,
                    'avatar' => $user->employee_photo_url ?? null,
                    // --- Add this line ---
                    'advisers' => method_exists($user, 'advisers') ? $user->advisers()->get(['id','name','first_name','last_name','email','adviser_code']) : collect(),
                ],
            ],
            // student-specific objects (may be null / empty if not applicable)
            'defenseRequirement' => $latestRequirement,
            'defenseRequest' => $defenseRequest,
            'defenseRequests' => $defenseRequests,
            'studentsCount' => $studentsCount,
        ];

        // --- Super Admin specific data ---
        if ($effective === 'Super Admin') {
            $props['activeUsers'] = $this->getActiveUsers();
            $props['allUsers'] = $this->getAllUsers();
            $props['programs'] = $this->getPrograms();
            $props['coordinators'] = $this->getCoordinators();
            $props['stats'] = $this->getSuperAdminStats();
        }

        return Inertia::render('dashboard/Index', $props);
    }

    /**
     * Get active users with their last activity
     */
    private function getActiveUsers()
    {
        try {
            return User::select('id', 'first_name', 'last_name', 'email', 'role', 'updated_at')
                ->whereNotNull('email')
                ->orderBy('updated_at', 'desc')
                ->limit(50)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => trim($user->first_name . ' ' . $user->last_name),
                        'email' => $user->email,
                        'role' => $user->role,
                        'last_activity' => $user->updated_at ? $user->updated_at->diffForHumans() : 'Unknown',
                        'is_online' => $user->updated_at && $user->updated_at->gt(now()->subMinutes(15)),
                    ];
                });
        } catch (\Exception $e) {
            return collect();
        }
    }

    /**
     * Get all users for Super Admin management
     */
    private function getAllUsers()
    {
        try {
            return User::select('id', 'first_name', 'last_name', 'email', 'role', 'school_id', 'created_at')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => trim($user->first_name . ' ' . $user->last_name),
                        'email' => $user->email,
                        'role' => $user->role,
                        'school_id' => $user->school_id,
                        'created_at' => $user->created_at ? $user->created_at->format('M d, Y') : 'Unknown',
                    ];
                });
        } catch (\Exception $e) {
            return collect();
        }
    }

    /**
     * Get programs with their coordinators
     */
    private function getPrograms()
    {
        try {
            // Since we don't have a programs table yet, let's create a basic structure
            // This will show coordinators as "programs" for now
            return User::where('role', 'Coordinator')
                ->select('id', 'first_name', 'last_name', 'email', 'program', 'created_at')
                ->get()
                ->map(function ($coordinator, $index) {
                    return [
                        'id' => $coordinator->id,
                        'name' => $coordinator->program ?? 'Graduate Program ' . ($index + 1),
                        'code' => 'GP' . str_pad($coordinator->id, 3, '0', STR_PAD_LEFT),
                        'coordinator_id' => $coordinator->id,
                        'coordinator_name' => trim($coordinator->first_name . ' ' . $coordinator->last_name),
                        'status' => 'active',
                        'students_count' => User::where('role', 'Student')->count(),
                        'created_at' => $coordinator->created_at ? $coordinator->created_at->format('M d, Y') : 'Unknown',
                    ];
                });
        } catch (\Exception $e) {
            return collect();
        }
    }

    /**
     * Get coordinators for program assignment
     */
    private function getCoordinators()
    {
        try {
            return User::where('role', 'Coordinator')
                ->select('id', 'first_name', 'last_name', 'email')
                ->get()
                ->map(function ($coordinator) {
                    return [
                        'id' => $coordinator->id,
                        'name' => trim($coordinator->first_name . ' ' . $coordinator->last_name),
                        'email' => $coordinator->email,
                    ];
                });
        } catch (\Exception $e) {
            return collect();
        }
    }

    /**
     * Get Super Admin statistics
     */
    private function getSuperAdminStats()
    {
        try {
            $totalUsers = User::count();
            $activeSessions = User::where('updated_at', '>', now()->subMinutes(15))->count();
            $totalPrograms = User::where('role', 'Coordinator')->count();
            $pendingRequests = 0;
            
            // Try to get pending defense requests if the model exists
            if (class_exists(\App\Models\DefenseRequest::class)) {
                $pendingRequests = \App\Models\DefenseRequest::whereIn('workflow_state', ['submitted', 'pending', 'adviser-pending'])->count();
            }

            return [
                'total_users' => $totalUsers,
                'active_sessions' => $activeSessions,
                'total_programs' => $totalPrograms,
                'pending_requests' => $pendingRequests,
            ];
        } catch (\Exception $e) {
            return [
                'total_users' => 0,
                'active_sessions' => 0,
                'total_programs' => 0,
                'pending_requests' => 0,
            ];
        }
    }
}
