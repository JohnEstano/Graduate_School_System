<?php

namespace App\Helpers;

use App\Services\UicApiClient;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UicApiHelper
{
    /**
     * Get the UIC API client instance
     *
     * @return UicApiClient
     */
    public static function client(): UicApiClient
    {
        return app(UicApiClient::class);
    }

    /**
     * Get the bearer token for the current authenticated user
     *
     * @return string|null
     */
    public static function getToken(): ?string
    {
        $user = Auth::user();
        if (!$user) {
            return null;
        }

        return self::client()->getCachedToken($user->id);
    }

    /**
     * Make an authenticated GET request for the current user
     *
     * @param string $endpoint API endpoint
     * @param array $queryParams Query parameters
     * @return array|null Response data or null if no token
     */
    public static function get(string $endpoint, array $queryParams = []): ?array
    {
        $token = self::getToken();
        if (!$token) {
            return null;
        }

        try {
            return self::client()->get($token, $endpoint, $queryParams);
        } catch (\Throwable $e) {
            Log::error('UIC API GET request failed', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Make an authenticated POST request for the current user
     *
     * @param string $endpoint API endpoint
     * @param array $data Request body data
     * @return array|null Response data or null if no token
     */
    public static function post(string $endpoint, array $data = []): ?array
    {
        $token = self::getToken();
        if (!$token) {
            return null;
        }

        try {
            return self::client()->post($token, $endpoint, $data);
        } catch (\Throwable $e) {
            Log::error('UIC API POST request failed', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Check if the current user has a valid UIC API token
     *
     * @return bool
     */
    public static function hasToken(): bool
    {
        return self::getToken() !== null;
    }

    /**
     * Verify if the current user's token is still valid
     *
     * @return bool
     */
    public static function isTokenValid(): bool
    {
        $token = self::getToken();
        if (!$token) {
            return false;
        }

        return self::client()->verifyToken($token);
    }
}
