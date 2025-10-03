<?php 

namespace App\Http\Controllers;

use App\Models\ProgramRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HonorariumSummaryController extends Controller
{
    public function index(Request $request)
    {
        $records = ProgramRecord::query()
            ->when($request->year, fn($q) => $q->whereYear('date_edited', $request->year))
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->search, fn($q) => $q->where('name', 'like', '%'.$request->search.'%'))
            ->orderBy('date_edited', 'desc')
            ->get();

        return Inertia::render('honorarium/honorarium-summary/Index', [
            'records' => $records
        ]);
    }

    public function download(ProgramRecord $record)
    {
        $filename = $record->name . '_payments.csv';

        // Example static data (replace with DB relation later if needed)
        $payments = [
            [
                'school_year' => '2024-2025',
                'payment_date' => '2025-05-12',
                'defense_status' => 'Completed',
                'amount' => '₱450.00',
            ]
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function () use ($payments) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['School Year', 'Payment Date', 'Defense Status', 'Amount']);

            foreach ($payments as $payment) {
                fputcsv($handle, [
                    $payment['school_year'],
                    $payment['payment_date'],
                    $payment['defense_status'],
                    $payment['amount'],
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
