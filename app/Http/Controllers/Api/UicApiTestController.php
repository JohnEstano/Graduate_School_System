<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Helpers\UicApiHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Example controller demonstrating UIC API v2 usage
 * 
 * This controller shows how to use the UIC API in your application
 */
class UicApiTestController extends Controller
{
    /**
     * Check if user has UIC API token
     * 
     * GET /api/uic-api/status
     */
    public function status(): JsonResponse
    {
        return response()->json([
            'has_token' => UicApiHelper::hasToken(),
            'is_valid' => UicApiHelper::hasToken() ? UicApiHelper::isTokenValid() : false,
            'user_id' => Auth::id(),
        ]);
    }

    /**
     * Get current user's profile from UIC API
     * 
     * GET /api/uic-api/profile
     */
    public function profile(): JsonResponse
    {
        if (!UicApiHelper::hasToken()) {
            return response()->json([
                'error' => 'No UIC API token available',
                'message' => 'Please login with UIC API authentication'
            ], 401);
        }

        try {
            // Example endpoint - adjust based on actual UIC API documentation
            $profile = UicApiHelper::get('/accounts/profile');
            
            if ($profile === null) {
                return response()->json([
                    'error' => 'Failed to fetch profile',
                    'message' => 'API request failed or token is invalid'
                ], 500);
            }

            return response()->json([
                'success' => true,
                'profile' => $profile
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Exception occurred',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Example: Get student grades from UIC API
     * 
     * GET /api/uic-api/grades
     */
    public function grades(): JsonResponse
    {
        if (!UicApiHelper::hasToken()) {
            return response()->json([
                'error' => 'No UIC API token available'
            ], 401);
        }

        // Example endpoint - adjust based on actual API documentation
        $grades = UicApiHelper::get('/students/grades', [
            'semester' => request('semester', 'current'),
            'year' => request('year')
        ]);

        if ($grades === null) {
            return response()->json([
                'error' => 'Failed to fetch grades'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'grades' => $grades
        ]);
    }

    /**
     * Example: Submit data to UIC API
     * 
     * POST /api/uic-api/submit
     */
    public function submit(): JsonResponse
    {
        if (!UicApiHelper::hasToken()) {
            return response()->json([
                'error' => 'No UIC API token available'
            ], 401);
        }

        $data = request()->validate([
            'action' => 'required|string',
            'payload' => 'required|array'
        ]);

        // Example POST request
        $result = UicApiHelper::post('/students/actions', $data);

        if ($result === null) {
            return response()->json([
                'error' => 'Failed to submit data'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'result' => $result
        ]);
    }

    /**
     * Get raw token information (for debugging)
     * 
     * GET /api/uic-api/token-info
     */
    public function tokenInfo(): JsonResponse
    {
        $token = UicApiHelper::getToken();

        if (!$token) {
            return response()->json([
                'has_token' => false,
                'message' => 'No token cached for current user'
            ]);
        }

        return response()->json([
            'has_token' => true,
            'token_preview' => substr($token, 0, 20) . '...',
            'is_valid' => UicApiHelper::isTokenValid(),
            'user_id' => Auth::id()
        ]);
    }
}
