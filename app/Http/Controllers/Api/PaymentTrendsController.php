<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DefenseRequest;
use App\Models\PaymentRecord;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PaymentTrendsController extends Controller
{
    public function getPaymentTrends(Request $request)
    {
        $range = $request->query('range', 'week');
        
        // Determine date range
        $startDate = match($range) {
            'week' => Carbon::now()->subDays(7),
            'month' => Carbon::now()->subDays(30),
            'year' => Carbon::now()->subMonths(12),
            default => Carbon::now()->subDays(7),
        };
        
        $endDate = Carbon::now();
        
        // Get payment data from completed defense requests
        $defensePayments = DefenseRequest::whereBetween('scheduled_date', [$startDate, $endDate])
            ->whereNotNull('scheduled_date')
            ->whereNotNull('amount')
            ->where('workflow_state', 'completed')
            ->select(
                DB::raw('DATE(scheduled_date) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->keyBy('date');
        
        // Format data for charting
        $chartData = [];
        
        if ($range === 'year') {
            // Group by month for yearly view
            $monthlyData = [];
            foreach ($defensePayments as $entry) {
                $month = Carbon::parse($entry->date)->format('Y-m');
                if (!isset($monthlyData[$month])) {
                    $monthlyData[$month] = [
                        'date' => Carbon::parse($entry->date)->startOfMonth()->format('Y-m-d'),
                        'count' => 0,
                        'total' => 0,
                    ];
                }
                $monthlyData[$month]['count'] += $entry->count ?? 0;
                $monthlyData[$month]['total'] += floatval($entry->total ?? 0);
            }
            
            // Fill in missing months
            $current = Carbon::parse($startDate)->startOfMonth();
            while ($current <= $endDate) {
                $monthKey = $current->format('Y-m');
                $dateKey = $current->format('Y-m-d');
                
                if (isset($monthlyData[$monthKey])) {
                    $chartData[] = $monthlyData[$monthKey];
                } else {
                    $chartData[] = [
                        'date' => $dateKey,
                        'count' => 0,
                        'total' => 0,
                    ];
                }
                
                $current->addMonth();
            }
        } else {
            // Daily view for week and month
            $current = Carbon::parse($startDate)->startOfDay();
            while ($current <= $endDate) {
                $dateKey = $current->format('Y-m-d');
                
                if (isset($defensePayments[$dateKey])) {
                    $entry = $defensePayments[$dateKey];
                    $chartData[] = [
                        'date' => $dateKey,
                        'count' => $entry->count ?? 0,
                        'total' => floatval($entry->total ?? 0),
                    ];
                } else {
                    $chartData[] = [
                        'date' => $dateKey,
                        'count' => 0,
                        'total' => 0,
                    ];
                }
                
                $current->addDay();
            }
        }
        
        return response()->json($chartData);
    }
}
