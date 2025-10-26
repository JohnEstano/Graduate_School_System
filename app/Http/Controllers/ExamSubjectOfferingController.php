<?php
// filepath: c:\GSURS\Graduate_School_System-1\app\Http\Controllers\ExamSubjectOfferingController.php
// ...existing code...
namespace App\Http\Controllers;

use App\Models\ExamSubjectOffering;
use App\Models\CoordinatorProgram;
use Database\Seeders\CoordinatorProgramSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ExamSubjectOfferingController extends Controller
{
    /** Return the coordinator's allowed programs (DB first, then seed fallback) */
    private function allowedPrograms(Request $request): array
    {
        $user = $request->user();
        if (!$user) return [];

        $db = CoordinatorProgram::query()
            ->where('coordinator_id', $user->id)
            ->orderBy('program')
            ->pluck('program')
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (!empty($db)) return $db;

        // Fallback to seed mapping by email (useful in dev)
        $seed = CoordinatorProgramSeeder::getProgramsByEmail((string) $user->email);
        return array_values(array_unique(array_filter($seed)));
    }

    // Inertia page
    public function page(Request $request)
    {
        $programs = $this->allowedPrograms($request);

        // optional: provide SY options
        $year = (int) now()->year;
        $from = now()->month >= 6 ? $year : $year - 1;
        $schoolYears = [];
        for ($i = 0; $i < 6; $i++) {
            $f = $from - $i;
            $schoolYears[] = "{$f}-" . ($f + 1);
        }

        return Inertia::render('coordinator/compre-exam-schedule/Index', [
            'programs' => $programs,
            'currentProgram' => $programs[0] ?? null,
            'schoolYears' => $schoolYears,
        ]);
    }

    // JSON API
    public function index(Request $request)
    {
        $allowed = $this->allowedPrograms($request);
        $program = (string) $request->query('program', '');
        $sy = (string) $request->query('school_year', '');

        if ($program !== '' && !in_array($program, $allowed, true)) {
            abort(403, 'Not allowed for this program.');
        }

        $rows = ExamSubjectOffering::query()
            ->when($program !== '', fn($q) => $q->where('program', $program))
            ->when($program === '' && !empty($allowed), fn($q) => $q->whereIn('program', $allowed))
            ->when($sy !== '', fn($q) => $q->where('school_year', $sy))
            ->orderBy('subject_name')
            ->get([
                'id','program','school_year','subject_code','subject_name',
                'exam_date','start_time','end_time','venue','is_active'
            ]);

        return response()->json($rows);
    }

    public function store(Request $request)
    {
        $allowed = $this->allowedPrograms($request);

        $data = $request->validate([
            'program'      => ['required','string','max:255'],
            'school_year'  => ['required','regex:/^\d{4}-\d{4}$/'],
            'subject_code' => ['nullable','string','max:50'],
            'subject_name' => ['required','string','max:255'],
            'exam_date'    => ['nullable','date'],
            'start_time'   => ['nullable','date_format:H:i'],
            'end_time'     => ['nullable','date_format:H:i'],
            'venue'        => ['nullable','string','max:255'],
            'is_active'    => ['boolean'],
        ]);

        if (!in_array($data['program'], $allowed, true)) {
            abort(403, 'Not allowed for this program.');
        }

        $offering = ExamSubjectOffering::create($data + ['is_active' => $request->boolean('is_active', true)]);
        if ($request->expectsJson()) {
            return response()->json(['id' => $offering->id], 201);
       }
        return back()->with('success', 'Offering created.');
    }

    public function update(Request $request, ExamSubjectOffering $offering)
    {
        $allowed = $this->allowedPrograms($request);

        // Ensure both the existing record and the target program are allowed
        if (!in_array($offering->program, $allowed, true)) {
            abort(403, 'Not allowed for this program.');
        }

        $data = $request->validate([
            'program'      => ['required','string','max:255'],
            'school_year'  => ['required','regex:/^\d{4}-\d{4}$/'],
            'subject_code' => ['nullable','string','max:50'],
            'subject_name' => ['required','string','max:255'],
            'exam_date'    => ['nullable','date'],
            'start_time'   => ['nullable','date_format:H:i'],
            'end_time'     => ['nullable','date_format:H:i'],
            'venue'        => ['nullable','string','max:255'],
            'is_active'    => ['boolean'],
        ]);

        if (!in_array($data['program'], $allowed, true)) {
            abort(403, 'Not allowed for this program.');
        }

        $offering->update($data + ['is_active' => $request->boolean('is_active', true)]);
        
        if ($request->expectsJson()) {
            return response()->noContent(); // 204
        }

        return back()->with('success', 'Offering updated.');
    }

    public function destroy(Request $request, ExamSubjectOffering $offering)
    {
        $allowed = $this->allowedPrograms($request);
        if (!in_array($offering->program, $allowed, true)) {
            abort(403, 'Not allowed for this program.');
        }

        $offering->delete();

        if ($request->expectsJson()) {
            return response()->noContent();
        }

        return back()->with('success', 'Offering deleted.');
    }
}