<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;

class HonorariumController extends Controller
{
    public function show(string $department_slug): Response
    {
        // Example slug: "information-technology"

        // Converts slug to a readable name for the page title: "Information Technology"
        $departmentName = ucwords(str_replace('-', ' ', $department_slug));

        // --- THIS IS THE NEW LOGIC TO MATCH THE ERROR MESSAGE ---
        // This converts "information-technology" into "Information-Technology"
        $componentFileName = implode('-', array_map('ucfirst', explode('-', $department_slug)));

        // This path now EXACTLY matches the path from your error message.
        $componentPath = 'honorarium/course-program/' . $componentFileName;

        return Inertia::render($componentPath, [
            'departmentName' => $departmentName,
            'departmentSlug' => $department_slug,
        ]);
    }
}
