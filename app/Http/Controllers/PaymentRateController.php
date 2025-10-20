<?php

namespace App\Http\Controllers;

use App\Models\PaymentRate;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
        // Implement if needed.
        return response()->json(['ok' => true]);
    }

    public function data()
    {
        $rates = PaymentRate::all()->map(function ($r) {
            return [
                'program_level' => $r->program_level,
                'type' => $r->type,
                'defense_type' => $r->defense_type,
                'amount' => (float) $r->amount, // cast to number for the client
            ];
        })->values();

        return response()->json([
            'rates' => $rates,
        ]);
    }
}
