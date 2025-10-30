<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExamApplication;
use App\Models\ExamRegistrarReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;

class ComprehensiveExamEligibilityV2Controller extends Controller
{
    public function status(Request $request)
    {
        $open = (bool) (config('app.env') !== 'production' ? true : env('COMPRE_EXAM_OPEN', true));
        return response()->json(['open' => $open, 'isOpen' => $open]);
    }

    public function eligibility(Request $request)
    {
        $wantDebug = config('app.env') !== 'production' && ($request->boolean('debug') || $request->query('debug') === '1');
        $studentNumber = trim((string)($request->query('student_number') ?? ''));
        $applicationId = $request->query('application_id');

        if ($studentNumber === '') {
            $loginSn = (string) (Session::get('login_student_number') ?? Session::get('login_identifier') ?? '');
            if ($loginSn !== '') $studentNumber = $loginSn;
        }

        // If registrar passes application_id, use it to resolve the student's number when missing
        $app = null;
        if ($applicationId) {
            $app = ExamApplication::query()->where('application_id', $applicationId)->first();
            if ($app && $studentNumber === '') {
                $studentNumber = (string) ($app->student_id ?? '');
            }
        }

        $base = rtrim((string) env('UIC_API_URL', 'https://api.uic.edu.ph/api/v2'), '/');
        // Use consistent header casing as in login call; some gateways are strict about header keys
        $token = (string) (Session::get('token') ?? '');
        $headers = [
            'X-API-CLIENT-ID'     => (string) env('UIC_API_CLIENT_ID', ''),
            'X-API-CLIENT-SECRET' => (string) env('UIC_API_CLIENT_SECRET', ''),
            'Accept'              => 'application/json',
            'Content-Type'        => 'application/json',
        ];
        if ($token !== '') {
            $headers['Authorization'] = 'Bearer ' . $token;
        }

        $httpGet = fn(string $url) => Http::withHeaders($headers)->acceptJson()->get($url);
        $httpPost = fn(string $url) => Http::withHeaders($headers)->acceptJson()->post($url, []);
        $tryGet = function (string $path) use ($base, $httpGet) {
            $url = $base . $path;
            try { $res = $httpGet($url); if ($res) return $res; } catch (\Throwable $e) { $res = null; }
            if (str_starts_with($url, 'https://')) {
                $alt = 'http://' . substr($url, 8);
                try { $res = $httpGet($alt); if ($res) return $res; } catch (\Throwable $e) {}
            }
            return null;
        };
        $tryPost = function (string $path) use ($base, $httpPost) {
            $url = $base . $path;
            try { $res = $httpPost($url); if ($res) return $res; } catch (\Throwable $e) { $res = null; }
            if (str_starts_with($url, 'https://')) {
                $alt = 'http://' . substr($url, 8);
                try { $res = $httpPost($alt); if ($res) return $res; } catch (\Throwable $e) {}
            }
            return null;
        };

        $parseClearance = function ($payload) {
            if ($payload === null) return null;
            // If boolean directly
            if (is_bool($payload)) return $payload;
            // If scalar truthy/falsy
            if (!is_array($payload)) {
                $b = filter_var($payload, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($b !== null) return $b;
            }
            $p = $payload;
            // Dive into data if present
            if (isset($p['data'])) {
                $d = $p['data'];
                if (is_bool($d)) return $d;
                if (is_array($d)) $p = array_merge($p, $d);
            }
            // Also dive into 'clearance' object if present
            if (isset($p['clearance']) && is_array($p['clearance'])) {
                $p = array_merge($p, $p['clearance']);
            }
            $candidatesTrue = ['cleared','isCleared','is_cleared','ok','success','no_outstanding_balance','noOutstandingBalance','complete','completed','result'];
            foreach ($candidatesTrue as $k) {
                if (array_key_exists($k, $p)) {
                    $v = $p[$k];
                    // Some APIs return status/result as string like 'Cleared'/'Not Cleared'
                    if (is_string($v)) {
                        $vs = strtolower(trim($v));
                        if (in_array($vs, ['cleared','clear','ok','success','passed','true','1'])) return true;
                        if (in_array($vs, ['not cleared','uncleared','failed','false','0'])) return false;
                    }
                    if (is_bool($v)) return $v;
                    $b = filter_var($v, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    if ($b !== null) return $b;
                }
            }
            // Negative form: has_outstanding_balance
            $candidatesNegative = ['has_outstanding_balance','hasOutstandingBalance','outstanding_balance','has_balance'];
            foreach ($candidatesNegative as $k) {
                if (array_key_exists($k, $p)) {
                    $v = $p[$k];
                    if (is_bool($v)) return !$v; // invert negative
                    $b = filter_var($v, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    if ($b !== null) return !$b; // invert negative
                }
            }
            return null;
        };

        $gradesComplete = null;
        $noOutstandingBalance = null;
        $classSchedules = null;
        $debug = [
            'hadToken' => $token !== '',
            'gradesStatus' => null,
            'tuitionStatus' => null,
            'schedulesStatus' => null,
            'studentNumber' => $studentNumber,
        ];
        if ($studentNumber !== '') {
            // Grades clearance: GET then POST fallback
            $gj = null; $grPath = '/students-portal/students/' . urlencode($studentNumber) . '/clearance/grades';
            $gr = $tryGet($grPath);
            if (!$gr) $gr = $tryPost('/students-portal/students/' . urlencode($studentNumber) . '/clearance/grades');
            if ($gr) { $debug['gradesStatus'] = $gr->status(); $gj = $gr->json(); }
            $gradesComplete = $parseClearance($gj);

            // Tuition clearance: GET then POST fallback; invert negative keys
            $tj = null; $trPath = '/students-portal/students/' . urlencode($studentNumber) . '/clearance/tuition';
            $tr = $tryGet($trPath);
            if (!$tr) $tr = $tryPost('/students-portal/students/' . urlencode($studentNumber) . '/clearance/tuition');
            if ($tr) { $debug['tuitionStatus'] = $tr->status(); $tj = $tr->json(); }
            $noOutstandingBalance = $parseClearance($tj);
            
            if ($gr) {
                \Log::debug('Grades API JSON:', ['url' => $base . $grPath, 'json' => $gr->json()]);
            }

            if ($tr) {
                \Log::debug('Tuition API JSON:', ['url' => $base . $trPath, 'json' => $tr->json()]);
            }

            // Schedules (optional)
            $srPath = '/students-portal/class-schedules/' . urlencode($studentNumber);
            $sr = $tryGet($srPath);
            if ($sr) { $debug['schedulesStatus'] = $sr->status(); $classSchedules = $sr->json(); }

            if ($wantDebug) {
                $debug['rawGrades'] = $gj;
                $debug['rawTuition'] = $tj;
                $debug['gradesUrl'] = $base . $grPath;
                $debug['tuitionUrl'] = $base . $trPath;
                $debug['schedulesUrl'] = $base . $srPath;
            }
        }

        $documentsComplete = null;
        if (!$app && $studentNumber !== '') {
            $app = ExamApplication::query()->where('student_id', $studentNumber)->latest('created_at')->first();
        }
        if ($app) {
            $rev = ExamRegistrarReview::query()
                ->where('exam_application_id', $app->application_id)
                ->orderByDesc(DB::raw('COALESCE(created_at, id)'))
                ->first();
            if ($rev) {
                $documentsComplete = (bool)$rev->documents_complete;
                if ($gradesComplete === null) $gradesComplete = (bool)$rev->grades_complete;
            }
        }

        $resp = [
            'gradesComplete' => $gradesComplete,
            'documentsComplete' => $documentsComplete,
            'noOutstandingBalance' => $noOutstandingBalance,
            'requirements' => [
                [ 'name' => 'Complete grades (registrar verified)', 'completed' => $gradesComplete ],
                [ 'name' => 'Complete documents submitted', 'completed' => $documentsComplete ],
                [ 'name' => 'No outstanding tuition balance', 'completed' => $noOutstandingBalance ],
            ],
        ];
        if ($wantDebug) {
            $resp['debug'] = $debug;
        }
        if ($classSchedules !== null) $resp['classSchedules'] = $classSchedules;
        return response()->json($resp);
    }
}
