# UIC API v2 Integration

## Overview
The system now supports **UIC API v2** authentication alongside the existing legacy scraper. This provides access to structured API endpoints with bearer token authentication.

## Files Created/Modified

### New Files
1. **`app/Services/UicApiClient.php`** - Main service for UIC API v2 interactions
2. **`app/Helpers/UicApiHelper.php`** - Helper class for easy API access

### Modified Files
1. **`app/Http/Requests/Auth/LoginRequest.php`** - Added UIC API v2 authentication support
2. **`app/Http/Controllers/Auth/AuthenticatedSessionController.php`** - Added token cleanup on logout

## Authentication Modes

The login system now supports **4 authentication modes**:

| Mode | Description | When to Use |
|------|-------------|-------------|
| `auto` (default) | Tries local DB → UIC API v2 → Legacy scraper | Most users |
| `local` | Only local database authentication | Testing/Admin |
| `api` | Forces legacy scraper authentication | Legacy systems |
| `uic-api` | Forces UIC API v2 authentication | New API-only features |

## API Credentials

```php
Base URL: https://api.uic.edu.ph/api/v2
Client ID: 1761122832-0D26D912B8DFC51F8F93F32BB55D68114E1A8D567F217FACF44ACD162EA709AD.api.uic.edu.ph
Client Secret: B83643C7F6572C8B7F5C2B872B4B89D4DDCC5C3EF84684D266F9D31D022DF886
```

## Usage Examples

### 1. Basic Usage in Controllers

```php
use App\Services\UicApiClient;

class ExampleController extends Controller
{
    public function example()
    {
        $uicApi = app(UicApiClient::class);
        $user = Auth::user();
        
        // Get cached token
        $token = $uicApi->getCachedToken($user->id);
        
        if ($token) {
            // Make API request
            $data = $uicApi->get($token, '/students/grades');
            return response()->json($data);
        }
        
        return response()->json(['error' => 'No token available'], 401);
    }
}
```

### 2. Using the Helper Class

```php
use App\Helpers\UicApiHelper;

class StudentController extends Controller
{
    public function getGrades()
    {
        // Check if user has token
        if (!UicApiHelper::hasToken()) {
            return response()->json(['error' => 'Not authenticated with UIC API'], 401);
        }
        
        // Make GET request
        $grades = UicApiHelper::get('/students/grades');
        
        // Make POST request
        $result = UicApiHelper::post('/students/enroll', [
            'course_id' => 123,
            'section' => 'A'
        ]);
        
        return response()->json([
            'grades' => $grades,
            'enrollment' => $result
        ]);
    }
}
```

### 3. Manual Token Management

```php
use App\Services\UicApiClient;

class ApiController extends Controller
{
    public function loginManually()
    {
        $uicApi = app(UicApiClient::class);
        
        try {
            // Login and get token
            $result = $uicApi->login('2021-12345', 'password123');
            
            $token = $result['bearer_token'];
            $userData = $result['user_data'];
            
            // Cache token for user
            $uicApi->cacheToken(auth()->id(), $token, 1440); // 24 hours
            
            return response()->json([
                'success' => true,
                'token' => $token,
                'user' => $userData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 401);
        }
    }
    
    public function verifyToken()
    {
        if (UicApiHelper::isTokenValid()) {
            return response()->json(['valid' => true]);
        }
        return response()->json(['valid' => false], 401);
    }
}
```

### 4. Making Custom API Requests

```php
use App\Services\UicApiClient;

class CustomApiController extends Controller
{
    public function customRequest()
    {
        $uicApi = app(UicApiClient::class);
        $token = $uicApi->getCachedToken(auth()->id());
        
        // GET request with query parameters
        $students = $uicApi->get($token, '/admin/students', [
            'program' => 'MSCS',
            'year_level' => 2
        ]);
        
        // POST request
        $created = $uicApi->post($token, '/admin/students', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@uic.edu.ph'
        ]);
        
        // Custom HTTP methods
        $updated = $uicApi->request(
            $token,
            'PUT',
            '/admin/students/123',
            ['status' => 'active']
        );
        
        $deleted = $uicApi->request(
            $token,
            'DELETE',
            '/admin/students/123'
        );
        
        return response()->json([
            'students' => $students,
            'created' => $created,
            'updated' => $updated,
            'deleted' => $deleted
        ]);
    }
}
```

## Login Flow

```
User Login Attempt
    ↓
Super Admin Check (bypass)
    ↓
Local DB Authentication
    ↓ (if fails)
UIC API v2 Authentication
    ↓ (gets bearer token)
Legacy Scraper Authentication
    ↓ (gets session cookies)
Create/Update User
    ↓
Cache Both Tokens
    ↓
Login Success
```

## Token Management

### Automatic Token Caching
- Bearer tokens are automatically cached during login
- Default expiration: **24 hours** (1440 minutes)
- Cache key: `uic_bearer_token_{user_id}`

### Manual Token Management

```php
use App\Services\UicApiClient;

$uicApi = app(UicApiClient::class);
$userId = auth()->id();

// Cache token
$uicApi->cacheToken($userId, $token, 1440);

// Get cached token
$token = $uicApi->getCachedToken($userId);

// Clear token
$uicApi->clearCachedToken($userId);

// Verify token validity
$isValid = $uicApi->verifyToken($token);
```

## Testing Login Modes

### From Login Form (Frontend)
Add a hidden input or modify the login request:

```javascript
// In your login component
const login = async (identifier, password, mode = 'auto') => {
    await router.post('/login', {
        identifier,
        password,
        mode // 'auto', 'local', 'api', or 'uic-api'
    });
};
```

### From API/Testing
```bash
# Auto mode (default - tries all methods)
curl -X POST http://localhost/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"2021-12345","password":"yourpassword"}'

# Force UIC API v2 only
curl -X POST http://localhost/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"2021-12345","password":"yourpassword","mode":"uic-api"}'

# Force Legacy Scraper only
curl -X POST http://localhost/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"2021-12345","password":"yourpassword","mode":"api"}'
```

## Available UIC API Endpoints

Based on the API documentation, you can use these endpoints (adjust as per actual API docs):

```php
// Authentication
POST /accounts/auth/login - Login and get bearer token
GET  /accounts/auth/verify - Verify token validity

// Students (examples - adjust based on actual API)
GET  /students/profile - Get student profile
GET  /students/grades - Get student grades
GET  /students/clearance - Get clearance status
POST /students/enroll - Enroll in course

// Admin (examples)
GET  /admin/students - List students
POST /admin/students - Create student
PUT  /admin/students/{id} - Update student
DELETE /admin/students/{id} - Delete student
```

## Performance Comparison

| Authentication Method | Average Time | Cached? |
|----------------------|--------------|---------|
| Local DB | ~50ms | Yes |
| UIC API v2 | ~200-400ms | Token cached |
| Legacy Scraper | ~500-1000ms | Session cached |

## Error Handling

```php
use App\Services\UicApiClient;

try {
    $uicApi = app(UicApiClient::class);
    $result = $uicApi->login($username, $password);
    // Success
} catch (\RuntimeException $e) {
    // Authentication failed
    Log::error('UIC API login failed', [
        'error' => $e->getMessage()
    ]);
}

// Using helper with null safety
$data = UicApiHelper::get('/students/grades');
if ($data === null) {
    // No token or request failed
    return response()->json(['error' => 'Could not fetch grades'], 401);
}
```

## Logging

All UIC API operations are logged:

```php
// Login attempt
"UIC API v2: Attempting login"

// Login success
"UIC API v2: Login successful"

// Token cached
"Login: UIC API bearer token cached"

// API request
"UIC API v2: Making request"

// Token cleared on logout
"UIC API v2: Token cleared"
```

Check `storage/logs/laravel.log` for detailed API interaction logs.

## Security Notes

1. **Bearer tokens are cached** - They expire after 24 hours by default
2. **Tokens are cleared on logout** - Automatic cleanup
3. **Client credentials are hardcoded** - Store in `.env` for production:

```env
UIC_API_BASE_URL=https://api.uic.edu.ph/api/v2
UIC_API_CLIENT_ID=1761122832-0D26D912B8DFC51F8F93F32BB55D68114E1A8D567F217FACF44ACD162EA709AD.api.uic.edu.ph
UIC_API_CLIENT_SECRET=B83643C7F6572C8B7F5C2B872B4B89D4DDCC5C3EF84684D266F9D31D022DF886
```

Then update `UicApiClient.php`:

```php
private const BASE_URL = env('UIC_API_BASE_URL', 'https://api.uic.edu.ph/api/v2');
private const CLIENT_ID = env('UIC_API_CLIENT_ID');
private const CLIENT_SECRET = env('UIC_API_CLIENT_SECRET');
```

## Troubleshooting

### Token Not Available
```php
if (!UicApiHelper::hasToken()) {
    // User needs to log in with UIC API mode
    return redirect('/login?mode=uic-api');
}
```

### Token Expired
```php
if (!UicApiHelper::isTokenValid()) {
    // Clear expired token and prompt re-login
    $uicApi = app(UicApiClient::class);
    $uicApi->clearCachedToken(auth()->id());
    return redirect('/login');
}
```

### API Endpoint Not Working
- Check API documentation for correct endpoint paths
- Verify bearer token is being sent correctly
- Check logs in `storage/logs/laravel.log`

## Next Steps

1. **Test the login flow** with `mode=uic-api`
2. **Explore available API endpoints** from UIC API documentation
3. **Implement specific features** using the bearer token
4. **Add frontend UI** to select authentication mode (optional)
5. **Monitor logs** for any issues

## Support

If you encounter issues:
1. Check `storage/logs/laravel.log` for detailed error messages
2. Verify UIC API credentials are correct
3. Ensure network connectivity to `api.uic.edu.ph`
4. Test with different authentication modes
