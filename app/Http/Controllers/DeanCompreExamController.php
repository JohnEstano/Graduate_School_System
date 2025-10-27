<?php
// filepath: c:\GSURS\Graduate_School_System-1\app\Http\Controllers\DeanCompreExamController.php
namespace App\Http\Controllers;

use App\Models\ExamApplication;
use App\Models\ExamDeanReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DeanCompreExamController extends Controller
{
    // Optional Inertia page (UI already calls the API)
    public function page()
    { 
        $programs = ExamApplication::query()
            ->whereNotNull('program')
            ->distinct()->orderBy('program')
            ->pluck('program')->toArray();

        return Inertia::render('dean/compre-exam/Index', [
            'programs' => $programs,
        ]);
    }

    // Registrar-approved only
    public function list(Request $request)
    {
        $validated = $request->validate([
            'q'       => ['nullable','string','max:255'],
            'program' => ['nullable','string','max:255'],
            'status'  => ['nullable','in:all,pending,approved,rejected'],
            'from'    => ['nullable','date'],
            'to'      => ['nullable','date'],
            'per_page'=> ['nullable','integer','min:5','max:200'],
        ]);

    // Default to 'all' so clients that don't pass a status get a complete set for tabs/counts
    $status = $validated['status'] ?? 'all';

        $q = ExamApplication::query()
            ->from('exam_application as ea')
            ->where('ea.registrar_status', 'approved')
            // join by user id
            ->leftJoin('users as u_id', 'u_id.school_id', '=', 'ea.student_id')
            // join by student_number (string match)
            ->leftJoin('users as u_sn', function ($join) {
                $join->on(DB::raw('TRIM(u_sn.student_number)'), '=', DB::raw('TRIM(ea.student_id)'));
            })
            ->select([
                'ea.application_id',
                'ea.program',
                'ea.school_year',
                'ea.created_at',
                'ea.registrar_status',
                'ea.final_approval_status',
                'ea.final_approval_date',
                'ea.final_approval_reason',
                DB::raw('COALESCE(u_sn.first_name, u_id.first_name) as first_name'),
                DB::raw('COALESCE(u_sn.middle_name, u_id.middle_name) as middle_name'),
                DB::raw('COALESCE(u_sn.last_name, u_id.last_name) as last_name'),
                DB::raw('COALESCE(u_sn.email, u_id.email) as email'),
                DB::raw('COALESCE(u_sn.student_number, u_id.student_number, ea.student_id) as school_id'),
            ])
            ->when(($validated['program'] ?? null), fn($qq, $p) => $qq->where('ea.program', $p))
            ->when(($validated['from'] ?? null), fn($qq, $d) => $qq->whereDate('ea.created_at', '>=', $d))
            ->when(($validated['to'] ?? null), fn($qq, $d) => $qq->whereDate('ea.created_at', '<=', $d))
            ->when(($validated['q'] ?? null), function ($qq) use ($validated) {
                $term = '%'.$validated['q'].'%';
                $qq->where(function ($w) use ($term) {
                  $w->whereRaw('COALESCE(u_sn.first_name, u_id.first_name) like ?', [$term])
                    ->orWhereRaw('COALESCE(u_sn.last_name, u_id.last_name) like ?', [$term])
                    ->orWhere('ea.program', 'like', $term)
                    ->orWhere('ea.school_year', 'like', $term)
                    ->orWhereRaw('COALESCE(u_sn.email, u_id.email) like ?', [$term])
                    ->orWhereRaw('COALESCE(u_sn.student_number, u_id.student_number, ea.student_id) like ?', [$term]);
                });
            });

        if ($status && $status !== 'all') {
            if ($status === 'pending') {
                $q->where(function ($w) {
                    $w->whereNull('ea.final_approval_status')->orWhere('ea.final_approval_status', 'pending');
                });
            } else {
                $q->where('ea.final_approval_status', $status);
            }
        }

    // Use a larger default page size so single-fetch UIs can compute counts across tabs reliably
    $rows = $q->orderByDesc('ea.created_at')->paginate($validated['per_page'] ?? 200);

        // Shape to UI
        $rows->getCollection()->transform(function ($r) {
            return [
                'application_id'        => (int)$r->application_id,
                'first_name'            => (string)($r->first_name ?? ''),
                'middle_name'           => $r->middle_name,
                'last_name'             => (string)($r->last_name ?? ''),
                'email'                 => $r->email,
                'school_id'             => $r->school_id,
                'program'               => $r->program,
                'school_year'           => $r->school_year,
                'created_at'            => $r->created_at,
                'subjects_count'        => 0,
                'registrar_status'      => $r->registrar_status,
                'final_approval_status' => $r->final_approval_status ?? 'pending',
                'final_approval_date'   => $r->final_approval_date,
                'final_approval_reason' => $r->final_approval_reason,
            ];
        });

        return response()->json($rows);
    }

    public function decide(Request $request, ExamApplication $application)
    {
        $validated = $request->validate([
            'status' => ['required','in:approved,rejected'],
            'reason' => ['nullable','string','max:500'],
        ]);

        DB::transaction(function () use ($application, $validated) {
            $application->final_approval_status = $validated['status'];
            $application->final_approval_date   = now();
            $application->final_approval_reason = $validated['status'] === 'rejected' ? ($validated['reason'] ?? null) : null;
            $application->save();

            ExamDeanReview::create([
                'exam_application_id' => $application->application_id,
                'status'              => $validated['status'],
                'reason'              => $validated['reason'] ?? null,
                'reviewed_by'         => Auth::id(),
            ]);
        });

        return response()->json(['ok' => true]);
    }

    public function bulkDecision(Request $request)
    {
        abort_unless(in_array(Auth::user()->role, ['Dean','Coordinator']), 403);

        $validated = $request->validate([
            'ids'    => ['required','array','min:1'],
            'ids.*'  => ['integer'],
            'status' => ['required','in:approved,rejected'],
            'reason' => ['nullable','string','max:500'],
        ]);

        DB::transaction(function () use ($validated) {
            $ids = $validated['ids'];
            $status = $validated['status'];
            $reason = $validated['reason'] ?? null;

            ExamApplication::whereIn('application_id', $ids)->update([
                'final_approval_status' => $status,
                'final_approval_date'   => now(),
                'final_approval_reason' => $status === 'rejected' ? $reason : null,
            ]);

            $rows = [];
            foreach ($ids as $id) {
                $rows[] = [
                    'exam_application_id' => $id,
                    'status' => $status,
                    'reason' => $reason,
                    'reviewed_by' => Auth::id(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            ExamDeanReview::insert($rows);
        });

        return response()->json(['ok' => true]);
    }

    public function reviews(ExamApplication $application)
    {
        abort_unless(in_array(Auth::user()->role, ['Dean','Coordinator']), 403);

        return ExamDeanReview::where('exam_application_id', $application->application_id)
            ->orderByDesc('created_at')
            ->get(['id','status','reason','reviewed_by','created_at']);
    }
}