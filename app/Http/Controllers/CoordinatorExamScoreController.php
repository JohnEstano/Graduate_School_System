<?php

namespace App\Http\Controllers;

use App\Models\ExamApplication;
use App\Models\ExamApplicationSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CoordinatorExamScoreController extends Controller
{
    /**
     * Return subjects (with existing scores) for a given application.
     */
    public function subjects(Request $request, $application)
    {
        try {
            $appId = is_numeric($application) ? (int) $application : null;
            if (!$appId) {
                return response()->json(['message' => 'Invalid application id'], 400);
            }
            if (!Schema::hasTable('exam_application_subject')) {
                return response()->json([]);
            }

            // Determine primary key column name (id vs subject_id)
            $pk = Schema::hasColumn('exam_application_subject', 'id')
                ? 'id'
                : (Schema::hasColumn('exam_application_subject', 'subject_id') ? 'subject_id' : null);
            if ($pk === null) {
                return response()->json(['message' => 'Primary key not found'], 500);
            }

            // Determine subject name column (subject_name vs subject)
            $subjectCol = Schema::hasColumn('exam_application_subject', 'subject_name')
                ? 'subject_name'
                : (Schema::hasColumn('exam_application_subject', 'subject') ? 'subject' : null);

            $q = DB::table('exam_application_subject')->where('application_id', $appId)->orderBy($pk);
            // Always alias PK as id for the UI
            $q->selectRaw($pk.' as id');
            if ($subjectCol) $q->addSelect(DB::raw($subjectCol.' as subject_name'));
            if (Schema::hasColumn('exam_application_subject', 'score')) $q->addSelect('score');
            if (Schema::hasColumn('exam_application_subject', 'status')) $q->addSelect('status');
            if (Schema::hasColumn('exam_application_subject', 'remarks')) $q->addSelect('remarks');

            $rows = $q->get();
            return response()->json($rows);
        } catch (\Throwable $e) {
            \Log::error('Failed to load exam subjects', [
                'application_id' => $application ?? null,
                'error' => $e->getMessage(),
            ]);
            $payload = ['message' => 'Failed to load subjects'];
            if (app()->environment('local')) {
                $payload['error'] = $e->getMessage();
            }
            return response()->json($payload, 500);
        }
    }

    /**
     * Save scores for subjects and mark application failed when average ≤ 74 (only when all scores are present).
     */
    public function save(Request $request, $application)
    {
        try {
            $app = ExamApplication::where('application_id', $application)->first();
            if (!$app) {
                return response()->json(['message' => 'Application not found'], 404);
            }
            $data = $request->validate([
                'scores' => ['required','array','min:1'],
                'scores.*.id' => ['required','integer'],
                'scores.*.score' => ['nullable','integer','min:0','max:100'],
            ]);

            // Determine primary key name for exam_application_subject
            $pk = Schema::hasColumn('exam_application_subject', 'id')
                ? 'id'
                : (Schema::hasColumn('exam_application_subject', 'subject_id') ? 'subject_id' : null);
            if ($pk === null) {
                return response()->json(['message' => 'Primary key not found'], 500);
            }

            $subjectIds = collect($data['scores'])->pluck('id')->all();

            // Minimal fetch of existing subjects by PK; alias PK as id to match payload
            $subjects = DB::table('exam_application_subject')
                ->where('application_id', $app->application_id)
                ->whereIn($pk, $subjectIds)
                ->selectRaw($pk.' as id')
                ->get();

            $incoming = collect($data['scores'])->keyBy('id');

            $hasSubjectStatus = Schema::hasColumn('exam_application_subject', 'status');
            $hasSubjectScore = Schema::hasColumn('exam_application_subject', 'score');
            $hasAvg = Schema::hasColumn('exam_application', 'average_score');
            $hasResult = Schema::hasColumn('exam_application', 'result_status');
            $hasFinalApproval = Schema::hasColumn('exam_application', 'final_approval_status');

            DB::transaction(function () use ($subjects, $incoming, $pk, $app, $hasSubjectStatus, $hasSubjectScore, $hasAvg, $hasResult, $hasFinalApproval) {
                foreach ($subjects as $subj) {
                    $row = $incoming->get($subj->id);
                    if (! $row) continue;
                    $score = $row['score'];
                    $update = [];
                    if ($hasSubjectScore) {
                        $update['score'] = $score;
                    }
                    if ($score !== null && $hasSubjectStatus) {
                        $update['status'] = $score <= 74 ? 'failed' : 'passed';
                    }
                    if (!empty($update)) {
                        DB::table('exam_application_subject')->where($pk, $subj->id)->update($update);
                    }
                }

                // Recompute application outcome if all subjects have a score
                if ($hasSubjectScore && ($hasAvg || $hasResult || $hasFinalApproval)) {
                    $allScores = DB::table('exam_application_subject')
                        ->where('application_id', $app->application_id)
                        ->pluck('score');
                    $scores = $allScores->filter(fn($v) => $v !== null)->values();
                    if ($scores->count() === $allScores->count() && $scores->count() > 0) {
                        $avg = (int) floor($scores->avg());
                        $result = $avg <= 74 ? 'failed' : 'passed';
                        $updates = [];
                        if ($hasAvg) $updates['average_score'] = $avg;
                        if ($hasResult) $updates['result_status'] = $result;
                        if ($result === 'failed' && $hasFinalApproval) {
                            $updates['final_approval_status'] = 'rejected';
                        }
                        if (!empty($updates)) {
                            DB::table('exam_application')
                                ->where('application_id', $app->application_id)
                                ->update($updates);
                        }
                    } else {
                        $updates = [];
                        if ($hasAvg) $updates['average_score'] = null;
                        if ($hasResult) $updates['result_status'] = null;
                        if (!empty($updates)) {
                            DB::table('exam_application')
                                ->where('application_id', $app->application_id)
                                ->update($updates);
                        }
                    }
                }
            });

            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            \Log::error('Failed to save exam scores', [
                'application_id' => $application ?? null,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
            ]);
            $payload = ['message' => 'Failed to save scores'];
            if (app()->environment('local')) {
                $payload['error'] = $e->getMessage();
            }
            return response()->json($payload, 500);
        }
    }
}
