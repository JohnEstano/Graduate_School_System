<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Inertia\Inertia;

class CoordinatorAdviserController extends Controller
{
    // List all advisers for this coordinator
    public function index(Request $request)
    {
        $coordinator = $request->user();
        $advisers = $coordinator->coordinatedAdvisers()->get();
        return response()->json($advisers);
    }

    // Attach an adviser to this coordinator
    public function store(Request $request)
    {
        $coordinator = $request->user();
        $adviserId = $request->input('adviser_id');
        $coordinator->coordinatedAdvisers()->syncWithoutDetaching([$adviserId]);
        return response()->json(['success' => true]);
    }

    // Remove an adviser from this coordinator
    public function destroy(Request $request, $adviserId)
    {
        $coordinator = $request->user();
        $coordinator->coordinatedAdvisers()->detach($adviserId);
        return response()->json(['success' => true]);
    }

    public function getCoordinatorCode(Request $request)
    {
        $coordinator = $request->user();
        if (!$coordinator->coordinator_code) {
            $coordinator->generateCoordinatorCode();
        }
        return response()->json(['coordinator_code' => $coordinator->coordinator_code]);
    }

    public function resetCoordinatorCode(Request $request)
    {
        $coordinator = $request->user();
        $coordinator->generateCoordinatorCode();
        return response()->json(['coordinator_code' => $coordinator->coordinator_code]);
    }

    // Register adviser with code
    public function registerWithCode(Request $request)
    {
        $adviser = $request->user();
        $code = $request->input('coordinator_code');
        $coordinator = User::where('coordinator_code', $code)->first();
        if (!$coordinator) {
            return response()->json(['error' => 'Invalid code'], 404);
        }
        if ($adviser->coordinators()->where('coordinator_id', $coordinator->id)->exists()) {
            return response()->json(['error' => 'You are already registered with this coordinator.'], 409);
        }
        try {
            $adviser->coordinators()->attach($coordinator->id);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage() ?? "Registration failed."], 500);
        }

        // Build full name
        $fullName = $coordinator->name
            ?? trim(
                $coordinator->first_name . ' ' .
                ($coordinator->middle_name ? strtoupper($coordinator->middle_name[0]) . '. ' : '') .
                $coordinator->last_name
            );

        return response()->json([
            'success' => true,
            'coordinator' => [
                'name' => $fullName,
                'email' => $coordinator->email,
            ]
        ]);
    }

    public function edit(Request $request)
    {
        $user = $request->user();

        // If student, include adviser info
        $advisers = [];
        if ($user->role === 'Student') {
            $advisers = $user->advisers()
                ->select('first_name', 'middle_name', 'last_name', 'email')
                ->get()
                ->map(function ($a) {
                    return [
                        'name' => trim($a->first_name . ' ' . ($a->middle_name ? strtoupper($a->middle_name[0]) . '. ' : '') . $a->last_name),
                        'email' => $a->email,
                    ];
                });
        }

        // If adviser/faculty, include coordinator info
        $coordinators = [];
        if (in_array($user->role, ['Adviser', 'Faculty'])) {
            $coordinators = $user->coordinators()
                ->select('first_name', 'middle_name', 'last_name', 'email')
                ->get()
                ->map(function ($c) {
                    return [
                        'name' => trim($c->first_name . ' ' . ($c->middle_name ? strtoupper($c->middle_name[0]) . '. ' : '') . $c->last_name),
                        'email' => $c->email,
                    ];
                });
        }

        // For Adviser/Faculty, ensure adviser_code is generated and returned
        $adviserCode = null;
        if (in_array($user->role, ['Adviser', 'Faculty'])) {
            if (!$user->adviser_code) {
                $user->generateAdviserCode();
                $user->refresh();
            }
            $adviserCode = $user->adviser_code;
        }

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'auth' => [
                'user' => array_merge(
                    $user->toArray(),
                    [
                        'advisers' => $advisers,
                        'adviser_code' => $adviserCode,
                        'coordinators' => $coordinators,
                    ]
                ),
            ],
        ]);
    }
}
