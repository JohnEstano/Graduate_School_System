<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuthStatusController extends Controller
{
    public function googleVerified(Request $request): JsonResponse
    {
        $identifier = trim((string)$request->query('identifier'));
        if ($identifier === '') {
            return response()->json(['verified' => false]);
        }

        $query = User::query();
        if (preg_match('/^[0-9]{6,}$/', $identifier)) {
            $query->where('student_number', $identifier)->orWhere('school_id', $identifier);
        } elseif (str_contains($identifier, '@')) {
            $query->where('email', strtolower($identifier));
        } else {
            // Assume student number if only digits otherwise not found
            $query->where('student_number', $identifier);
        }
        $user = $query->first();
        $verified = $user && $user->google_verified_at !== null;
        return response()->json(['verified' => $verified]);
    }
}
