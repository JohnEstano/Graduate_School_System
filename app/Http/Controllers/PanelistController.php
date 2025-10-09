<?php


namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Panelist;
use App\Models\PanelistHonorariumSpec;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
        // Return updated panelists list for Inertia
        return redirect()->route('panelists.view');
    }

    // Bulk delete
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);
        Panelist::whereIn('id', $request->ids)->delete();
        return redirect()->route('panelists.view');
    }

    // Bulk status update
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
        $honorariumSpecs = \App\Models\PanelistHonorariumSpec::all()->keyBy(function($s) {
            return $s->role . '-' . $s->defense_type;
        });

        $panelists = Panelist::all()->map(function($panelist) use ($honorariumSpecs) {
            $panelistName = strtolower(trim($panelist->name));
            $panelistId = $panelist->id;

            // Find all defense requests where this panelist is assigned by ID or by name (case-insensitive)
            $assignments = \App\Models\DefenseRequest::where(function($q) use ($panelistId, $panelistName) {
                $fields = [
                    'defense_chairperson',
                    'defense_panelist1',
                    'defense_panelist2',
                    'defense_panelist3',
                    'defense_panelist4',
                ];
                foreach ($fields as $field) {
                    $q->orWhere(function($qq) use ($field, $panelistId, $panelistName) {
                        $qq->where(function($q3) use ($field, $panelistId) {
                            $q3->where($field, $panelistId);
                        })->orWhereRaw("LOWER($field) = ?", [$panelistName]);
                    });
                }
            })->get([
                'id', 'defense_type', 'thesis_title',
                'defense_chairperson', 'defense_panelist1', 'defense_panelist2', 'defense_panelist3', 'defense_panelist4'
            ]);

            // For each assignment, check each role field and push an assignment for each match
            $assignmentDetails = [];
            foreach ($assignments as $a) {
                $foundRole = null;
                // Check for Chairperson first
                if (
                    $a->defense_chairperson == $panelistId ||
                    (is_string($a->defense_chairperson) && strtolower(trim($a->defense_chairperson)) === $panelistName)
                ) {
                    $foundRole = 'Chairperson';
                } else {
                    // Check all panel member fields
                    foreach (['defense_panelist1', 'defense_panelist2', 'defense_panelist3', 'defense_panelist4'] as $field) {
                        if (
                            $a->$field == $panelistId ||
                            (is_string($a->$field) && strtolower(trim($a->$field)) === $panelistName)
                        ) {
                            $foundRole = 'Panel Member';
                            break;
                        }
                    }
                }
                if ($foundRole) {
                    $key = $foundRole . '-' . $a->defense_type;
                    $amount = isset($honorariumSpecs[$key]) ? $honorariumSpecs[$key]->amount : null;
                    $assignmentDetails[] = [
                        'id' => $a->id,
                        'defense_type' => $a->defense_type,
                        'thesis_title' => $a->thesis_title,
                        'role' => $foundRole,
                        'receivable' => $amount,
                    ];
                }
            }

            // Remove duplicates (in case of data issues)
            $assignmentDetails = collect($assignmentDetails)
                ->unique(fn($a) => $a['id'] . '-' . $a['role'])
                ->values();

            // If no assignments, show default honorarium for each defense type
            if ($assignmentDetails->isEmpty()) {
                $defaultReceivables = [];
                foreach (['Proposal', 'Prefinal', 'Final'] as $dtype) {
                    $key = $panelist->role . '-' . $dtype;
                    $amount = $honorariumSpecs[$key]->amount ?? null;
                    $defaultReceivables[] = [
                        'defense_type' => $dtype,
                        'role' => '-',
                        'receivable' => $amount,
                        'thesis_title' => null,
                    ];
                }
                return [
                    ...$panelist->toArray(),
                    'assignments' => [],
                    'default_receivables' => $defaultReceivables,
                    'status' => 'Not Assigned',
                ];
            } else {
                return [
                    ...$panelist->toArray(),
                    'assignments' => $assignmentDetails,
                    'default_receivables' => [],
                    'status' => 'Assigned',
                ];
            }
        });

        $honorariumSpecs = \App\Models\PanelistHonorariumSpec::all();

        return Inertia::render('coordinator/panelists/index', [
            'panelists' => $panelists,
            'honorariumSpecs' => $honorariumSpecs,
        ]);
    }

    public function allCombined()
    {
        // (Optional) auth()->check() guard; keep simple
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

    // Add this method
    public function count()
    {
        return response()->json([
            'count' => \App\Models\Panelist::count()
        ]);
    }

    public function saveHonorariumSpecs(Request $request)
    {
        $specs = $request->input('specs', []);
        foreach ($specs as $spec) {
            \App\Models\PanelistHonorariumSpec::updateOrCreate(
                [
                    'role' => $spec['role'],
                    'defense_type' => $spec['defense_type'],
                ],
                [
                    'amount' => $spec['amount'],
                ]
            );
        }
        return redirect()->route('panelists.view');
    }
}