<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
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

    /**
     * Coordinator / staff login (same as student but kept separate for future divergence & logging).
     */
    public function loginCoordinator(string $username, string $password): array
    {
        // Currently identical to login(); can add role-specific verification later.
        return $this->login($username, $password);
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

    /**
     * Parse coordinator/staff role title from home page HTML.
     * Looks for <span class="white-text">Academic Coordinator</span> etc.
     */
    public function extractCoordinatorRole(string $html): ?string
    {
        if (preg_match('/<span class="white-text">([^<]+Coordinator[^<]*)<\/span>/', $html, $m)) {
            return trim(html_entity_decode($m[1]));
        }
        // Fallback search for common role words inside white-text spans.
        if (preg_match('/<span class="white-text">([^<]*(Dean|Chair|Coordinator)[^<]*)<\/span>/i', $html, $m2)) {
            return trim(html_entity_decode($m2[1]));
        }
        return null;
    }

    /**
     * Extract any staff role (Coordinator, Faculty, Dean, Chair, etc.) from white-text span.
     * Returns ['role' => canonical, 'title' => original].
     */
    public function extractStaffRole(string $html): ?array
    {
        if (!preg_match_all('/<span class="white-text">([^<]+)<\/span>/', $html, $matches)) {
            return null;
        }
        $candidates = array_map(fn($t) => trim(html_entity_decode($t)), $matches[1]);
        $priority = ['Coordinator' => 'Coordinator', 'Academic Coordinator' => 'Coordinator', 'Faculty' => 'Faculty', 'Dean' => 'Dean', 'Chair' => 'Chair'];
        foreach ($candidates as $c) {
            foreach ($priority as $needle => $canonical) {
                if (stripos($c, $needle) !== false) {
                    return ['role' => $canonical, 'title' => $c];
                }
            }
        }
        return null;
    }

    /**
     * Extract coordinator/staff full name parts from home page (different span class).
     */
    public function extractCoordinatorNameParts(string $html): ?array
    {
        if (!preg_match('/<span class="white-text name all-caps">([^<]+)<\/span>/', $html, $m)) {
            return null;
        }
        $raw = trim(html_entity_decode($m[1]));
        if (!str_contains($raw, ',')) return null;
        [$last, $rest] = array_map('trim', explode(',', $raw, 2));
        $tokens = preg_split('/\s+/', $rest);
        $first = array_shift($tokens) ?? '';
        $middle = $tokens ? implode(' ', $tokens) : null;
        return [
            'first_name' => ucwords(strtolower($first)),
            'middle_name' => $middle ? ucwords(strtolower($middle)) : null,
            'last_name' => ucwords(strtolower($last)),
        ];
    }

    /**
     * Fetch Enrollment Statistics page HTML (coordinator accessible menu) for background stats.
     */
    public function fetchEnrollmentStatisticsHtml(array $session): ?string
    {
        $config = config('legacy');
        $base = $config['base_url'];
        $cookieHeader = $session['cookie_header'] ?? $this->buildCookieHeader($session['cookies'] ?? []);
        try {
            $resp = Http::withHeaders([
                'User-Agent' => $config['user_agent'],
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Cookie' => $cookieHeader,
            ])->withOptions([
                'timeout' => $config['timeout'],
                'allow_redirects' => true,
            ])->get($base . '/index.cfm?fa=report.enrollment_statistics');
            if ($resp->ok()) return $resp->body();
        } catch (\Throwable $e) {
            Log::debug('fetchEnrollmentStatisticsHtml error: '.$e->getMessage());
        }
        return null;
    }

    /**
     * Naive parser to extract simple numeric aggregates from enrollment stats HTML.
     */
    public function parseEnrollmentStats(?string $html): array
    {
        if (!$html) return [];
        $stats = [];
        // Example: capture numbers inside <h5> or <td>
        if (preg_match_all('/>([0-9]{2,})</', $html, $m)) {
            $numbers = array_map('intval', $m[1]);
            if ($numbers) {
                $stats['numbers_sample'] = array_slice($numbers, 0, 10);
                $stats['numbers_count'] = count($numbers);
            }
        }
        $stats['html_length'] = strlen($html);
        return $stats;
    }

    /**
     * Fetch instructor class list page HTML (faculty dashboard).
     */
    public function fetchInstructorClassListHtml(array $session): ?string
    {
        $config = config('legacy');
        $base = $config['base_url'];
        $cookieHeader = $session['cookie_header'] ?? $this->buildCookieHeader($session['cookies'] ?? []);
        try {
            $resp = Http::withHeaders([
                'User-Agent' => $config['user_agent'],
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Cookie' => $cookieHeader,
                'Referer' => $base . '/index.cfm?fa=home.index',
            ])->withOptions([
                'timeout' => $config['timeout'],
                'allow_redirects' => true,
            ])->get($base . '/index.cfm?fa=class.class_list');
            if ($resp->ok()) return $resp->body();
        } catch (\Throwable $e) {
            Log::debug('fetchInstructorClassListHtml error: '.$e->getMessage());
        }
        return null;
    }

    /**
     * Parse instructor class list HTML into array of rows.
     * Each row: number, course_code, course_title, type, size, load, section.
     */
    public function parseInstructorClassList(?string $html): array
    {
        if (!$html) return ['rows' => [], 'periods' => [], 'selected_period_id' => null, 'short_period_label' => null];
        $rows = [];
        $periods = [];
        $selectedId = null;
        try {
            $dom = new \DOMDocument();
            libxml_use_internal_errors(true);
            $dom->loadHTML($html);
            libxml_clear_errors();
            $xpath = new \DOMXPath($dom);
            // Period select options
            $optNodes = $xpath->query('//select[@id="period_id"]/option');
            foreach ($optNodes as $opt) {
                if (!$opt instanceof \DOMElement) continue;
                $val = $opt->getAttribute('value');
                if ($val === '0') continue; // placeholder
                $label = trim($opt->textContent);
                $isSel = $opt->hasAttribute('selected');
                if ($isSel) $selectedId = $val;
                $periods[] = [
                    'id' => $val,
                    'label' => $label,
                    'selected' => $isSel,
                    'short_label' => $this->shortenPeriodLabel($label),
                ];
            }
            // Target table header with "Instructor class list result"
            $tableNodes = $xpath->query('//table[.//td[contains(normalize-space(.), "Instructor class list result")]]');
            if ($tableNodes->length > 0) {
                $table = $tableNodes->item(0);
                $trNodes = $xpath->query('.//tr[td]', $table);
                foreach ($trNodes as $tr) {
                    $tds = $xpath->query('./td', $tr);
                    if ($tds->length === 8) {
                        $firstCell = trim($tds->item(0)->textContent);
                        // Match patterns like "1.)" or "2.)" or plain numbers
                        if (!preg_match('/^(\d+)/', $firstCell, $m)) continue; // skip header / info row
                        $num = (int)$m[1];
                        $actionsCell = $tds->item(7);
                        $anchors = [];
                        if ($actionsCell instanceof \DOMElement) {
                            // Query only direct descendant anchors to avoid unrelated links
                            $anchorNodeList = $xpath->query('.//a', $actionsCell);
                            if ($anchorNodeList) {
                                foreach ($anchorNodeList as $aNode) {
                                    if ($aNode instanceof \DOMElement) $anchors[] = $aNode;
                                }
                            }
                        }
                        $classId = null; $printListUrl = null; $permitDuesUrl = null;
                        if (!empty($anchors)) {
                            foreach ($anchors as $a) {
                                /** @var \DOMElement $a */
                                $href = $a->getAttribute('href');
                                if (preg_match('/class_id=(\d+)/', $href, $cm)) {
                                    $classId = $classId ?? $cm[1];
                                }
                                if (strpos($href, 'instructor_class_list_report_show') !== false) {
                                    $printListUrl = $href;
                                } elseif (strpos($href, 'instructor_class_sfr_dues_report_show') !== false) {
                                    $permitDuesUrl = $href;
                                }
                            }
                        }
                        $rows[] = [
                            'number' => $num,
                            'course_code' => trim($tds->item(1)->textContent),
                            'course_title' => trim($tds->item(2)->textContent),
                            'type' => trim($tds->item(3)->textContent),
                            'size' => trim($tds->item(4)->textContent),
                            'load' => trim($tds->item(5)->textContent),
                            'section' => trim($tds->item(6)->textContent),
                            'class_id' => $classId,
                            'print_list_url' => $printListUrl,
                            'print_permit_dues_url' => $permitDuesUrl,
                        ];
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::debug('parseInstructorClassList error: '.$e->getMessage());
        }
        $short = null;
        if ($selectedId) {
            foreach ($periods as $p) {
                if ($p['id'] === $selectedId) { $short = $p['short_label']; break; }
            }
        }
        return [
            'rows' => $rows,
            'periods' => $periods,
            'selected_period_id' => $selectedId,
            'short_period_label' => $short,
        ];
    }

    protected function shortenPeriodLabel(string $label): string
    {
        // Map verbose labels to short academic style; placeholder year logic.
        if (stripos($label, 'First Semester') === 0) return '1st Year - First Sem ' . substr($label, -9);
        if (stripos($label, 'Second Semester') === 0) return '1st Year - Second Sem ' . substr($label, -9);
        if (stripos($label, 'Summer') === 0) return 'Summer Term ' . preg_replace('/^[^0-9]+/', '', $label);
        return $label;
    }

    /**
     * Fetch student class schedule page HTML.
     */
    public function fetchStudentClassScheduleHtml(array $session): ?string
    {
        $config = config('legacy');
        $base = $config['base_url'];
        $cookieHeader = $session['cookie_header'] ?? $this->buildCookieHeader($session['cookies'] ?? []);
        try {
            $resp = Http::withHeaders([
                'User-Agent' => $config['user_agent'],
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Cookie' => $cookieHeader,
                'Referer' => $base . '/index.cfm?fa=home.index',
            ])->withOptions([
                'timeout' => $config['timeout'],
                'allow_redirects' => true,
            ])->get($base . '/index.cfm?fa=schedule.my_class_schedule_index');
            if ($resp->ok()) return $resp->body();
        } catch (\Throwable $e) {
            Log::debug('fetchStudentClassScheduleHtml error: '.$e->getMessage());
        }
        return null;
    }

    /**
     * Set student class schedule period (PERIOD_ID cookie) using secure endpoint similar to faculty.
     */
    public function setStudentClassSchedulePeriod(array &$session, string $periodId): bool
    {
        $config = config('legacy');
        $base = $config['base_url'];
        $cookieHeader = $session['cookie_header'] ?? $this->buildCookieHeader($session['cookies'] ?? []);
        try {
            $resp = Http::withHeaders([
                'User-Agent' => $config['user_agent'],
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Cookie' => $cookieHeader,
                'Referer' => $base . '/index.cfm?fa=schedule.my_class_schedule_index',
            ])->withOptions([
                'timeout' => $config['timeout'],
                'allow_redirects' => false,
            ])->get($base . '/index.cfm?fa=secure.set_my_class_schedule_period_id&period_id=' . urlencode($periodId));
            if (in_array($resp->status(), [302,301])) {
                $this->mergeSetCookies($cookieHeader, $resp);
                $session['cookie_header'] = $cookieHeader;
                return true;
            }
        } catch (\Throwable $e) {
            Log::debug('setStudentClassSchedulePeriod error: '.$e->getMessage());
        }
        return false;
    }

    /**
     * Parse student class schedule to collect instructor names and period options.
     * Returns ['instructors'=>[], 'periods'=>[], 'selected_period_id'=>?string]
     */
    public function parseStudentClassSchedule(?string $html): array
    {
        if (!$html) return ['instructors' => [], 'periods' => [], 'selected_period_id' => null];
        $instructors = [];
        $periods = [];
        $selectedId = null;
        try {
            $dom = new \DOMDocument();
            libxml_use_internal_errors(true);
            $dom->loadHTML($html);
            libxml_clear_errors();
            $xpath = new \DOMXPath($dom);
            // Period select
            $opts = $xpath->query('//select[@id="period_id"]/option');
            foreach ($opts as $opt) {
                if (!$opt instanceof \DOMElement) continue;
                $val = $opt->getAttribute('value');
                if ($val === '0') continue;
                $label = trim($opt->textContent);
                $sel = $opt->hasAttribute('selected');
                if ($sel) $selectedId = $val;
                $periods[] = [
                    'id' => $val,
                    'label' => $label,
                    'selected' => $sel,
                ];
            }
            // Instructors table: look for header containing 'instructor'
            $rows = $xpath->query('//table//tr');
            foreach ($rows as $tr) {
                $cells = $xpath->query('./td', $tr);
                if ($cells->length >= 7) { // instructor column likely last
                    $lastCell = trim($cells->item($cells->length - 1)->textContent);
                    if ($lastCell && stripos($lastCell, 'No records') === false) {
                        // Basic heuristic: names have a comma (LAST, FIRST) or space
                        if (preg_match('/[A-Za-z]/', $lastCell)) {
                            $instructors[] = preg_replace('/\s+/', ' ', $lastCell);
                        }
                    }
                }
            }
            $instructors = array_values(array_unique($instructors));
        } catch (\Throwable $e) {
            Log::debug('parseStudentClassSchedule error: '.$e->getMessage());
        }
        return [
            'instructors' => $instructors,
            'periods' => $periods,
            'selected_period_id' => $selectedId,
        ];
    }

    /**
     * Set class list period in legacy system (updates server session) then return updated HTML.
     */
    public function setInstructorClassListPeriod(array &$session, string $periodId): ?string
    {
        $config = config('legacy');
        $base = $config['base_url'];
        $cookieHeader = $session['cookie_header'] ?? $this->buildCookieHeader($session['cookies'] ?? []);
        try {
            // We disable redirects so we can capture the Set-Cookie (PERIOD_ID) on the 302 response.
            $resp = Http::withHeaders([
                'User-Agent' => $config['user_agent'],
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Cookie' => $cookieHeader,
                'Referer' => $base . '/index.cfm?fa=class.class_list',
            ])->withOptions([
                'timeout' => $config['timeout'],
                'allow_redirects' => false,
            ])->get($base . '/index.cfm?fa=secure.set_class_list_period&period_id=' . urlencode($periodId));

            if (in_array($resp->status(), [302,301])) {
                $this->mergeSetCookies($cookieHeader, $resp); // capture PERIOD_ID
                $session['cookie_header'] = $cookieHeader;
                // Manually follow location to update server-side context (optional, but ensures correctness)
                $loc = $resp->header('Location');
                if ($loc) {
                    // Fetch redirected page (class.class_list) to validate period switch
                    $follow = Http::withHeaders([
                        'User-Agent' => $config['user_agent'],
                        'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Cookie' => $cookieHeader,
                        'Referer' => $base . '/index.cfm?fa=class.class_list',
                    ])->withOptions([
                        'timeout' => $config['timeout'],
                        'allow_redirects' => true,
                    ])->get(str_starts_with($loc, 'http') ? $loc : $base . $loc);
                    if ($follow->ok()) {
                        return $follow->body();
                    }
                }
                // Fallback: fetch fresh list
                return $this->fetchInstructorClassListHtml($session);
            }
            // If server returned 200 directly (unexpected), still merge potential cookies.
            if ($resp->ok()) {
                $this->mergeSetCookies($cookieHeader, $resp);
                $session['cookie_header'] = $cookieHeader;
                return $this->fetchInstructorClassListHtml($session);
            }
        } catch (\Throwable $e) {
            Log::debug('setInstructorClassListPeriod error: '.$e->getMessage());
        }
        return null;
    }

    /**
     * Extract employee_id from home page (staff) HTML.
     * Looks for anchor: /index.cfm?fa=employee.employee_viewprofile&employee_id=44802
     */
    public function extractEmployeeIdFromHome(?string $html): ?int
    {
        if (!$html) return null;
        if (preg_match('/employee\.employee_viewprofile&employee_id=(\d+)/', $html, $m)) {
            return (int)$m[1];
        }
        return null;
    }

    /**
     * Fetch employee profile page HTML (initial Angular template). Data values may be populated via XHR afterwards.
     */
    public function fetchEmployeeProfileHtml(array $session, int $employeeId): ?string
    {
        $config = config('legacy');
        $base = $config['base_url'];
        $cookieHeader = $session['cookie_header'] ?? $this->buildCookieHeader($session['cookies'] ?? []);
        try {
            $url = $base . '/index.cfm?fa=employee.employee_viewprofile&employee_id=' . $employeeId;
            $resp = Http::withHeaders([
                'User-Agent' => $config['user_agent'],
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Cookie' => $cookieHeader,
                'Referer' => $base . '/index.cfm?fa=home.index',
            ])->withOptions([
                'timeout' => $config['timeout'],
                'allow_redirects' => true,
            ])->get($url);
            if ($resp->ok()) return $resp->body();
        } catch (\Throwable $e) {
            Log::debug('fetchEmployeeProfileHtml error: '.$e->getMessage());
        }
        return null;
    }

    /**
     * Parse limited static metadata from employee profile HTML (department selected option, profile photo url).
     * NOTE: Many actual field values are populated client-side via Angular and are not present in initial HTML.
     */
    public function parseEmployeeProfileMeta(?string $html): array
    {
        $meta = [];
        if (!$html) return $meta;
        // Department code (selected option in department_select)
        if (preg_match('/<select[^>]*id="department_select"[\s\S]*?<option value="([A-Z0-9_]+)"selected>/i', $html, $m)) {
            $meta['employee_department_code'] = trim($m[1]);
        }
        // Photo URL from side nav user view
        if (preg_match('/<img class="circle" src="([^"]+)"/i', $html, $m2)) {
            $meta['employee_photo_url'] = html_entity_decode($m2[1]);
        }
        return $meta;
    }

    /**
     * Fetch clearance data from legacy system
     */
    public function fetchClearanceData(array $legacySession, int $semesterId): array
    {
        $config = config('legacy');
        $base = $config['base_url'];
        $cookieHeader = $legacySession['cookie_header'] ?? '';

        try {
            $response = Http::withHeaders([
                'User-Agent' => $config['user_agent'],
                'Accept' => 'application/json, text/plain, */*',
                'Accept-Language' => 'en-US,en;q=0.9',
                'Cookie' => $cookieHeader,
                'Sec-Fetch-Site' => 'same-origin',
                'Sec-Fetch-Mode' => 'cors',
                'Sec-Fetch-Dest' => 'empty',
                'Referer' => $base . '/index.cfm?fa=clearance.clearance',
            ])->withOptions([
                'timeout' => $config['timeout'],
            ])->get($base . '/index.cfm', [
                'fa' => 'clearance.json_get_clearance_list',
                'semester_id' => $semesterId
            ]);

            if (!$response->ok()) {
                Log::error('Failed to fetch clearance data', [
                    'status' => $response->status(),
                    'semester_id' => $semesterId
                ]);
                return [];
            }

            $data = $response->json();
            
            if (!is_array($data)) {
                Log::warning('Clearance data is not array', [
                    'type' => gettype($data),
                    'semester_id' => $semesterId
                ]);
                return [];
            }

            Log::info('Clearance data fetched successfully', [
                'semester_id' => $semesterId,
                'areas_count' => count($data)
            ]);

            return $data;

        } catch (\Exception $e) {
            Log::error('Exception while fetching clearance data', [
                'error' => $e->getMessage(),
                'semester_id' => $semesterId
            ]);
            return [];
        }
    }

    /**
     * Fetch student information by school ID (keyword search)
     */
    public function fetchStudentBySchoolId(array $legacySession, string $schoolId): array
    {
        $config = config('legacy');
        $base = $config['base_url'];
        $cookieHeader = $legacySession['cookie_header'] ?? '';

        try {
            Log::info('=== FETCHING STUDENT BY SCHOOL ID ===', [
                'school_id' => $schoolId
            ]);

            $response = Http::withHeaders([
                'User-Agent' => $config['user_agent'],
                'Accept' => 'application/json, text/plain, */*',
                'Accept-Language' => 'en-US,en;q=0.9',
                'Cookie' => $cookieHeader,
                'Sec-Fetch-Site' => 'same-origin',
                'Sec-Fetch-Mode' => 'cors',
                'Sec-Fetch-Dest' => 'empty',
                'Referer' => $base . '/index.cfm?fa=student.student_academic_record_index',
            ])->withOptions([
                'timeout' => $config['timeout'],
            ])->get($base . '/index.cfm', [
                'fa' => 'student.json_get_student_by_lastname',
                'keyword' => $schoolId
            ]);

            if (!$response->ok()) {
                Log::error('Failed to fetch student by school ID', [
                    'status' => $response->status(),
                    'school_id' => $schoolId
                ]);
                return [];
            }

            $data = $response->json();
            
            if (!is_array($data)) {
                Log::warning('Student data is not array', [
                    'type' => gettype($data),
                    'school_id' => $schoolId
                ]);
                return [];
            }

            Log::info('Student data fetched successfully', [
                'school_id' => $schoolId,
                'students_found' => count($data),
                'student_id' => $data[0]['student_id'] ?? null,
                'degree_program_id' => $data[0]['degree_program_id'] ?? null
            ]);

            return $data;

        } catch (\Exception $e) {
            Log::error('Exception while fetching student by school ID', [
                'error' => $e->getMessage(),
                'school_id' => $schoolId
            ]);
            return [];
        }
    }

    /**
     * Comprehensive data scraping on login - fetches all necessary data for eligibility checking
     */
    public function performLoginDataScraping(array $legacySession, ?string $schoolId = null): array
    {
        Log::info('=== STARTING COMPREHENSIVE LOGIN DATA SCRAPING ===', [
            'school_id' => $schoolId,
            'timestamp' => now()
        ]);

        $scrapedData = [
            'timestamp' => now(),
            'success' => false,
            'academic_records' => [],
            'semesters' => [],
            'current_semester_id' => null,
            'clearance_data' => [],
            'student_info' => [],
            'all_semester_grades' => [],
            'errors' => []
        ];

        try {
            // 1. Fetch and parse academic records to get semester information
            Log::info('Step 1: Fetching academic records and semester data');
            try {
                $academicHtml = $this->fetchAcademicRecordsHtml($legacySession);
                $parsed = $this->parseAcademicRecords($academicHtml);
                $init = $this->extractAcademicInitParams($academicHtml);
                
                $scrapedData['academic_records'] = $parsed;
                $scrapedData['semesters'] = $parsed['semesters'] ?? [];
                $scrapedData['current_semester_id'] = $parsed['current_semester_id'] ?? null;
                $scrapedData['init_params'] = $init;
                
                Log::info('Academic records scraped successfully', [
                    'semesters_found' => count($scrapedData['semesters']),
                    'current_semester' => $scrapedData['current_semester_id']
                ]);
            } catch (\Exception $e) {
                $error = 'Failed to fetch academic records: ' . $e->getMessage();
                $scrapedData['errors'][] = $error;
                Log::error($error);
            }

            // 2. Fetch student information by school ID if provided
            if ($schoolId) {
                Log::info('Step 2: Fetching student information by school ID');
                try {
                    $studentInfo = $this->fetchStudentBySchoolId($legacySession, $schoolId);
                    $scrapedData['student_info'] = $studentInfo;
                    
                    Log::info('Student information scraped successfully', [
                        'student_records_found' => count($studentInfo)
                    ]);
                } catch (\Exception $e) {
                    $error = 'Failed to fetch student info: ' . $e->getMessage();
                    $scrapedData['errors'][] = $error;
                    Log::error($error);
                }
            }

            // 3. Fetch clearance data for all available semesters
            Log::info('Step 3: Fetching clearance data for all semesters');
            $scrapedData['clearance_data'] = [];
            
            foreach ($scrapedData['semesters'] as $semester) {
                $semesterId = (int)$semester['id'];
                try {
                    $clearanceData = $this->fetchClearanceData($legacySession, $semesterId);
                    $scrapedData['clearance_data'][$semesterId] = [
                        'semester_id' => $semesterId,
                        'semester_label' => $semester['label'],
                        'data' => $clearanceData,
                        'areas_count' => count($clearanceData),
                        'timestamp' => now()
                    ];
                    
                    Log::info('Clearance data scraped for semester', [
                        'semester_id' => $semesterId,
                        'areas_found' => count($clearanceData)
                    ]);
                } catch (\Exception $e) {
                    $error = "Failed to fetch clearance for semester {$semesterId}: " . $e->getMessage();
                    $scrapedData['errors'][] = $error;
                    Log::error($error);
                }
            }

            // 4. Fetch grades data for all semesters
            if ($init) {
                Log::info('Step 4: Fetching grades for all semesters');
                $scrapedData['all_semester_grades'] = [];
                
                foreach ($scrapedData['semesters'] as $semester) {
                    $semesterId = $semester['id'];
                    try {
                        $rawJson = $this->fetchAcademicRecordJson(
                            $legacySession,
                            $init['student_id'],
                            $init['educational_level_id'],
                            $semesterId
                        );
                        
                        $normalized = array_map(fn($r) => $this->normalizeAcademicRecordRow($r), $rawJson);
                        
                        $scrapedData['all_semester_grades'][$semesterId] = [
                            'semester_id' => $semesterId,
                            'semester_label' => $semester['label'],
                            'grades' => $normalized,
                            'records_count' => count($normalized),
                            'timestamp' => now()
                        ];
                        
                        Log::info('Grades scraped for semester', [
                            'semester_id' => $semesterId,
                            'records_found' => count($normalized)
                        ]);
                    } catch (\Exception $e) {
                        $error = "Failed to fetch grades for semester {$semesterId}: " . $e->getMessage();
                        $scrapedData['errors'][] = $error;
                        Log::error($error);
                    }
                }
            }

            $scrapedData['success'] = true;
            Log::info('=== COMPREHENSIVE DATA SCRAPING COMPLETED SUCCESSFULLY ===', [
                'semesters_processed' => count($scrapedData['semesters']),
                'clearance_semesters' => count($scrapedData['clearance_data']),
                'grade_semesters' => count($scrapedData['all_semester_grades']),
                'errors_count' => count($scrapedData['errors'])
            ]);

        } catch (\Exception $e) {
            $error = 'Critical error during data scraping: ' . $e->getMessage();
            $scrapedData['errors'][] = $error;
            $scrapedData['success'] = false;
            Log::error($error, ['trace' => $e->getTraceAsString()]);
        }

        return $scrapedData;
    }

    /**
     * Cache scraped data for faster access
     */
    public function cacheScrapedData(int $userId, array $scrapedData): bool
    {
        try {
            $cacheKey = "scraped_data_user_{$userId}";
            $cacheTime = 3600; // Cache for 1 hour
            
            Cache::put($cacheKey, $scrapedData, $cacheTime);
            
            Log::info('Scraped data cached successfully', [
                'user_id' => $userId,
                'cache_key' => $cacheKey,
                'cache_duration' => $cacheTime
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to cache scraped data', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get cached scraped data
     */
    public function getCachedScrapedData(int $userId): ?array
    {
        try {
            $cacheKey = "scraped_data_user_{$userId}";
            $data = Cache::get($cacheKey);
            
            if ($data) {
                Log::info('Retrieved cached scraped data', [
                    'user_id' => $userId,
                    'cache_key' => $cacheKey
                ]);
            }
            
            return $data;
        } catch (\Exception $e) {
            Log::error('Failed to get cached scraped data', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Persist legacy student info (student_id, degree_program_id) for authenticated user.
     */
    public function saveStudentInfoToDb($user, $studentInfo)
    {
        try {
            if (isset($studentInfo['student_id']) && isset($studentInfo['degree_program_id'])) {
                \App\Models\LegacyStudentInfo::updateOrCreate([
                    'user_id' => $user->id,
                ], [
                    'student_id' => $studentInfo['student_id'],
                    'degree_program_id' => $studentInfo['degree_program_id'],
                ]);
                
                Log::info('Saved student info to database', [
                    'user_id' => $user->id,
                    'student_id' => $studentInfo['student_id'],
                    'degree_program_id' => $studentInfo['degree_program_id']
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to save student info to database', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Persist academic records for the authenticated user and semester.
     * Accepts array of normalized course records.
     */
    public function saveAcademicRecordsToDb($user, $semesterId, $records)
    {
        try {
            foreach ($records as $rec) {
                \App\Models\LegacyAcademicRecord::updateOrCreate([
                    'user_id' => $user->id,
                    'semester_id' => $semesterId,
                    'course_code' => $rec['code'] ?? $rec['course'] ?? null,
                ], [
                    'course_title' => $rec['title'] ?? $rec['course_title'] ?? null,
                    'units' => $rec['units'] ?? null,
                    'type' => $rec['course_type'] ?? $rec['type'] ?? null,
                    'prelim' => $rec['prelim'] ?? null,
                    'midterm' => $rec['midterm'] ?? null,
                    'finals' => $rec['finals'] ?? null,
                    'average' => $rec['average'] ?? null,
                    'units_earned' => $rec['units_earned'] ?? null,
                    'section' => $rec['section'] ?? null,
                    'is_complete' => $this->isCourseComplete($rec),
                ]);
            }
            
            Log::info('Saved academic records to database', [
                'user_id' => $user->id,
                'semester_id' => $semesterId,
                'records_count' => count($records)
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to save academic records to database', [
                'user_id' => $user->id,
                'semester_id' => $semesterId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Helper to determine if a course is complete (no grade is 40).
     */
    protected function isCourseComplete($rec)
    {
        foreach (['prelim','midterm','finals'] as $g) {
            if (isset($rec[$g]) && $rec[$g] == 40) return false;
        }
        return true;
    }

    /**
     * Persist clearance status for the authenticated user and semester.
     * Accepts array of clearance areas.
     */
    public function saveClearanceStatusToDb($user, $semesterId, $clearanceAreas)
    {
        try {
            foreach ($clearanceAreas as $area) {
                $status = 'complete';
                if (isset($area['requirements'])) {
                    foreach ($area['requirements'] as $req) {
                        if (isset($req['default_cleared']) && $req['default_cleared'] == 0) {
                            $status = 'missing';
                            break;
                        }
                    }
                }
                
                // Special handling for Cashier
                if (($area['label'] ?? '') === 'Cashier') {
                    foreach ($area['requirements'] ?? [] as $req) {
                        if (isset($req['remarks']) && $req['remarks'] === 'Full Payment' && $req['default_cleared'] == 0) {
                            $status = 'outstanding_balance';
                            break;
                        }
                    }
                }
                
                \App\Models\LegacyClearanceStatus::updateOrCreate([
                    'user_id' => $user->id,
                    'semester_id' => $semesterId,
                    'area' => $area['label'] ?? null,
                ], [
                    'status' => $status,
                    'details' => json_encode($area),
                ]);
            }
            
            Log::info('Saved clearance status to database', [
                'user_id' => $user->id,
                'semester_id' => $semesterId,
                'areas_count' => count($clearanceAreas)
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to save clearance status to database', [
                'user_id' => $user->id,
                'semester_id' => $semesterId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Persist all scraped data to the database for the user.
     */
    public function persistAllScrapedData($user, $scrapedData)
    {
        Log::info('=== PERSISTING ALL SCRAPED DATA TO DATABASE ===', [
            'user_id' => $user->id,
            'timestamp' => now()
        ]);
        
        // Save student info
        if (!empty($scrapedData['student_info'][0])) {
            $this->saveStudentInfoToDb($user, $scrapedData['student_info'][0]);
        }
        
        // Save academic records and grades for all semesters
        if (!empty($scrapedData['all_semester_grades'])) {
            foreach ($scrapedData['all_semester_grades'] as $semesterId => $semData) {
                $this->saveAcademicRecordsToDb($user, $semesterId, $semData['grades'] ?? []);
            }
        }
        
        // Save clearance data for all semesters
        if (!empty($scrapedData['clearance_data'])) {
            foreach ($scrapedData['clearance_data'] as $semesterId => $clearance) {
                $this->saveClearanceStatusToDb($user, $semesterId, $clearance['data'] ?? []);
            }
        }
        
        Log::info('=== FINISHED PERSISTING ALL SCRAPED DATA ===', [
            'user_id' => $user->id
        ]);
    }

    /**
     * Fetch student clearance data by last name keyword
     * Returns array of clearance records with account_id, student_number, etc.
     * 
     * Endpoint: index.cfm?fa=clearance.json_get_student_clearance_by_keyword&keyword={LASTNAME}
     * Response: [{"account_id": 119597, "student_number": "230000001047", "firstname": "GEOFFREY", ...}]
     */
    public function fetchClearanceByKeyword(array $session, string $keyword): ?array
    {
        $config = config('legacy');
        $base = $config['base_url'];
        $cookieHeader = $this->buildCookieHeader($session['cookies'] ?? []);
        
        $url = $base . '/index.cfm?fa=clearance.json_get_student_clearance_by_keyword&keyword=' . urlencode(strtoupper($keyword));
        
        Log::info('Fetching clearance by keyword', [
            'keyword' => $keyword,
            'url' => $url
        ]);
        
        try {
            $response = Http::withHeaders([
                'User-Agent' => $config['user_agent'],
                'Accept' => 'application/json, text/html, */*',
                'Accept-Language' => 'en-GB,en;q=0.9',
                'Cookie' => $cookieHeader,
            ])->withOptions([
                'timeout' => $config['timeout'],
            ])->get($url);
            
            if (!$response->ok()) {
                Log::warning('Clearance API request failed', [
                    'status' => $response->status(),
                    'keyword' => $keyword
                ]);
                return null;
            }
            
            $data = json_decode($response->body(), true);
            
            if (!is_array($data)) {
                Log::warning('Clearance API returned non-array', [
                    'keyword' => $keyword,
                    'body' => $response->body()
                ]);
                return null;
            }
            
            Log::info('Clearance API response received', [
                'keyword' => $keyword,
                'records_count' => count($data)
            ]);
            
            return $data;
            
        } catch (\Throwable $e) {
            Log::error('Failed to fetch clearance by keyword', [
                'keyword' => $keyword,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
