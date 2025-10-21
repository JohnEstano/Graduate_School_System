<?php

namespace App\Http\Controllers;

use App\Models\PanelistHonorariumSpec;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PanelistHonorariumSpecController extends Controller
{
    public function index()
    {
        $specs = PanelistHonorariumSpec::all();
        return Inertia::render('coordinator/panelists/honorarium-specs', [
            'specs' => $specs,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'specs' => 'required|array',
            'specs.*.role' => 'required|in:Chairperson,Panel Member',
            'specs.*.defense_type' => 'required|in:Proposal,Prefinal,Final',
            'specs.*.amount' => 'required|numeric|min:0',
        ]);
        foreach ($data['specs'] as $spec) {
            PanelistHonorariumSpec::updateOrCreate(
                ['role' => $spec['role'], 'defense_type' => $spec['defense_type']],
                ['amount' => $spec['amount']]
            );
        }
        // Return updated specs as JSON
        return response()->json([
            'success' => true,
            'honorariumSpecs' => PanelistHonorariumSpec::all(),
            'message' => 'Honorarium rates updated.'
        ]);
    }
}
