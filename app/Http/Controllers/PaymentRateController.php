<?php

namespace App\Http\Controllers;

use App\Models\PaymentRate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class PaymentRateController extends Controller
{
    public function index()
    {
        $rates = PaymentRate::all();
        return Inertia::render('dean/payment-rates/Index', [
            'rates' => $rates,
        ]);
    }

    public function update(Request $request)
    {
        \Log::info('PaymentRateController@update called', ['payload' => $request->all()]);
        $data = $request->validate([
            'rates' => 'required|array',
            'rates.*.program_level' => 'required
            |in:Masteral,Doctorate',
            'rates.*.type' => 'required|string',
            'rates.*.defense_type' => 'required|in:Proposal,Pre-final,Final',
            'rates.*.amount' => 'required|numeric|min:0|max:99999999.99', // <--- add max
        ]);
        \Log::info('Validation passed', ['data' => $data]);
        foreach ($data['rates'] as $rate) {
            PaymentRate::updateOrCreate(
                [
                    'program_level' => $rate['program_level'],
                    'type' => $rate['type'],
                    'defense_type' => $rate['defense_type'],
                ],
                ['amount' => $rate['amount']]
            );
        }
        return response()->json(['success' => true]);
    }

    public function data()
    {
        return response()->json([
            'rates' => PaymentRate::all(),
        ]);
    }
}
