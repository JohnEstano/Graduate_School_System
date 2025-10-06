<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CoordinatorProgramAssignment;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CoordinatorProgramAssignmentController extends Controller
{
    /**
     * Get all coordinator program assignments
     */
    public function index()
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'Super Admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $assignments = CoordinatorProgramAssignment::with(['coordinator', 'assignedBy'])
            ->where('is_active', true)
            ->orderBy('coordinator_user_id')
            ->orderBy('program_name')
            ->get()
            ->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'coordinator_id' => $assignment->coordinator_user_id,
                    'coordinator_name' => $assignment->coordinator 
                        ? trim($assignment->coordinator->first_name . ' ' . $assignment->coordinator->last_name)
                        : 'Unknown',
                    'coordinator_email' => $assignment->coordinator?->email,
                    'program_name' => $assignment->program_name,
                    'assigned_by_name' => $assignment->assignedBy
                        ? trim($assignment->assignedBy->first_name . ' ' . $assignment->assignedBy->last_name)
                        : 'System',
                    'notes' => $assignment->notes,
                    'created_at' => $assignment->created_at->format('M d, Y H:i'),
                ];
            });

        return response()->json(['assignments' => $assignments]);
    }

    /**
     * Get all available programs (from existing defense requests and users)
     */
    public function getAvailablePrograms()
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'Super Admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get unique programs from defense_requests and users tables
        $defensePrograms = DB::table('defense_requests')
            ->select('program')
            ->distinct()
            ->whereNotNull('program')
            ->where('program', '!=', '')
            ->pluck('program');

        $userPrograms = DB::table('users')
            ->select('program')
            ->distinct()
            ->whereNotNull('program')
            ->where('program', '!=', '')
            ->pluck('program');

        $allPrograms = $defensePrograms->merge($userPrograms)
            ->unique()
            ->sort()
            ->values();

        return response()->json(['programs' => $allPrograms]);
    }

    /**
     * Assign a program to a coordinator
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'Super Admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'coordinator_user_id' => 'required|exists:users,id',
            'program_name' => 'required|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            // Check if coordinator has the right role
            $coordinator = User::find($validated['coordinator_user_id']);
            if (!in_array($coordinator->role, ['Coordinator', 'Administrative Assistant', 'Dean'])) {
                return response()->json([
                    'error' => 'Selected user is not a coordinator'
                ], 422);
            }

            // Check if assignment already exists
            $existing = CoordinatorProgramAssignment::where('coordinator_user_id', $validated['coordinator_user_id'])
                ->where('program_name', $validated['program_name'])
                ->first();

            if ($existing) {
                if ($existing->is_active) {
                    return response()->json([
                        'error' => 'This coordinator is already assigned to this program'
                    ], 422);
                } else {
                    // Reactivate existing assignment
                    $existing->is_active = true;
                    $existing->assigned_by = $user->id;
                    $existing->notes = $validated['notes'] ?? null;
                    $existing->save();

                    Log::info('Coordinator program assignment reactivated', [
                        'assignment_id' => $existing->id,
                        'coordinator_id' => $validated['coordinator_user_id'],
                        'program' => $validated['program_name'],
                        'reactivated_by' => $user->id,
                    ]);

                    return response()->json([
                        'success' => true,
                        'assignment' => $existing,
                        'message' => 'Program assignment reactivated successfully'
                    ]);
                }
            }

            // Create new assignment
            $assignment = CoordinatorProgramAssignment::create([
                'coordinator_user_id' => $validated['coordinator_user_id'],
                'program_name' => $validated['program_name'],
                'assigned_by' => $user->id,
                'notes' => $validated['notes'] ?? null,
                'is_active' => true,
            ]);

            Log::info('Coordinator program assignment created', [
                'assignment_id' => $assignment->id,
                'coordinator_id' => $validated['coordinator_user_id'],
                'coordinator_name' => trim($coordinator->first_name . ' ' . $coordinator->last_name),
                'program' => $validated['program_name'],
                'assigned_by' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'assignment' => $assignment,
                'message' => 'Program assigned successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating coordinator program assignment', [
                'error' => $e->getMessage(),
                'coordinator_id' => $validated['coordinator_user_id'] ?? null,
                'program' => $validated['program_name'] ?? null,
            ]);

            return response()->json([
                'error' => 'Failed to assign program. Please try again.'
            ], 500);
        }
    }

    /**
     * Remove a program assignment from a coordinator
     */
    public function destroy($id)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'Super Admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $assignment = CoordinatorProgramAssignment::findOrFail($id);
            
            // Soft delete by setting is_active to false
            $assignment->is_active = false;
            $assignment->save();

            Log::info('Coordinator program assignment removed', [
                'assignment_id' => $id,
                'coordinator_id' => $assignment->coordinator_user_id,
                'program' => $assignment->program_name,
                'removed_by' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Program assignment removed successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error removing coordinator program assignment', [
                'error' => $e->getMessage(),
                'assignment_id' => $id,
            ]);

            return response()->json([
                'error' => 'Failed to remove assignment. Please try again.'
            ], 500);
        }
    }

    /**
     * Get all coordinators for assignment
     */
    public function getCoordinators()
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'Super Admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $coordinators = User::whereIn('role', ['Coordinator', 'Administrative Assistant', 'Dean'])
            ->select('id', 'first_name', 'middle_name', 'last_name', 'email', 'role')
            ->orderBy('first_name')
            ->get()
            ->map(function ($coord) {
                return [
                    'id' => $coord->id,
                    'name' => trim($coord->first_name . ' ' . $coord->last_name),
                    'email' => $coord->email,
                    'role' => $coord->role,
                ];
            });

        return response()->json(['coordinators' => $coordinators]);
    }
}

