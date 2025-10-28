<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class UicApiClient
{
    private string $baseUrl;
    private string $clientId;
    private string $clientSecret;
    private int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('uic-api.base_url');
        $this->clientId = config('uic-api.client_id');
        $this->clientSecret = config('uic-api.client_secret');
        $this->timeout = config('uic-api.timeout', 30);

        // Validate required configuration
        if (empty($this->clientId) || empty($this->clientSecret)) {
            throw new RuntimeException(
                'UIC API credentials not configured. Please set UIC_API_CLIENT_ID and UIC_API_CLIENT_SECRET in .env'
            );
        }
    }

    /**
     * Login to UIC API v2 and get bearer token
     *
     * @param string $username Student ID or username
     * @param string $password User password
     * @return array Contains bearer_token, expires_at, user_data
     * @throws RuntimeException If login fails
     */
    public function login(string $username, string $password): array
    {
        Log::info("UIC API v2: Attempting login", [
            'username' => $username,
            'endpoint' => $this->baseUrl . '/accounts/auth/login'
        ]);

        try {
            $response = Http::withHeaders([
                'X-API-Client-ID' => $this->clientId,
                'X-API-Client-Secret' => $this->clientSecret,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout($this->timeout)
              ->post($this->baseUrl . '/accounts/auth/login', [
                'username' => $username,
                'password' => $password,
            ]);

            if (!$response->successful()) {
                $errorBody = $response->body();
                Log::error("UIC API v2: Login failed", [
                    'status' => $response->status(),
                    'body' => $errorBody,
                    'username' => $username
                ]);
                throw new RuntimeException('UIC API login failed: ' . $response->status() . ' - ' . $errorBody);
            }

            $data = $response->json();
            
            Log::info("UIC API v2: Login response received", [
                'has_success' => isset($data['success']),
                'success_value' => $data['success'] ?? false,
                'has_data' => isset($data['data']),
                'response_keys' => array_keys($data ?? [])
            ]);

            // Check if the API returned success
            if (!($data['success'] ?? false)) {
                $message = $data['message'] ?? 'Login failed';
                Log::error("UIC API v2: API returned failure", ['message' => $message, 'data' => $data]);
                throw new RuntimeException("UIC API login failed: $message");
            }

            // Extract token from data object (based on actual API response structure)
            $apiData = $data['data'] ?? [];
            $token = $apiData['token'] ?? $apiData['access_token'] ?? $apiData['bearer_token'] ?? null;
            
            if (!$token) {
                Log::error("UIC API v2: No token in response", ['data' => $data]);
                throw new RuntimeException('No bearer token in UIC API response');
            }

            $result = [
                'success' => true,
                'bearer_token' => $token,
                'token_type' => $apiData['token_type'] ?? 'Bearer',
                'expires_at' => $apiData['token_expires_at'] ?? $apiData['expires_at'] ?? $apiData['expires_in'] ?? null,
                'user_data' => $apiData['user'] ?? [],
                'message' => $data['message'] ?? 'Login successful',
                'raw_response' => $data,
            ];

            Log::info("UIC API v2: Login successful", [
                'username' => $username,
                'user_id' => $result['user_data']['user_account_id'] ?? 'unknown',
                'token_type' => $result['token_type'],
                'expires_at' => $result['expires_at']
            ]);

            return $result;
            
        } catch (RuntimeException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('UIC API v2: Login exception', [
                'error' => $e->getMessage(),
                'username' => $username,
                'trace' => $e->getTraceAsString()
            ]);
            throw new RuntimeException('UIC API login error: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Make an authenticated GET request to the UIC API
     *
     * @param string $bearerToken Bearer token from login
     * @param string $endpoint API endpoint path (without base URL)
     * @param array $queryParams Query parameters
     * @return array Response data
     * @throws RuntimeException If request fails
     */
    public function get(string $bearerToken, string $endpoint, array $queryParams = []): array
    {
        return $this->request($bearerToken, 'GET', $endpoint, [], $queryParams);
    }

    /**
     * Make an authenticated POST request to the UIC API
     *
     * @param string $bearerToken Bearer token from login
     * @param string $endpoint API endpoint path (without base URL)
     * @param array $data Request body data
     * @return array Response data
     * @throws RuntimeException If request fails
     */
    public function post(string $bearerToken, string $endpoint, array $data = []): array
    {
        return $this->request($bearerToken, 'POST', $endpoint, $data);
    }

    /**
     * Make an authenticated request to the UIC API
     *
     * @param string $bearerToken Bearer token from login
     * @param string $method HTTP method (GET, POST, PUT, DELETE, etc.)
     * @param string $endpoint API endpoint path (without base URL)
     * @param array $data Request body data
     * @param array $queryParams Query parameters for GET requests
     * @return array Response data
     * @throws RuntimeException If request fails
     */
    public function request(
        string $bearerToken,
        string $method,
        string $endpoint,
        array $data = [],
        array $queryParams = []
    ): array {
        $method = strtoupper($method);
        $url = $this->baseUrl . $endpoint;

        Log::info("UIC API v2: Making request", [
            'method' => $method,
            'endpoint' => $endpoint,
            'has_token' => !empty($bearerToken)
        ]);

        try {
            $request = Http::withHeaders([
                'Authorization' => 'Bearer ' . $bearerToken,
                'X-API-Client-ID' => $this->clientId,
                'X-API-Client-Secret' => $this->clientSecret,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout($this->timeout);

            $response = match ($method) {
                'GET' => $request->get($url, $queryParams),
                'POST' => $request->post($url, $data),
                'PUT' => $request->put($url, $data),
                'DELETE' => $request->delete($url, $data),
                'PATCH' => $request->patch($url, $data),
                default => throw new RuntimeException("Unsupported HTTP method: {$method}")
            };

            if (!$response->successful()) {
                Log::error("UIC API v2: Request failed", [
                    'method' => $method,
                    'endpoint' => $endpoint,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new RuntimeException(
                    "UIC API request failed: {$response->status()} - {$response->body()}"
                );
            }

            $responseData = $response->json();

            Log::info("UIC API v2: Request successful", [
                'method' => $method,
                'endpoint' => $endpoint,
                'status' => $response->status()
            ]);

            return $responseData ?? [];
            
        } catch (RuntimeException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('UIC API v2: Request exception', [
                'method' => $method,
                'endpoint' => $endpoint,
                'error' => $e->getMessage()
            ]);
            throw new RuntimeException("UIC API request error: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Cache the bearer token for a user
     *
     * @param int $userId User ID
     * @param string $bearerToken Bearer token
     * @param int $expiresInMinutes Minutes until token expires (default 24 hours)
     * @return void
     */
    public function cacheToken(int $userId, string $bearerToken, int $expiresInMinutes = 1440): void
    {
        Cache::put(
            'uic_bearer_token_' . $userId,
            $bearerToken,
            now()->addMinutes($expiresInMinutes)
        );

        Log::info("UIC API v2: Token cached", [
            'user_id' => $userId,
            'expires_in_minutes' => $expiresInMinutes
        ]);
    }

    /**
     * Get cached bearer token for a user
     *
     * @param int $userId User ID
     * @return string|null Bearer token or null if not cached
     */
    public function getCachedToken(int $userId): ?string
    {
        return Cache::get('uic_bearer_token_' . $userId);
    }

    /**
     * Clear cached bearer token for a user
     *
     * @param int $userId User ID
     * @return void
     */
    public function clearCachedToken(int $userId): void
    {
        Cache::forget('uic_bearer_token_' . $userId);
        
        Log::info("UIC API v2: Token cleared", [
            'user_id' => $userId
        ]);
    }

    /**
     * Verify if a bearer token is still valid
     *
     * @param string $bearerToken Bearer token to verify
     * @return bool True if valid, false otherwise
     */
    public function verifyToken(string $bearerToken): bool
    {
        try {
            // Try to make a simple request to verify token validity
            // You may need to adjust the endpoint based on UIC API documentation
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $bearerToken,
                'X-API-Client-ID' => $this->clientId,
                'X-API-Client-Secret' => $this->clientSecret,
                'Accept' => 'application/json',
            ])->timeout(10)
              ->get($this->baseUrl . '/accounts/auth/verify'); // Adjust endpoint as needed

            return $response->successful();
        } catch (\Throwable $e) {
            Log::warning("UIC API v2: Token verification failed", [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
}
