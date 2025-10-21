<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CoordinatorDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (!method_exists($user, 'isCoordinator') || !$user->isCoordinator()) {
            abort(403, 'Only coordinators can access this page.');
        }

        $programs = $user->allowedProgramNames();

        $studentRoleId = Role::where('name', 'Student')->value('id');

        $students = User::query()
            ->when($studentRoleId, fn($q) => $q->where('role_id', $studentRoleId),
                   fn($q) => $q->where('role', 'Student')) // legacy fallback
            ->whereIn('program', $programs ?: ['__none__'])
            ->orderBy('last_name')
            ->get(['id','first_name','middle_name','last_name','email','program']);

        return Inertia::render('coordinator/Index', [
            'programs' => $programs,
            'students' => $students->map(fn($s) => [
                'id' => $s->id,
                'name' => trim("{$s->first_name} " . ($s->middle_name ? $s->middle_name.' ' : '') . $s->last_name),
                'email' => $s->email,
                'program' => $s->program,
            ]),
        ]);
    }
}