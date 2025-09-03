<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\{LegacyCredential, LegacyRecordCache, DataAccessAudit};
use Throwable;

class LegacyPortalClient
{
    public function login(string $username, string $password): array
    {
        $config = config('legacy');
        $base = $config['base_url'];
        $params = array_merge($config['login_params'], [
            'username' => $username,
            'password' => $password,
        ]);

        // Prefetch login page to obtain baseline cookies (CFID/CFTOKEN)
        try {
            $prefetch = Http::withHeaders([
                'User-Agent' => $config['user_agent'],
                'Accept' => 'text/html,application/xhtml+xml',
            ])->withOptions([
                'allow_redirects' => true,
                'timeout' => $config['timeout'],
            ])->get($base . '/index.cfm?fa=login.login_show');
            $baseCookies = $this->normalizeCookies($prefetch->cookies());
        } catch (\Throwable $e) {
            $baseCookies = [];
        }

        $cookieHeaderBase = $this->buildCookieHeader($baseCookies);

        $response = Http::withHeaders([
            'User-Agent' => $config['user_agent'],
            'Accept' => 'application/json, text/plain, */*',
            'Accept-Language' => 'en-GB,en;q=0.9',
            'Referer' => $base . '/index.cfm?fa=login.login_show',
            'Cookie' => $cookieHeaderBase,
        ])->withOptions([
            'allow_redirects' => false,
            'connect_timeout' => $config['timeout'],
            'timeout' => $config['timeout'],
        ])->get($base . $config['login_path'], $params);

        if (!$response->ok()) {
            Log::warning('Legacy login non-OK', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException('Legacy login HTTP error: ' . $response->status());
        }

        $json = json_decode($response->body(), true);
        if (!is_array($json) || !isset($json['result_id'])) {
            Log::warning('Legacy login unexpected body', ['body' => $response->body()]);
            throw new \RuntimeException('Unexpected legacy login response.');
        }
        if ((int)$json['result_id'] !== 1) {
            Log::warning('Legacy login failed result_id', ['result_id' => $json['result_id'], 'body' => $json]);
            throw new \RuntimeException('Legacy authentication failed.');
        }

        // Merge cookies (baseline + login response)
    $loginCookies = $this->normalizeCookies($response->cookies());
    $merged = array_merge($baseCookies, $loginCookies);
    $cookieHeader = $this->buildCookieHeader($merged);
        return [
            'cookies' => $merged,
            'cookie_header' => $cookieHeader,
            'raw' => $json,
        ];
    }

    public function fetchGrades(array $session, int $userId): array
    {
        // Placeholder fetch until endpoint clarified
        // Would reuse session cookies to GET grades path and parse HTML into structured array.
        return [];
    }

    /**
     * Fetch the academic records page HTML by manually following the redirect chain:
     * 1. academic_record.student_academic_record_index -> 302 secure.redirect_view_student_academic_records&student_id=...
     * 2. secure.redirect_view_student_academic_records -> 302 academic_record.view_student_academic_records (sets STUDENT_ID cookie)
     * 3. academic_record.view_student_academic_records -> 200 HTML
     * NOTE: The final HTML uses Angular placeholders ({{info.code}}) so actual records likely load via an XHR endpoint.
     */
    public function fetchAcademicRecordsHtml(array $session): string
    {
        $config = config('legacy');
        $base = $config['base_url'];

        // Build initial cookie header from login response cookies
        $cookieHeader = $this->buildCookieHeader($session['cookies'] ?? []);

        $firstUrl = $base . '/index.cfm?fa=academic_record.student_academic_record_index';
        $first = Http::withHeaders([
            'User-Agent' => $config['user_agent'],
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Cookie' => $cookieHeader,
        ])->withOptions([
            'allow_redirects' => false,
            'timeout' => $config['timeout'],
        ])->get($firstUrl);

        if ($first->status() !== 302) {
            throw new \RuntimeException('Unexpected first redirect status: ' . $first->status());
        }
        $secondLocation = $first->header('Location');
        $this->mergeSetCookies($cookieHeader, $first);

        $second = Http::withHeaders([
            'User-Agent' => $config['user_agent'],
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Cookie' => $cookieHeader,
        ])->withOptions([
            'allow_redirects' => false,
            'timeout' => $config['timeout'],
        ])->get($base . $secondLocation);

        if ($second->status() !== 302) {
            throw new \RuntimeException('Unexpected second redirect status: ' . $second->status());
        }
        $thirdLocation = $second->header('Location');
        $this->mergeSetCookies($cookieHeader, $second); // capture STUDENT_ID

        $final = Http::withHeaders([
            'User-Agent' => $config['user_agent'],
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Cookie' => $cookieHeader,
        ])->withOptions([
            'allow_redirects' => false,
            'timeout' => $config['timeout'],
        ])->get($base . $thirdLocation);

        if (!$final->ok()) {
            throw new \RuntimeException('Final academic records fetch failed: ' . $final->status());
        }

        return $final->body();
    }

    /**
     * Parse academic records HTML into structured data.
     * Returns: [student => [...], semesters => [...], current_semester_id, records => [...], gwa => string|null]
     */
    public function parseAcademicRecords(string $html): array
    {
        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($html);
        libxml_clear_errors();
        $xpath = new \DOMXPath($dom);

        $student = [
            'student_number' => null,
            'name' => null,
            'program' => null,
        ];
        // Student info block
        $h6Nodes = $xpath->query('//div[h6[contains(text(),"Student Number")]]//h6 | //h6');
        foreach ($h6Nodes as $node) {
            $text = trim($node->textContent);
            if (stripos($text, 'Student Number:') !== false) {
                $student['student_number'] = trim(preg_replace('/^.*?:/','',$text));
            } elseif (stripos($text, 'Name:') !== false) {
                $student['name'] = trim(preg_replace('/^.*?:/','',$text));
            } elseif (stripos($text, 'Degree Program:') !== false) {
                $student['program'] = trim(preg_replace('/^.*?:/','',$text));
            }
        }

        // Semesters select options
        $semesters = [];
        $currentSemesterId = null;
        $opts = $xpath->query('//select[@id="semester_select"]/option');
        foreach ($opts as $opt) {
            if ($opt instanceof \DOMElement) {
                $id = $opt->getAttribute('value');
            } else {
                continue;
            }
            if ($id === '') continue;
            $label = trim($opt->textContent);
            $selected = $opt instanceof \DOMElement ? $opt->hasAttribute('selected') : false;
            $semesters[] = [
                'id' => $id,
                'label' => $label,
                'selected' => $selected,
            ];
            if ($selected) {
                $currentSemesterId = $id;
            }
        }

        // Course rows (Angular placeholders may not be resolved server-side). We attempt to pull static placeholders as template.
        $records = [];
        $rows = $xpath->query('//div[contains(@class, "row-table-default-body")]//div[contains(@class, "row row-small") and .//div[contains(@class, "col s4")]]');
        foreach ($rows as $r) {
            $cols = $xpath->query('.//div[contains(@class, "col ")]', $r);
            if ($cols->length < 7) continue;
            $courseRaw = trim($cols->item(0)->textContent); // e.g. {{info.code}} | {{info.title}}
            $unitType = trim($cols->item(1)->textContent); // {{info.duration_unit}} / {{info.course_type}}
            $prelim = trim($cols->item(2)->textContent);
            $midterm = trim($cols->item(3)->textContent);
            $finals = trim($cols->item(4)->textContent);
            $rating = trim($cols->item(5)->textContent);
            $section = trim($cols->item(6)->textContent);
            $records[] = [
                'course' => $courseRaw,
                'unit_type' => $unitType,
                'prelim' => $prelim,
                'midterm' => $midterm,
                'finals' => $finals,
                'rating' => $rating,
                'section' => $section,
            ];
        }

        // GWA extraction
        $gwa = null;
        $gwaNode = $xpath->query('//h6[contains(.,"General Weighted Average")]')->item(0);
        if ($gwaNode) {
            if (preg_match('/GWA:\s*([0-9.]+)/', $gwaNode->textContent, $m)) {
                $gwa = $m[1];
            }
        }

        return [
            'student' => $student,
            'semesters' => $semesters,
            'current_semester_id' => $currentSemesterId,
            'records' => $records,
            'gwa' => $gwa,
            'raw_record_count' => count($records),
        ];
    }

    /**
     * Extract initialization params from inline JS: InitializeStudentAcademicRecords('501','746709','4','10')
     * Returns [semester_id, student_id, educational_level_id, role_id] or null
     */
    public function extractAcademicInitParams(string $html): ?array
    {
        // Allow arbitrary whitespace after commas and around params
        $pattern = "/InitializeStudentAcademicRecords\(\s*'([0-9]+)'\s*,\s*'([0-9]+)'\s*,\s*'([0-9]+)'\s*,\s*'([0-9]+)'\s*\)/";
        if (preg_match($pattern, $html, $m)) {
            return [
                'semester_id' => $m[1],
                'student_id' => $m[2],
                'educational_level_id' => $m[3],
                'role_id' => $m[4],
            ];
        }
        // Fallback: try double quotes pattern
        $pattern2 = "/InitializeStudentAcademicRecords\(\s*\"([0-9]+)\"\s*,\s*\"([0-9]+)\"\s*,\s*\"([0-9]+)\"\s*,\s*\"([0-9]+)\"\s*\)/";
        if (preg_match($pattern2, $html, $m)) {
            return [
                'semester_id' => $m[1],
                'student_id' => $m[2],
                'educational_level_id' => $m[3],
                'role_id' => $m[4],
            ];
        }
        Log::warning('Legacy academic init params not found');
        return null;
    }

    /**
     * Fetch real academic record JSON array from legacy endpoint using session cookies.
     */
    public function fetchAcademicRecordJson(array $session, string $studentId, string $educationalLevelId, string $semesterId): array
    {
        $config = config('legacy');
        $base = $config['base_url'];
        $cookieHeader = $session['cookie_header'] ?? $this->buildCookieHeader($session['cookies'] ?? []);
        $query = http_build_query([
            'fa' => 'academic_record.json_get_student_academic_record',
            'educational_level_id' => $educationalLevelId,
            'semester_id' => $semesterId,
            'student_id' => $studentId,
        ]);
        $url = $base . '/index.cfm?' . $query;
        $resp = \Illuminate\Support\Facades\Http::withHeaders([
            'User-Agent' => $config['user_agent'],
            'Accept' => 'application/json, text/plain, */*',
            'Referer' => $base . '/index.cfm?fa=academic_record.view_student_academic_records',
            'Cookie' => $cookieHeader,
        ])->withOptions([
            'timeout' => $config['timeout'],
            'allow_redirects' => false,
        ])->get($url);
        if (!$resp->ok()) {
            throw new \RuntimeException('Academic JSON fetch HTTP status ' . $resp->status());
        }
        $data = json_decode($resp->body(), true);
        if (!is_array($data)) {
            throw new \RuntimeException('Academic JSON decode failed');
        }
        return $data;
    }

    /**
     * Normalize a raw academic record row returned by legacy JSON into UI-friendly shape.
     */
    public function normalizeAcademicRecordRow(array $r): array
    {
        return [
            'code' => $r['code'] ?? null,
            'title' => $r['title'] ?? null,
            'units' => $r['duration_unit'] ?? null,
            'course_type' => $r['course_type'] ?? null,
            'prelim' => $r['first_column'] ?? null,
            'midterm' => $r['second_column'] ?? null,
            'finals' => $r['third_column'] ?? null,
            'average' => $r['average'] ?? ($r['average_var'] ?? null),
            'average_var' => $r['average_var'] ?? null,
            'units_earned' => $r['units_earned'] ?? null,
            'section' => $r['section_name'] ?? null,
            'current_balance' => $r['current_balance'] ?? null,
            'rating_show' => $r['rating_show'] ?? null,
        ];
    }

    /**
     * Build a cookie header string from an array of Symfony cookie objects or associative array.
     */
    protected function buildCookieHeader($cookies): string
    {
        $pairs = [];
        if (is_array($cookies)) {
            foreach ($cookies as $cookie) {
                if (is_object($cookie) && method_exists($cookie, 'getName')) {
                    $pairs[] = $cookie->getName() . '=' . $cookie->getValue();
                } elseif (is_array($cookie) && isset($cookie['Name'], $cookie['Value'])) {
                    $pairs[] = $cookie['Name'] . '=' . $cookie['Value'];
                }
            }
        }
        return implode('; ', $pairs);
    }

    /**
     * Normalize various cookie return types (CookieJar|array) into a simple array
     * of either Symfony Cookie objects or ['Name'=>..., 'Value'=>...] arrays.
     */
    protected function normalizeCookies($cookies): array
    {
        // Guzzle CookieJar has toArray()
        if (is_object($cookies) && method_exists($cookies, 'toArray')) {
            try {
                return $cookies->toArray();
            } catch (\Throwable $e) {
                return [];
            }
        }
        return is_array($cookies) ? $cookies : [];
    }

    /**
     * Parse Set-Cookie headers from response and append new cookies to header string.
     */
    protected function mergeSetCookies(string &$cookieHeader, $response): void
    {
        try {
            $headers = $response->headers();
            $set = $headers['Set-Cookie'] ?? [];
            if (is_string($set)) {
                $set = [$set];
            }
            $existing = [];
            if ($cookieHeader !== '') {
                foreach (explode('; ', $cookieHeader) as $p) {
                    [$n, $v] = array_pad(explode('=', $p, 2), 2, '');
                    $existing[$n] = $v;
                }
            }
            foreach ($set as $line) {
                $parts = explode(';', $line);
                if (count($parts) > 0) {
                    [$n, $v] = array_pad(explode('=', trim($parts[0]), 2), 2, '');
                    if ($n !== '') {
                        $existing[$n] = $v;
                    }
                }
            }
            $pairs = [];
            foreach ($existing as $n => $v) {
                $pairs[] = $n . '=' . $v;
            }
            $cookieHeader = implode('; ', $pairs);
        } catch (\Throwable $e) {
            Log::warning('mergeSetCookies failed: ' . $e->getMessage());
        }
    }

    public function recordAudit(?int $userId, string $action, string $status = 'success', array $meta = []): void
    {
        try {
            DataAccessAudit::create([
                'user_id' => $userId,
                'action' => $action,
                'status' => $status,
                'meta' => $meta,
                'occurred_at' => Carbon::now(),
            ]);
        } catch (Throwable $e) {
            Log::warning('Audit insert failed: ' . $e->getMessage());
        }
    }

    /**
     * Fetch legacy home/index page HTML after successful login.
     */
    public function fetchHomeHtml(array $session): string
    {
        $config = config('legacy');
        $base = $config['base_url'];
        $cookieHeader = $session['cookie_header'] ?? $this->buildCookieHeader($session['cookies'] ?? []);
        $path = '/index.cfm?fa=home.index';
        $attempts = 0; $max = 5;
        while ($attempts < $max) {
            $attempts++;
            $resp = Http::withHeaders([
                'User-Agent' => $config['user_agent'],
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Cookie' => $cookieHeader,
            ])->withOptions([
                'timeout' => $config['timeout'],
                'allow_redirects' => false,
            ])->get($base . $path);

            // 200 OK
            if ($resp->ok()) {
                return $resp->body();
            }
            // Follow redirect
            if (in_array($resp->status(), [301,302,303,307,308])) {
                $loc = $resp->header('Location');
                if (!$loc) {
                    break;
                }
                // Merge any new cookies
                $this->mergeSetCookies($cookieHeader, $resp);
                // If location is absolute remove base
                if (str_starts_with($loc, 'http')) {
                    if (str_starts_with($loc, $base)) {
                        $loc = substr($loc, strlen($base));
                    } else {
                        // External redirect not expected
                        break;
                    }
                }
                $path = $loc;
                continue;
            }
            break; // unexpected status
        }
        throw new \RuntimeException('Fetch home failed after redirects');
    }

    /**
     * Extract structured name parts from home page HTML.
     */
    public function extractStudentName(string $html): ?array
    {
        if (!preg_match('/<span class="white-text name medium-text">([^<]+)<\/span>/', $html, $m)) {
            return null;
        }
        $raw = trim(html_entity_decode($m[1])); // e.g. AMONCIO, JASMINE REI Poliquit
        if (!str_contains($raw, ',')) {
            return null;
        }
        [$last, $rest] = array_map('trim', explode(',', $raw, 2));
        $tokens = preg_split('/\s+/', $rest);
        $first = ''; $middle = null;
        if (count($tokens) > 1) {
            $middle = array_pop($tokens);
            $first = implode(' ', $tokens);
        } else {
            $first = $tokens[0] ?? '';
        }
        // Normalize capitalization (keep last upper as-is if already uppercase)
        $firstNorm = ucwords(strtolower($first));
        $middleNorm = $middle ? ucwords(strtolower($middle)) : null;
        $lastNorm = strtoupper($last);
        return [
            'first_name' => $firstNorm,
            'middle_name' => $middleNorm,
            'last_name' => $lastNorm,
        ];
    }
}
