<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    public function index() {
        $u = Auth::user();
        $manageRoles = ['Coordinator','Administrative Assistant','Dean'];
        // Updated Inertia component path to use existing coordinator schedule page
        return Inertia::render('coordinator/schedule/Index', [
            'userRole'  => $u->role,
            'canManage' => in_array($u->role, $manageRoles),
        ]);
    }
}
