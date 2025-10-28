# How to Check Current Bearer Token

## Quick Methods

### Method 1: Using Helper (Easiest)

```php
use App\Helpers\UicApiHelper;

// Get current user's bearer token
$token = UicApiHelper::getToken();

if ($token) {
    echo "Bearer Token: " . $token;
} else {
    echo "No bearer token available";
}
```

### Method 2: Using Service Directly

```php
use App\Services\UicApiClient;

$uicApi = app(UicApiClient::class);
$userId = auth()->id();

$token = $uicApi->getCachedToken($userId);

if ($token) {
    echo "Bearer Token: " . $token;
} else {
    echo "No bearer token cached for this user";
}
```

### Method 3: Direct Cache Access

```php
use Illuminate\Support\Facades\Cache;

$userId = auth()->id();
$token = Cache::get('uic_bearer_token_' . $userId);

if ($token) {
    echo "Bearer Token: " . $token;
} else {
    echo "No token in cache";
}
```

---

## API Endpoints for Checking Token

### Add to `routes/web.php` or `routes/api.php`:

```php
use App\Helpers\UicApiHelper;
use Illuminate\Support\Facades\Route;

// Check token via web route
Route::middleware(['auth'])->get('/check-token', function () {
    $token = UicApiHelper::getToken();
    
    return response()->json([
        'has_token' => $token !== null,
        'token_preview' => $token ? substr($token, 0, 20) . '...' : null,
        'full_token' => $token, // Remove in production!
        'is_valid' => $token ? UicApiHelper::isTokenValid() : false,
        'user_id' => auth()->id(),
    ]);
});
```

**Test it:**
```bash
# After logging in, visit:
http://localhost/check-token
```

---

## In Tinker (Command Line)

```bash
php artisan tinker
```

Then run:

```php
// Get a specific user's token
$userId = 1;  // Change to your user ID
$token = Cache::get('uic_bearer_token_' . $userId);
echo $token;

// Or using the service
$uicApi = app(\App\Services\UicApiClient::class);
$token = $uicApi->getCachedToken($userId);
echo $token;

// Check if valid
$uicApi->verifyToken($token);
```

---

## In a Controller

Create a debug controller:

```php
<?php

namespace App\Http\Controllers;

use App\Helpers\UicApiHelper;
use App\Services\UicApiClient;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class TokenDebugController extends Controller
{
    public function checkToken()
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        $uicApi = app(UicApiClient::class);
        $token = $uicApi->getCachedToken($user->id);
        
        return response()->json([
            'user_id' => $user->id,
            'user_email' => $user->email,
            'has_token' => $token !== null,
            'token_length' => $token ? strlen($token) : 0,
            'token_preview' => $token ? substr($token, 0, 30) . '...' : null,
            'full_token' => $token, // ⚠️ Remove in production!
            'is_valid' => $token ? $uicApi->verifyToken($token) : false,
            'cache_key' => 'uic_bearer_token_' . $user->id,
        ]);
    }
    
    public function showTokenDetails()
    {
        return view('debug.token', [
            'token' => UicApiHelper::getToken(),
            'has_token' => UicApiHelper::hasToken(),
            'is_valid' => UicApiHelper::isTokenValid(),
        ]);
    }
}
```

Add route:
```php
Route::middleware(['auth'])->group(function () {
    Route::get('/debug/token', [TokenDebugController::class, 'checkToken']);
});
```

---

## Using the Test Controller

The included `UicApiTestController` already has a token info endpoint:

```php
// Add to routes/api.php
use App\Http\Controllers\Api\UicApiTestController;

Route::middleware(['auth'])->prefix('uic-api')->group(function () {
    Route::get('/token-info', [UicApiTestController::class, 'tokenInfo']);
});
```

**Test it:**
```bash
# After logging in, visit:
http://localhost/api/uic-api/token-info
```

**Response:**
```json
{
    "has_token": true,
    "token_preview": "eyJhbGciOiJIUzI1NiIs...",
    "is_valid": true,
    "user_id": 123
}
```

---

## View Token in Browser Console

Add this to your frontend (Inertia.js/React):

```javascript
// In your dashboard or any authenticated page
import { usePage } from '@inertiajs/react';
import axios from 'axios';

function TokenChecker() {
    const [tokenInfo, setTokenInfo] = useState(null);
    
    const checkToken = async () => {
        try {
            const response = await axios.get('/api/uic-api/token-info');
            setTokenInfo(response.data);
            console.log('Bearer Token Info:', response.data);
        } catch (error) {
            console.error('Failed to get token:', error);
        }
    };
    
    return (
        <div>
            <button onClick={checkToken}>Check Bearer Token</button>
            {tokenInfo && (
                <div>
                    <p>Has Token: {tokenInfo.has_token ? 'Yes' : 'No'}</p>
                    <p>Is Valid: {tokenInfo.is_valid ? 'Yes' : 'No'}</p>
                    <p>Token Preview: {tokenInfo.token_preview}</p>
                </div>
            )}
        </div>
    );
}
```

---

## Quick Test Script

Create `check_token.php` in your project root:

```php
<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Cache;

// Check token for user ID
$userId = $argv[1] ?? 1; // Pass user ID as argument

$token = Cache::get('uic_bearer_token_' . $userId);

if ($token) {
    echo "✅ Bearer Token Found for User {$userId}\n";
    echo "Token: {$token}\n";
    echo "Length: " . strlen($token) . " characters\n";
    echo "Preview: " . substr($token, 0, 50) . "...\n";
} else {
    echo "❌ No bearer token found for User {$userId}\n";
    echo "User needs to log in with UIC API authentication.\n";
}
```

**Run it:**
```bash
php check_token.php 1  # Check for user ID 1
php check_token.php 5  # Check for user ID 5
```

---

## Check All Cached Tokens

In tinker:

```php
use Illuminate\Support\Facades\Cache;
use App\Models\User;

// Get all users
$users = User::all();

foreach ($users as $user) {
    $token = Cache::get('uic_bearer_token_' . $user->id);
    if ($token) {
        echo "User {$user->id} ({$user->email}): " . substr($token, 0, 30) . "...\n";
    } else {
        echo "User {$user->id} ({$user->email}): No token\n";
    }
}
```

---

## ⚠️ Security Warning

**Never expose full bearer tokens in production!**

For production, only show:
- ✅ Whether token exists (`has_token`)
- ✅ Whether token is valid (`is_valid`)
- ✅ Token preview (first 10-20 characters)

**Never show:**
- ❌ Full bearer token in responses
- ❌ Token in logs (unless debugging)
- ❌ Token in frontend code

---

## Recommended: Status Endpoint Only

**Safe production endpoint:**

```php
Route::middleware(['auth'])->get('/api/token-status', function () {
    return response()->json([
        'has_uic_api_token' => UicApiHelper::hasToken(),
        'is_valid' => UicApiHelper::hasToken() ? UicApiHelper::isTokenValid() : false,
    ]);
});
```

This tells you if the token exists and is valid without exposing it.

---

## Summary

### Quick Check Methods:

1. **Helper Class**: `UicApiHelper::getToken()`
2. **Service**: `app(UicApiClient::class)->getCachedToken($userId)`
3. **Direct Cache**: `Cache::get('uic_bearer_token_' . $userId)`
4. **API Endpoint**: `GET /api/uic-api/token-info`
5. **Tinker**: `php artisan tinker` then check cache

### Best Practice:

For debugging, use the provided `UicApiTestController`:
```
GET /api/uic-api/token-info
```

For production, only check status without exposing the token.
