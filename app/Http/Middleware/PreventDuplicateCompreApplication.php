<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PreventDuplicateCompreApplication
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user) return $next($request);

        // Find latest application for this student (student_id can be users.id or users.school_id)
        $latest = DB::table('exam_application')
            ->where(function ($q) use ($user) {
                $q->where('student_id', $user->id);
                if (!empty($user->school_id)) {
                    $q->orWhere('student_id', $user->school_id);
                }
            })
            ->orderByDesc('created_at')
            ->first();

        $status = strtolower($latest->final_approval_status ?? '') ?: null;

        // Block when latest is pending or approved. Allow only if latest is rejected (for resubmission).
        if ($latest && in_array($status, ['pending', 'approved'], true)) {
            return redirect()
                ->route('comprehensive-exam.index')   // 👈 sends them back to the form page
                ->withErrors([
                    'application' => 'You already have a ' . $status . ' comprehensive exam application. You cannot submit another.',
                ]);
        }


        return $next($request);
    }
}