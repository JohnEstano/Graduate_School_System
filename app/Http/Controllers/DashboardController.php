<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Derive an effective role (fallback to any pivot role if legacy column empty)
        $effective = $user->role;
        if (!$effective) {
            $all = $user->allRoleNames();
            $priority = ['Coordinator','Dean','Chair','Faculty','Student'];
            foreach ($priority as $p) {
                if (in_array($p, $all, true)) { $effective = $p; break; }
            }
            if (!$effective && !empty($all)) {
                $effective = $all[0];
            }
        }

        return Inertia::render('dashboard/Index', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar ?? null,
                    'role' => $user->role, // original legacy column (may be null)
                    'effective_role' => $effective,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ],
            ],
        ]);
    }
}
