<?php
// filepath: c:\GSPS\Graduate_School_System\app\Http\Controllers\PaymentSubmissionController.php
namespace App\Http\Controllers;

use App\Models\PaymentSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PaymentSubmissionController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Accept either school_id or user id stored into exam_application.student_id
        $ids = array_values(array_filter([$user->school_id, $user->id], fn($v) => filled($v)));

        $hasApp = DB::table('exam_application')
            ->whereIn('student_id', $ids)
            ->exists();

        $payment = PaymentSubmission::where('student_id', $user->id)
            ->where('payment_type', 'exam')
            ->orderByDesc('payment_id')
            ->first();

        return Inertia::render('payment/Index', [
            'student' => [
                'name' => trim($user->first_name.' '.($user->middle_name ? $user->middle_name.' ' : '').$user->last_name),
                'program' => $user->program ?? null,
                'email' => $user->email ?? null,
            ],
            'canSubmit' => $hasApp, // allow submit after application exists
            'payment' => $payment ? [
                'payment_id' => $payment->payment_id,
                'or_number' => $payment->or_number,
                'payment_date' => optional($payment->payment_date)->toDateString(),
                'receipt_image' => $payment->receipt_image,
                'status' => $payment->status,
                'remarks' => $payment->remarks,
                'amount_paid' => $payment->amount_paid,
                'created_at' => optional($payment->created_at)->format('Y-m-d H:i:s'),
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        // Must have an application first (school_id or id in exam_application.student_id)
        $ids = array_values(array_filter([$user->school_id, $user->id], fn($v) => filled($v)));
        $hasApp = DB::table('exam_application')
            ->whereIn('student_id', $ids)
            ->exists();

        if (! $hasApp) {
            return back()->withErrors([
                'form' => 'You can only submit payment after submitting your comprehensive application.',
            ])->withInput();
        }

        // Existing record?
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
}