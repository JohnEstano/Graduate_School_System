<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class CoordinatorCompreExamController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (method_exists($user, 'isCoordinator') && ! $user->isCoordinator()) {
            abort(403, 'Only coordinators can access this page.');
        }

        $programs = method_exists($user, 'allowedProgramNames') ? $user->allowedProgramNames() : [];

        if (empty($programs)) {
            return Inertia::render('coordinator/compre-exam/Index', [
                'programs' => [],
                'eligible' => [],
                'notEligible' => [],
                'counts' => ['eligible' => 0, 'notEligible' => 0],
            ]);
        }

        // Load students in my programs (role check: role_id=Student or role='Student')
        $useRoleString = Schema::hasColumn('users', 'role');
        $studentRoleIds = [];

        if (Schema::hasTable('roles')) {
            $studentRoleIds = DB::table('roles')
                ->whereIn('name', ['Student', 'student', 'STUDENT'])
                ->pluck('id')
                ->all();
        }

        $students = DB::table('users as u')
            ->select('u.id', 'u.first_name', 'u.middle_name', 'u.last_name', 'u.email', 'u.program', 'u.school_id')
            ->whereIn('u.program', $programs)
            // Only real students
            ->when($useRoleString, function ($q) {
                $q->whereIn(DB::raw('LOWER(u.role)'), ['student']);
            }, function ($q) use ($studentRoleIds) {
                if (!empty($studentRoleIds)) {
                    $q->whereIn('u.role_id', $studentRoleIds);
                } else {
                    // final fallback: no roles table, still require role string if present
                    $q->whereIn(DB::raw('LOWER(u.role)'), ['student']);
                }
            })
            // Never include the current coordinator account
            ->where('u.id', '<>', $user->id)
            ->orderBy('u.last_name')
            ->get();

        $hasExamApp = Schema::hasTable('exam_application');
        $orderCol = $hasExamApp
            ? (Schema::hasColumn('exam_application', 'application_id') ? 'application_id'
                : (Schema::hasColumn('exam_application', 'id') ? 'id' : 'created_at'))
            : null;

        $rows = $students->map(function ($s) use ($hasExamApp, $orderCol) {
            $sid = $s->school_id ?? $s->id;

            $latest = null;
            if ($hasExamApp) {
                $latest = DB::table('exam_application')
                    ->where('student_id', $sid)
                    ->orderByDesc($orderCol)
                    ->first();
            }

            $elig = $this->computeEligibility($sid);

            return [
                'id' => (int) $s->id,
                'first_name' => $s->first_name ?? '',
                'middle_name' => $s->middle_name ?? null,
                'last_name' => $s->last_name ?? '',
                'email' => $s->email ?? null,
                'school_id' => $s->school_id ?? null,
                'program' => $s->program ?? null,

                'eligible' => $elig['eligible'],
                'lacking' => $elig['lacking'],

                'applied' => (bool) $latest,
                'submitted_at' => $latest->created_at ?? null,
                'application_status' => $latest
                    ? strtolower($latest->final_approval_status ?? 'pending')
                    : 'not_yet_applied',
                'permit_status' => $latest ? strtolower($latest->permit_status ?? 'pending') : null,
            ];
        });

        $eligible = $rows->where('eligible', true)->values();
        $notEligible = $rows->where('eligible', false)->values();

        return Inertia::render('coordinator/compre-exam/Index', [
            'programs' => $programs,
            'eligible' => $eligible,
            'notEligible' => $notEligible,
            'counts' => ['eligible' => $eligible->count(), 'notEligible' => $notEligible->count()],
        ]);
    }

    // Simulation-friendly eligibility (set COMPRE_BYPASS_RULES=true in .env for local dev)
    protected function computeEligibility($studentId): array
    {
        $devBypass = app()->environment('local') && (bool) env('COMPRE_BYPASS_RULES', true);
        if ($devBypass) {
            return ['eligible' => true, 'lacking' => []];
        }

        $lacking = [];

        if (Schema::hasTable('grades')) {
            $hasGrades = DB::table('grades')->where('student_id', $studentId)->exists();
            if (! $hasGrades) $lacking[] = 'Grades';
        } else {
            $lacking[] = 'Grades';
        }

        if (Schema::hasTable('student_documents')) {
            $docsComplete = DB::table('student_documents')
                ->where('student_id', $studentId)
                ->where('is_complete', 1)
                ->exists();
            if (! $docsComplete) $lacking[] = 'Documents';
        } else {
            $lacking[] = 'Documents';
        }

        if (Schema::hasTable('student_accounts')) {
            $acct = DB::table('student_accounts')->where('student_id', $studentId)->first();
            $ok = $acct && (float) ($acct->outstanding_balance ?? 0) <= 0;
            if (! $ok) $lacking[] = 'Outstanding Balance';
        } else {
            $lacking[] = 'Outstanding Balance';
        }

        return ['eligible' => count($lacking) === 0, 'lacking' => $lacking];
    }
}