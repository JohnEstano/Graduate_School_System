<?php
// filepath: c:\GSPS\Graduate_School_System\app\Http\Controllers\PaymentSubmissionController.php
namespace App\Http\Controllers;

use App\Models\PaymentSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Illuminate\Support\Carbon;
use Database\Seeders\CoordinatorProgramSeeder;
use App\Models\CoordinatorProgram;
use App\Models\CoordinatorProgramAssignment;

class PaymentSubmissionController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Accept either users.id or users.student_number stored in exam_application.student_id
        $ids = array_values(array_unique(array_filter([
            (string) $user->id,
            $user->student_number ? (string) $user->student_number : null,
        ])));

        $hasApp = false;
        if (Schema::hasTable('exam_application')) {
            $hasApp = DB::table('exam_application')
                ->where(function ($q) use ($ids) {
                    foreach ($ids as $i => $val) {
                        $i === 0 ? $q->where('student_id', $val) : $q->orWhere('student_id', $val);
                    }
                })
                ->exists();
        }

        $payment = PaymentSubmission::where('student_id', $user->id)
            ->where('payment_type', 'exam')
            ->orderByDesc('payment_id')
            ->first();

        return Inertia::render('payment/Index', [
            'student' => [
                'name'    => trim($user->first_name.' '.($user->middle_name ? $user->middle_name.' ' : '').$user->last_name),
                'program' => $user->program ?? null,
                'email'   => $user->email ?? null,
            ],
            'canSubmit' => $hasApp, // allow submit after application exists
            'payment' => $payment ? [
                'payment_id'   => $payment->payment_id,
                'or_number'    => $payment->or_number,
                'payment_date' => optional($payment->payment_date)->toDateString(),
                'receipt_image'=> $payment->receipt_image,
                'status'       => $payment->status,
                'remarks'      => $payment->remarks,
                'amount_paid'  => $payment->amount_paid,
                'created_at'   => optional($payment->created_at)->format('Y-m-d H:i:s'),
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        // Must have an application first (either users.id or users.student_number saved as student_id)
        $ids = array_values(array_unique(array_filter([
            (string) $user->id,
            $user->student_number ? (string) $user->student_number : null,
        ])));

        $hasApp = false;
        if (Schema::hasTable('exam_application')) {
            $hasApp = DB::table('exam_application')
                ->where(function ($q) use ($ids) {
                    foreach ($ids as $i => $val) {
                        $i === 0 ? $q->where('student_id', $val) : $q->orWhere('student_id', $val);
                    }
                })
                ->exists();
        }

        if (! $hasApp) {
            return back()->withErrors([
                'form' => 'You can only submit payment after submitting your comprehensive application.',
            ])->withInput();
        }

        $existing = PaymentSubmission::where('student_id', $user->id)
            ->where('payment_type', 'exam')
            ->first();

        $validated = $request->validate([
            'or_number'     => ['required','string','max:50'],
            'payment_date'  => ['required','date'],
            'amount_paid'   => ['required','numeric','min:0'],
            'receipt_image' => [$existing && $existing->receipt_image ? 'nullable' : 'required', 'image', 'max:5120'],
        ]);

        $payload = [
            'student_id'   => $user->id,
            'payment_type' => 'exam',
            'or_number'    => $validated['or_number'],
            'payment_date' => $validated['payment_date'],
            'amount_paid'  => $validated['amount_paid'],
            'status'       => 'pending',
        ];

        if ($request->hasFile('receipt_image')) {
            $payload['receipt_image'] = $request->file('receipt_image')->store('payment_receipts', 'public');
        }

        PaymentSubmission::updateOrCreate(
            ['student_id' => $user->id, 'payment_type' => 'exam'],
            $payload
        );

        return redirect()->route('payment.index')->with('success', 'Payment submitted successfully.');
    }

    public function coordinatorIndex(Request $request)
    {
        $user = $request->user();

        $programs = [];
        if (Schema::hasTable((new CoordinatorProgram())->getTable())) {
            $programs = CoordinatorProgram::where('coordinator_id', $user->id)->pluck('program')->toArray();
        }
        if (empty($programs) && Schema::hasTable((new CoordinatorProgramAssignment())->getTable())) {
            $programs = CoordinatorProgramAssignment::where('coordinator_user_id', $user->id)
                ->where('is_active', true)->pluck('program_name')->toArray();
        }
        if (empty($programs)) {
            $programs = CoordinatorProgramSeeder::getProgramsByEmail($user->email ?? '');
        }

        if (empty($programs)) {
            return Inertia::render('coordinator/compre-payment/Index', [
                'programs' => [], 'pending' => [], 'approved' => [], 'rejected' => [],
                'counts' => ['pending' => 0, 'approved' => 0, 'rejected' => 0],
            ]);
        }

        $normalized = array_values(array_unique(array_map(
            fn($p) => mb_strtolower(trim(preg_replace('/\s+/', ' ', (string)$p))),
            $programs
        )));

        $payments = DB::table('payment_submissions as p')
            ->leftJoin('users as u', 'u.id', '=', 'p.student_id')
            ->where('p.payment_type', 'exam')
            ->where(function ($q) use ($normalized) {
                $q->whereExists(function ($sub) use ($normalized) {
                    $sub->from('exam_application as ea')
                        ->select(DB::raw(1))
                        ->whereRaw('ea.student_id = CAST(u.id AS CHAR)')
                        ->where(function ($w) use ($normalized) {
                            foreach ($normalized as $i => $np) {
                                $like = '%'.$np.'%';
                                $i === 0 ? $w->whereRaw('LOWER(ea.program) LIKE ?', [$like])
                                         : $w->orWhereRaw('LOWER(ea.program) LIKE ?', [$like]);
                            }
                        });
                })
                ->orWhereExists(function ($sub) use ($normalized) {
                    $sub->from('exam_application as ea2')
                        ->select(DB::raw(1))
                        ->whereColumn('ea2.student_id', 'u.student_number')
                        ->where(function ($w) use ($normalized) {
                            foreach ($normalized as $i => $np) {
                                $like = '%'.$np.'%';
                                $i === 0 ? $w->whereRaw('LOWER(ea2.program) LIKE ?', [$like])
                                         : $w->orWhereRaw('LOWER(ea2.program) LIKE ?', [$like]);
                            }
                        });
                })
                ->orWhere(function ($w) use ($normalized) {
                    $w->whereNotNull('u.program')->where(function ($w2) use ($normalized) {
                        foreach ($normalized as $i => $np) {
                            $like = '%'.$np.'%';
                            $i === 0 ? $w2->whereRaw('LOWER(u.program) LIKE ?', [$like])
                                     : $w2->orWhereRaw('LOWER(u.program) LIKE ?', [$like]);
                        }
                    });
                });
            })
            ->selectRaw("
                p.payment_id as id,
                u.first_name, u.middle_name, u.last_name, u.email, u.school_id, u.student_number,
                u.program,
                COALESCE(p.or_number) as reference,
                COALESCE(p.amount_paid) as amount,
                COALESCE(p.payment_date, p.created_at) as submitted_at,
                p.status, p.remarks, p.receipt_image as proof_url
            ")
            ->orderByDesc('p.payment_id')
            ->get();

        $pending  = $payments->where('status', 'pending')->values()->all();
        $approved = $payments->where('status', 'approved')->values()->all();
        $rejected = $payments->where('status', 'rejected')->values()->all();

        return Inertia::render('coordinator/compre-payment/Index', [
            'programs' => $programs,
            'pending'  => $pending,
            'approved' => $approved,
            'rejected' => $rejected,
            'counts'   => [
                'pending'  => count($pending),
                'approved' => count($approved),
                'rejected' => count($rejected),
            ],
        ]);
    }

    public function approve(Request $request, int $id)
    {
        $user = $request->user();
        // if (method_exists($user, 'isCoordinator') && ! $user->isCoordinator()) abort(403);

        $row = PaymentSubmission::where('payment_id', $id)
            ->where('payment_type', 'exam')
            ->firstOrFail();

        $row->status = 'approved';
        $row->remarks = null;
        $row->checked_by = $user->id;
        $row->checked_at = Carbon::now();
        $row->save();

        return back()->with('success', 'Payment approved.');
    }

    public function reject(Request $request, int $id)
    {
        $user = $request->user();
        // if (method_exists($user, 'isCoordinator') && ! $user->isCoordinator()) abort(403);

        $data = $request->validate([
            'remarks' => ['required','string','min:3','max:500'],
        ]);

        $row = PaymentSubmission::where('payment_id', $id)
            ->where('payment_type', 'exam')
            ->firstOrFail();

        $row->status = 'rejected';
        $row->remarks = $data['remarks'];
        $row->checked_by = $user->id;
        $row->checked_at = Carbon::now();
        $row->save();

        return back()->with('success', 'Payment rejected.');
    }

    public function bulkApprove(Request $request)
    {
        $user = $request->user();
        $ids = (array) $request->input('ids', []);
        if (! count($ids)) return back();

        DB::table('payment_submissions')
            ->whereIn('payment_id', $ids)
            ->where('payment_type', 'exam')
            ->update([
                'status' => 'approved',
                'remarks' => null,
                'checked_by' => $user->id,
                'checked_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

        return back()->with('success', 'Selected payments approved.');
    }

    public function bulkReject(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'ids'     => ['required','array','min:1'],
            'ids.*'   => ['integer'],
            'remarks' => ['required','string','min:3','max:500'],
        ]);

        DB::table('payment_submissions')
            ->whereIn('payment_id', $data['ids'])
            ->where('payment_type', 'exam')
            ->update([
                'status' => 'rejected',
                'remarks' => $data['remarks'],
                'checked_by' => $user->id,
                'checked_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

        return back()->with('success', 'Selected payments rejected.');
    }
}