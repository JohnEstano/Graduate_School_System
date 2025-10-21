<?php

namespace App\Http\Controllers;

use App\Models\PaymentRate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        // Accept payload as { rates: [...] } or { rows: [...] } or raw array body
        $payload = $request->input('rates');
        if ($payload === null) {
            $payload = $request->input('rows', null);
        }
        if ($payload === null) {
            $payload = $request->input('items', null);
        }
        if ($payload === null) {
            $all = $request->all();
            if (is_array($all) && isset($all[0]) && is_array($all[0])) {
                $payload = $all;
            }
        }

        $validated = validator(
            ['rates' => $payload],
            [
                'rates' => ['required', 'array', 'min:1'],
                'rates.*.program_level' => ['required', 'string'],
                'rates.*.type' => ['required', 'string'],
                'rates.*.defense_type' => ['required', 'string'],
                'rates.*.amount' => ['required', 'numeric', 'min:0'],
            ]
        )->validate();

        $rates = $validated['rates'];

        DB::transaction(function () use ($rates) {
            // Upsert each incoming row ONLY; do not delete others
            foreach ($rates as $r) {
                PaymentRate::updateOrCreate(
                    [
                        'program_level' => $r['program_level'],
                        'type' => $r['type'],
                        'defense_type' => $r['defense_type'],
                    ],
                    [
                        'amount' => (float) $r['amount'],
                    ]
                );
            }
        });

        // Return "success" so the frontend refetches and updates without manual refresh
        return response()->json([
            'success' => true,
            // optionally include latest rates if you want to skip the follow-up fetch:
            // 'rates' => PaymentRate::all()->map(fn($r) => [
            //     'program_level' => $r->program_level,
            //     'type' => $r->type,
            //     'defense_type' => $r->defense_type,
            //     'amount' => (float) $r->amount,
            // ])->values(),
        ]);
    }

    public function data()
    {
        $rates = PaymentRate::all()->map(function ($r) {
            return [
                'program_level' => $r->program_level,
                'type' => $r->type,
                'defense_type' => $r->defense_type,
                'amount' => (float) $r->amount, // ensure numeric on client
            ];
        })->values();

        return response()->json([
            'rates' => $rates,
        ]);
    }
}
