<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Panelist;
use App\Models\PaymentRate;
use App\Models\DefenseRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Helpers\ProgramLevel;

class PanelistController extends Controller
{
    public function index()
    {
        return response()->json(Panelist::all());
    }

    public function store(Request $request)
    {
        $panelist = Panelist::create($request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:panelists,email',
            'role' => 'required|in:Chairperson,Panel Member',
            'status' => 'required|in:Assigned,Not Assigned',
        ]));

        return redirect()->route('panelists.view');
    }

    public function show($id)
    {
        return response()->json(Panelist::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $panelist = Panelist::findOrFail($id);
        $panelist->update($request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:panelists,email,' . $id,
            'role' => 'required|in:Chairperson,Panel Member',
            'status' => 'required|in:Assigned,Not Assigned',
        ]));

        return redirect()->route('panelists.view');
    }

    public function destroy($id)
    {
        Panelist::findOrFail($id)->delete();
        return redirect()->route('panelists.view');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);
        Panelist::whereIn('id', $request->ids)->delete();
        return redirect()->route('panelists.view');
    }

    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
            'status' => 'required|in:Assigned,Not Assigned',
        ]);
        Panelist::whereIn('id', $request->ids)->update([
            'status' => $request->status,
        ]);
        return redirect()->route('panelists.view');
    }

    public function view()
    {
        // Preload and normalize rates (case-insensitive, normalized defense_type)
        $rates = PaymentRate::all()->map(function ($r) {
            return [
                'program_level' => strtolower(trim($r->program_level)), // masteral | doctorate
                'type'          => strtolower(trim($r->type)),          // chairperson | panel member
                'defense_type'  => strtolower($this->normalizeDefenseType($r->defense_type)), // proposal | prefinal | final
                'amount'        => is_numeric($r->amount) ? (float) $r->amount : $r->amount,
            ];
        });

        $panelists = Panelist::orderBy('name')->get()->map(function ($panelist) use ($rates) {
            $panelistName = strtolower(trim($panelist->name));
            $panelistId   = $panelist->id;

            // Find defenses where this panelist is chair or member (support id or stored name)
            $defenses = DefenseRequest::where(function ($q) use ($panelistId, $panelistName) {
                $fields = ['defense_chairperson','defense_panelist1','defense_panelist2','defense_panelist3','defense_panelist4'];
                foreach ($fields as $field) {
                    $q->orWhere(function ($qq) use ($field, $panelistId, $panelistName) {
                        $qq->where($field, $panelistId)
                           ->orWhereRaw("LOWER(CAST($field as CHAR)) = ?", [$panelistName]);
                    });
                }
            })->get([
                'id','program','defense_type','thesis_title',
                'defense_chairperson','defense_panelist1','defense_panelist2','defense_panelist3','defense_panelist4'
            ]);

            $assignmentDetails = [];

            foreach ($defenses as $d) {
                // Determine role for this panelist
                $role = null;
                if (
                    $d->defense_chairperson == $panelistId ||
                    (is_string($d->defense_chairperson) && strtolower(trim($d->defense_chairperson)) === $panelistName)
                ) {
                    $role = 'Chairperson';
                } else {
                    foreach (['defense_panelist1','defense_panelist2','defense_panelist3','defense_panelist4'] as $field) {
                        if ($d->$field == $panelistId || (is_string($d->$field) && strtolower(trim($d->$field)) === $panelistName)) {
                            $role = 'Panel Member';
                            break;
                        }
                    }
                }

                if (!$role) {
                    continue;
                }

                // Classify program to Masteral/Doctorate (same concept as AA uses)
                $programLevel = ProgramLevel::getLevel((string) $d->program);

                // Normalize defense type (Proposal | Prefinal | Final)
                $dtypeNorm = $this->normalizeDefenseType($d->defense_type);

                // Case-insensitive match in preloaded rates
                $key_pl = strtolower(trim($programLevel));
                $key_ty = strtolower(trim($role));
                $key_dt = strtolower($dtypeNorm);

                $rate = collect($rates)->first(function ($r) use ($key_pl, $key_ty, $key_dt) {
                    return $r['program_level'] === $key_pl
                        && $r['type'] === $key_ty
                        && $r['defense_type'] === $key_dt;
                });

                $assignmentDetails[] = [
                    'id'            => $d->id,
                    'defense_type'  => $d->defense_type,
                    'thesis_title'  => $d->thesis_title,
                    'role'          => $role,
                    'type'          => $role,          // aligns with PaymentRate.type
                    'program_level' => $programLevel,  // aligns with PaymentRate.program_level
                    'receivable'    => $rate ? $rate['amount'] : null, // computed expected amount
                ];
            }

            $assignmentDetails = collect($assignmentDetails)
                ->unique(fn ($a) => $a['id'].'-'.$a['role'])
                ->values();

            return [
                ...$panelist->toArray(),
                'assignments' => $assignmentDetails,
                'status'      => $assignmentDetails->isEmpty() ? 'Not Assigned' : 'Assigned',
            ];
        })->values();

        return Inertia::render('coordinator/panelists/index', [
            'panelists'     => $panelists,
            // optional to pass for client fallback
            'paymentRates'  => PaymentRate::all()->values(),
        ]);
    }

    private function normalizeDefenseType($dt)
    {
        if (!$dt) return '';
        $s = strtolower(preg_replace('/[\s-]+/', '', (string) $dt));
        if (str_contains($s, 'prefinal')) return 'Prefinal';
        if (str_contains($s, 'proposal')) return 'Proposal';
        // ensure 'final' check does not override 'prefinal'
        if (str_contains($s, 'final')) return 'Final';
        return (string) $dt;
    }

    // Kept for other endpoints used elsewhere
    public function allCombined()
    {
        $faculty = User::whereIn('role',['Faculty','Adviser'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn($f)=>[
                'id' => 'faculty-'.$f->id,
                'name' => trim($f->first_name.' '.($f->middle_name? $f->middle_name.' ':'').$f->last_name),
                'email'=> $f->email,
                'type' => 'Faculty'
            ]);

        $panelists = Panelist::orderBy('name')
            ->get()
            ->map(fn($p)=>[
                'id' => 'panelist-'.$p->id,
                'name' => $p->name,
                'email'=> $p->email,
                'type' => 'Panelist'
            ]);

        return response()->json($faculty->concat($panelists)->values());
    }
}