<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class CoordinatorComprePaymentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (method_exists($user, 'isCoordinator') && ! $user->isCoordinator()) {
            abort(403, 'Only coordinators can access this page.');
        }

        $programs = method_exists($user, 'allowedProgramNames') ? $user->allowedProgramNames() : [];
        if (empty($programs)) {
            return Inertia::render('coordinator/compre-payment/Index', [
                'programs' => [],
                'pending' => [],
                'approved' => [],
                'rejected' => [],
                'counts' => ['pending' => 0, 'approved' => 0, 'rejected' => 0],
            ]);
        }

        // Prefer the concrete table used by the student PaymentForm
        $candidates = ['payment_submissions', 'exam_payment', 'compre_payments', 'payments', 'payment', 'payment_forms', 'exam_application_payments'];
        $table = null;
        foreach ($candidates as $t) {
            if (Schema::hasTable($t)) { $table = $t; break; }
        }
        if (!$table) {
            return Inertia::render('coordinator/compre-payment/Index', [
                'programs' => $programs,
                'pending' => [],
                'approved' => [],
                'rejected' => [],
                'counts' => ['pending' => 0, 'approved' => 0, 'rejected' => 0],
            ]);
        }

        // Columns (match PaymentForm: or_number, payment_date, receipt_image, amount_paid, status, remarks)
        $idCol       = Schema::hasColumn($table, 'payment_id') ? 'payment_id' : (Schema::hasColumn($table, 'id') ? 'id' : null);
        $studentCol  = Schema::hasColumn($table, 'student_id') ? 'student_id' : (Schema::hasColumn($table, 'user_id') ? 'user_id' : null);
        $programCol  = Schema::hasColumn($table, 'program') ? 'program' : null;
        $orCol       = collect(['or_number','reference_no','receipt_no','transaction_id'])->first(fn($c) => Schema::hasColumn($table, $c));
        $amountCol   = collect(['amount_paid','amount','fee','total_amount','paid_amount'])->first(fn($c) => Schema::hasColumn($table, $c));
        $statusCol   = collect(['status','approval_status','finance_status'])->first(fn($c) => Schema::hasColumn($table, $c));
        $remarksCol  = collect(['remarks','notes','comment'])->first(fn($c) => Schema::hasColumn($table, $c));
        $proofCol    = collect(['receipt_image','proof_url','file_url','receipt_url','attachment'])->first(fn($c) => Schema::hasColumn($table, $c));
        $createdCol  = Schema::hasColumn($table, 'created_at') ? 'created_at'
                        : (Schema::hasColumn($table, 'submitted_at') ? 'submitted_at'
                        : (Schema::hasColumn($table, 'uploaded_at') ? 'uploaded_at' : null));

        // Join to users; filter strictly by user's program to avoid missing rows due to missing program on payments
        $q = DB::table("$table as p")
            ->leftJoin('users as u', function ($join) use ($studentCol) {
                if ($studentCol) {
                    $join->on('u.id', '=', "p.$studentCol")
                         ->orOn('u.school_id', '=', "p.$studentCol");
                }
            })
            ->whereIn('u.program', $programs)
            ->when(Schema::hasColumn($table, 'payment_type'), fn($qq) => $qq->where('p.payment_type', 'exam'))
            ->where('u.id', '<>', $user->id) // exclude coordinator
            ->selectRaw(implode(', ', array_filter([
                $idCol ? "p.$idCol as id" : "COALESCE(p.payment_id, p.id) as id",
                'u.first_name', 'u.middle_name', 'u.last_name', 'u.email', 'u.school_id',
                $programCol ? "p.$programCol as program" : "u.program as program",
                $orCol ? "p.$orCol as reference" : "NULL as reference",
                $amountCol ? "p.$amountCol as amount" : "NULL as amount",
                $statusCol ? "LOWER(p.$statusCol) as status" : "LOWER('pending') as status",
                $remarksCol ? "p.$remarksCol as remarks" : "NULL as remarks",
                $proofCol ? "p.$proofCol as proof_url" : "NULL as proof_url",
                $createdCol ? "p.$createdCol as submitted_at" : "p.created_at as submitted_at",
            ])));

        // Avoid ambiguous order by
        if ($idCol) {
            $q->orderByDesc("p.$idCol");
        } elseif ($createdCol) {
            $q->orderByDesc("p.$createdCol");
        }

        $rows = $q->get()->map(function ($r) {
            $status = in_array($r->status, ['approved','rejected','pending']) ? $r->status : 'pending';
            return [
                'id' => (int) $r->id,
                'first_name' => $r->first_name ?? '',
                'middle_name' => $r->middle_name ?? null,
                'last_name' => $r->last_name ?? '',
                'email' => $r->email ?? null,
                'school_id' => $r->school_id ?? null,
                'program' => $r->program ?? null,
                'reference' => $r->reference ?? null,
                'amount' => is_null($r->amount) ? null : (float) $r->amount,
                'submitted_at' => $r->submitted_at ?? null,
                'status' => $status,
                'remarks' => $r->remarks ?? null,
                'proof_url' => $r->proof_url ?? null,
            ];
        });

        $pending = $rows->where('status', 'pending')->values();
        $approved = $rows->where('status', 'approved')->values();
        $rejected = $rows->where('status', 'rejected')->values();

        return Inertia::render('coordinator/compre-payment/Index', [
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
        $user = $request->user();
        if (method_exists($user, 'isCoordinator') && ! $user->isCoordinator()) {
            abort(403, 'Only coordinators can approve.');
        }

        if (!Schema::hasTable('payment_submissions')) {
            return back()->withErrors(['status' => 'Payments table not found.']);
        }

        // Limit to students within coordinator programs
        $programs = method_exists($user, 'allowedProgramNames')
            ? $user->allowedProgramNames() : array_filter([$user->program]);

        $row = DB::table('payment_submissions as p')
            ->leftJoin('users as u', 'u.id', '=', 'p.student_id')
            ->where('p.payment_id', $id)
            ->whereIn('u.program', $programs)
            ->select('p.payment_id', 'p.status')
            ->first();

        if (!$row) {
            return back()->withErrors(['status' => 'Record not found or not within your programs.']);
        }
        if (strtolower($row->status) !== 'pending') {
            return back()->withErrors(['status' => 'Only pending payments can be approved.']);
        }

        DB::table('payment_submissions')
            ->where('payment_id', $id)
            ->update([
                'status' => 'approved',
                'updated_at' => now(),
            ]);

        return redirect()->route('coordinator.compre-payment.index')->with('success', 'Payment approved.');
    }

    public function reject(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (method_exists($user, 'isCoordinator') && ! $user->isCoordinator()) {
            abort(403, 'Only coordinators can reject.');
        }

        $request->validate([
            'remarks' => ['required','string','min:3','max:500'],
        ]);

        if (!Schema::hasTable('payment_submissions')) {
            return back()->withErrors(['status' => 'Payments table not found.']);
        }

        $programs = method_exists($user, 'allowedProgramNames')
            ? $user->allowedProgramNames() : array_filter([$user->program]);

        $row = DB::table('payment_submissions as p')
            ->leftJoin('users as u', 'u.id', '=', 'p.student_id')
            ->where('p.payment_id', $id)
            ->whereIn('u.program', $programs)
            ->select('p.payment_id', 'p.status')
            ->first();

        if (!$row) {
            return back()->withErrors(['status' => 'Record not found or not within your programs.']);
        }
        if (strtolower($row->status) !== 'pending') {
            return back()->withErrors(['status' => 'Only pending payments can be rejected.']);
        }

        DB::table('payment_submissions')
            ->where('payment_id', $id)
            ->update([
                'status' => 'rejected',
                'remarks' => $request->input('remarks'),
                'updated_at' => now(),
            ]);

        return redirect()->route('coordinator.compre-payment.index')->with('success', 'Payment rejected.');
    }
}