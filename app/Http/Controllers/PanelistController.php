<?php


namespace App\Http\Controllers;

use App\Models\Panelist;
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
            'status' => 'required|in:Available,Not Available',
            'date_available' => 'nullable|date',
        ]));

        // Return updated panelists list for Inertia
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
            'status' => 'required|in:Available,Not Available',
            'date_available' => 'nullable|date',
        ]));

        // Return updated panelists list for Inertia
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
            'status' => 'required|in:Available,Not Available',
        ]);
        Panelist::whereIn('id', $request->ids)->update([
            'status' => $request->status,
        ]);
        return redirect()->route('panelists.view');
    }

    public function view()
    {
        $panelists = Panelist::all();
        return Inertia::render('coordinator/panelists/index', [
            'panelists' => $panelists,
        ]);
    }
}