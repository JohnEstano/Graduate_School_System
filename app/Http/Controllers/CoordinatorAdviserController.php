<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Inertia\Inertia;

class CoordinatorAdviserController extends Controller
{
    // List all advisers for this coordinator
    // This includes both advisers manually added AND advisers who registered using the coordinator code
    public function index(Request $request)
    {
        $coordinator = $request->user();
        
        // Get all advisers connected to this coordinator via the pivot table
        $advisers = $coordinator->coordinatedAdvisers()
            ->select('users.id', 'users.first_name', 'users.middle_name', 'users.last_name', 'users.email', 'users.program', 'users.employee_id')
            ->get()
            ->map(function($adviser) {
                return [
                    'id' => $adviser->id,
                    'first_name' => $adviser->first_name,
                    'middle_name' => $adviser->middle_name,
                    'last_name' => $adviser->last_name,
                    'email' => $adviser->email,
                    'program' => $adviser->program ?? 'N/A',
                    'employee_id' => $adviser->employee_id,
                ];
            });
            
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

    // Search for advisers (autocomplete)
    public function search(Request $request)
    {
        $query = $request->input('query', '');
        
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        // Get current coordinator's already assigned advisers
        $coordinator = $request->user();
        $assignedAdviserIds = $coordinator->coordinatedAdvisers()->pluck('users.id')->toArray();

        // Search for faculty members who are NOT already assigned to this coordinator
        $advisers = User::where('role', 'Faculty')
            ->where(function($q) use ($query) {
                $q->where('first_name', 'LIKE', "%{$query}%")
                  ->orWhere('last_name', 'LIKE', "%{$query}%")
                  ->orWhere('email', 'LIKE', "%{$query}%")
                  ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$query}%"])
                  ->orWhereRaw("CONCAT(last_name, ', ', first_name) LIKE ?", ["%{$query}%"]);
            })
            ->whereNotIn('id', $assignedAdviserIds)
            ->select('id', 'first_name', 'middle_name', 'last_name', 'email', 'program', 'employee_id')
            ->limit(10)
            ->get()
            ->map(function($adviser) {
                $middleInitial = $adviser->middle_name ? strtoupper($adviser->middle_name[0]) . '. ' : '';
                return [
                    'id' => $adviser->id,
                    'name' => trim("{$adviser->first_name} {$middleInitial}{$adviser->last_name}"),
                    'first_name' => $adviser->first_name,
                    'middle_name' => $adviser->middle_name,
                    'last_name' => $adviser->last_name,
                    'email' => $adviser->email,
                    'program' => $adviser->program ?? 'N/A',
                    'employee_id' => $adviser->employee_id,
                ];
            });

        return response()->json($advisers);
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

    public function getRegisteredCoordinator(Request $request)
    {
        $user = $request->user();
        $coordinator = $user->coordinators()->select('id', 'first_name', 'middle_name', 'last_name', 'email')->first();
        if (!$coordinator) {
            return response()->json(['error' => 'No coordinator registered.'], 404);
        }
        return response()->json([
            'id' => $coordinator->id,
            'name' => trim($coordinator->first_name . ' ' . ($coordinator->middle_name ? strtoupper($coordinator->middle_name[0]) . '. ' : '') . $coordinator->last_name),
            'email' => $coordinator->email,
        ]);
    }
}
