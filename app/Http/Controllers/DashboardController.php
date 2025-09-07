<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        // Get the latest defense requirement for the student
        $latestRequirement = \App\Models\DefenseRequirement::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->first();

        // Get ALL defense requests for this student using school_id and name
        $defenseRequests = \App\Models\DefenseRequest::where('school_id', $user->school_id)
            ->where('first_name', $user->first_name)
            ->where('last_name', $user->last_name)
            ->orderByDesc('date_of_defense')
            ->get();

        // Get the related defense request (if any)
        $defenseRequest = null;
        if ($latestRequirement) {
            $defenseRequest = \App\Models\DefenseRequest::where('thesis_title', $latestRequirement->thesis_title)
                ->where('school_id', $user->school_id)
                ->where('first_name', $user->first_name)
                ->where('last_name', $user->last_name)
                ->latest()
                ->first();
        }

        return inertia('dashboard/Index', [
            'defenseRequirement' => $latestRequirement,
            'defenseRequest' => $defenseRequest,
            'defenseRequests' => $defenseRequests,
            // ...other props...
        ]);
    }
}
