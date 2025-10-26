<?php

namespace App\Http\Controllers\AA;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AaPaymentVerification;
use App\Models\AaPaymentBatch;
use App\Models\DefenseRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Response;

class PaymentVerificationController extends Controller
{
    // List all verifications assigned to the current AA
    public function index()
    {
        $verifications = AaPaymentVerification::with('defenseRequest')
            ->where('assigned_to', Auth::id())
            ->get();

        return view('administrative-assistant.payment-verification', compact('verifications'));
    }

    // Update status (verify/reject)
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,ready_for_finance,in_progress,paid,completed',
            'remarks' => 'nullable|string',
        ]);

        $verification = AaPaymentVerification::findOrFail($id);

        // Only allow the assigned AA to update
        if ($verification->assigned_to && $verification->assigned_to != Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $verification->status = $request->input('status');
        $verification->remarks = $request->input('remarks');
        $verification->save();

        return response()->json(['success' => true, 'status' => $verification->status]);
    }

    // Update AA verification status by defense request ID
    public function updateStatusByDefenseRequest(Request $request, $defenseRequestId)
    {
        $request->validate([
            'status' => 'required|in:pending,ready_for_finance,in_progress,paid,completed',
            'remarks' => 'nullable|string',
        ]);

        $defenseRequest = DefenseRequest::findOrFail($defenseRequestId);
        
        // Get or create AA verification record
        $verification = AaPaymentVerification::firstOrCreate(
            ['defense_request_id' => $defenseRequestId],
            [
                'assigned_to' => Auth::id(),
                'status' => 'pending',
            ]
        );

        // Update status
        $verification->status = $request->input('status');
        $verification->remarks = $request->input('remarks');
        $verification->assigned_to = Auth::id(); // Ensure current user is assigned
        $verification->save();

        return response()->json([
            'success' => true, 
            'status' => $verification->status,
            'aa_verification_id' => $verification->id
        ]);
    }

    // Add to batch
    public function addToBatch(Request $request)
    {
        $batch = AaPaymentBatch::create([
            'name' => $request->input('name'),
            'created_by' => Auth::id(),
            'status' => 'pending',
        ]);

        AaPaymentVerification::whereIn('id', $request->input('verification_ids', []))
            ->update(['batch_id' => $batch->id]);

        return back()->with('success', 'Batch created and requests added.');
    }

    // Export batch to CSV
    public function exportBatch($batchId)
    {
        $batch = AaPaymentBatch::with('verifications.defenseRequest')->findOrFail($batchId);

        $csv = "ID,Defense Request,Status,Remarks\n";
        foreach ($batch->verifications as $v) {
            $csv .= "{$v->id},{$v->defenseRequest->id},{$v->status},\"{$v->remarks}\"\n";
        }

        return Response::make($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=batch_{$batch->id}.csv",
        ]);
    }

    // Bulk update status
    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'verification_ids' => 'required|array',
            'verification_ids.*' => 'integer|exists:aa_payment_verifications,id',
            'status' => 'required|in:pending,ready_for_finance,in_progress,paid,completed',
        ]);

        $updated = AaPaymentVerification::whereIn('id', $request->verification_ids)
            ->update(['status' => $request->status]);

        return response()->json(['success' => true, 'updated_count' => $updated]);
    }
}
