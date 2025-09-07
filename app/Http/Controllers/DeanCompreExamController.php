<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;

class DeanCompreExamController extends Controller
{
    public function index(Request $request)
    {
        if (!Schema::hasTable('exam_application')) {
            return Inertia::render('dean/compre-exam/Index', [
                'programs' => [],
                'pending' => [],
                'approved' => [],
                'rejected' => [],
                'counts' => ['pending' => 0, 'approved' => 0, 'rejected' => 0],
            ]);
        }

        // Join only users. student_id may store users.id or users.school_id
        $rows = DB::table('exam_application as a')
            ->leftJoin('users as u', function ($join) {
                $join->on('u.id', '=', 'a.student_id')
                     ->orOn('u.school_id', '=', 'a.student_id');
            })
            ->select([
                'a.application_id as id',
                'u.first_name',
                'u.middle_name',
                'u.last_name',
                'u.email',
                'u.school_id',
                'u.program',
                'a.created_at as submitted_at',
                DB::raw("LOWER(COALESCE(a.final_approval_status, 'pending')) as application_status"),
                'a.remarks',
            ])
            ->orderByDesc('a.created_at')
            ->get();

        $programs = $rows->pluck('program')->filter()->unique()->sort()->values()->all();

        $pending  = $rows->where('application_status', 'pending')->values();
        $approved = $rows->where('application_status', 'approved')->values();
        $rejected = $rows->where('application_status', 'rejected')->values();

        return Inertia::render('dean/compre-exam/Index', [
            'programs' => $programs,
            'pending' => $pending,
            'approved' => $approved,
            'rejected' => $rejected,
            'counts' => [
                'pending' => $pending->count(),
                'approved' => $approved->count(),
                'rejected' => $rejected->count(),
            ],
        ]);
    }

    public function approve(Request $request, int $id): RedirectResponse
    {
        $row = DB::table('exam_application')->where('application_id', $id)->first();
        if (!$row) return back()->withErrors(['status' => 'Application not found.']);
        if (strtolower($row->final_approval_status ?? 'pending') !== 'pending') {
            return back()->withErrors(['status' => 'Only pending applications can be approved.']);
        }

        DB::table('exam_application')->where('application_id', $id)->update([
            'final_approval_status' => 'approved',
            'updated_at' => now(),
        ]);

        return redirect()->route('dean.compre-exam.index')->with('success', 'Application approved.');
    }

    public function reject(Request $request, int $id): RedirectResponse
    {
        $data = $request->validate(['remarks' => ['required', 'string', 'min:3', 'max:500']]);

        $row = DB::table('exam_application')->where('application_id', $id)->first();
        if (!$row) return back()->withErrors(['status' => 'Application not found.']);
        if (strtolower($row->final_approval_status ?? 'pending') !== 'pending') {
            return back()->withErrors(['status' => 'Only pending applications can be rejected.']);
        }

        DB::table('exam_application')->where('application_id', $id)->update([
            'final_approval_status' => 'rejected',
            'remarks' => $data['remarks'],
            'updated_at' => now(),
        ]);

        return redirect()->route('dean.compre-exam.index')->with('success', 'Application rejected.');
    }

    public function bulkApprove(Request $request): RedirectResponse
    {
        $ids = collect($request->input('ids', []))->map(fn($v) => (int)$v)->filter()->unique()->values();
        if ($ids->isEmpty()) return back()->withErrors(['ids' => 'No records selected.']);

        $count = DB::table('exam_application')
            ->whereIn('application_id', $ids)
            ->where('final_approval_status', 'pending')
            ->update(['final_approval_status' => 'approved', 'updated_at' => now()]);

        return redirect()->route('dean.compre-exam.index')->with('success', $count.' application(s) approved.');
    }

    public function bulkReject(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
            'remarks' => ['required', 'string', 'min:3', 'max:500'],
        ]);

        $count = DB::table('exam_application')
            ->whereIn('application_id', $data['ids'])
            ->where('final_approval_status', 'pending')
            ->update(['final_approval_status' => 'rejected', 'remarks' => $data['remarks'], 'updated_at' => now()]);

        return redirect()->route('dean.compre-exam.index')->with('success', $count.' application(s) rejected.');
    }
}