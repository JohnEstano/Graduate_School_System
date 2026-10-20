<?php
// Run without production credentials: php tests/Deployment/adviser-smoke.php
$root = dirname(__DIR__, 2);
require $root . '/app/Services/LegacyPortalClient.php';
$client = new App\Services\LegacyPortalClient();
$failures = [];
foreach (['Faculty', 'Adviser', 'Coordinator', 'Dean'] as $role) {
    $actual = $client->extractStaffRole('<span class="white-text">' . $role . '</span>');
    $expected = $role === 'Faculty' ? 'Adviser' : $role;
    if (($actual['role'] ?? null) !== $expected) {
        $failures[] = "Legacy {$role} must map to {$expected}";
    }
}
$controller = file_get_contents($root . '/app/Http/Controllers/InstructorClassListController.php');
preg_match("/Inertia::render\('([^']+)'/", $controller, $match);
if (!$match || !file_exists($root . '/resources/js/pages/' . $match[1] . '.tsx')) {
    $failures[] = 'Class-list Inertia page must exist with matching capitalization';
}
foreach ($failures as $failure) {
    fwrite(STDERR, "FAIL: {$failure}\n");
}
if ($failures) exit(1);
echo "PASS: legacy staff roles and class-list page resolution\n";
