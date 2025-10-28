# 🚀 UIC API v2 Quick Reference

## 📦 What Was Implemented

```
✅ UIC API v2 Client Service (app/Services/UicApiClient.php)
✅ Helper Class for Easy Usage (app/Helpers/UicApiHelper.php)
✅ Integrated with Login System (LoginRequest.php)
✅ Auto Token Cleanup on Logout (AuthenticatedSessionController.php)
✅ Test Controller with Examples (UicApiTestController.php)
```

---

## 🔑 Quick Usage

### Check if User Has Token
```php
use App\Helpers\UicApiHelper;

if (UicApiHelper::hasToken()) {
    // User is authenticated with UIC API
}
```

### Make GET Request
```php
$data = UicApiHelper::get('/students/grades', ['semester' => 1]);
```

### Make POST Request
```php
$result = UicApiHelper::post('/students/enroll', [
    'course_id' => 123,
    'section' => 'A'
]);
```

### Get User's Token
```php
$token = UicApiHelper::getToken();
```

### Verify Token
```php
if (UicApiHelper::isTokenValid()) {
    // Token is still valid
}
```

---

## 🔐 Authentication Modes

### Auto (Default - Tries Everything)
```javascript
// No mode parameter needed
router.post('/login', { identifier, password });
```

### Force UIC API Only
```javascript
router.post('/login', { identifier, password, mode: 'uic-api' });
```

### Force Legacy Scraper Only
```javascript
router.post('/login', { identifier, password, mode: 'api' });
```

### Local Database Only
```javascript
router.post('/login', { identifier, password, mode: 'local' });
```

---

## 📍 API Credentials

```
Base URL: https://api.uic.edu.ph/api/v2
Client ID: 1761122832-0D26D912B8DFC51F8F93F32BB55D68114E1A8D567F217FACF44ACD162EA709AD.api.uic.edu.ph
Client Secret: B83643C7F6572C8B7F5C2B872B4B89D4DDCC5C3EF84684D266F9D31D022DF886
```

---

## 🛠️ Advanced Usage

### Direct Client Access
```php
use App\Services\UicApiClient;

$uicApi = app(UicApiClient::class);

// Login manually
$result = $uicApi->login($username, $password);
$token = $result['bearer_token'];

// Make authenticated request
$data = $uicApi->request($token, 'PUT', '/endpoint', ['key' => 'value']);

// Cache token
$uicApi->cacheToken($userId, $token, 1440); // 24 hours

// Get cached token
$token = $uicApi->getCachedToken($userId);

// Clear token
$uicApi->clearCachedToken($userId);

// Verify token
$isValid = $uicApi->verifyToken($token);
```

---

## 🧪 Test Endpoints (Add to routes/api.php)

```php
use App\Http\Controllers\Api\UicApiTestController;

Route::middleware(['auth'])->prefix('uic-api')->group(function () {
    Route::get('/status', [UicApiTestController::class, 'status']);
    Route::get('/profile', [UicApiTestController::class, 'profile']);
    Route::get('/grades', [UicApiTestController::class, 'grades']);
    Route::post('/submit', [UicApiTestController::class, 'submit']);
    Route::get('/token-info', [UicApiTestController::class, 'tokenInfo']);
});
```

**Test URLs:**
- `GET /api/uic-api/status` - Check token status
- `GET /api/uic-api/profile` - Get profile
- `GET /api/uic-api/grades` - Get grades
- `POST /api/uic-api/submit` - Submit data
- `GET /api/uic-api/token-info` - Debug token

---

## 📊 Login Flow

```
User Logs In
    ↓
1. Super Admin? → Bypass ✅
    ↓
2. Local DB Auth → Success? ✅
    ↓
3. UIC API v2 Auth → Get Bearer Token 🔑
    ↓
4. Legacy Scraper → Get Session Cookies 🍪
    ↓
5. Create/Update User
    ↓
6. Cache Both Tokens
    ↓
✅ Login Complete
```

---

## 🔍 Checking Logs

```bash
# View recent logs
tail -f storage/logs/laravel.log

# Search for UIC API logs
grep "UIC API" storage/logs/laravel.log

# Search for login logs
grep "Login:" storage/logs/laravel.log
```

---

## ⚠️ Common Issues & Solutions

### Issue: "No token available"
**Solution:** User needs to login with `mode=uic-api` or `mode=auto`
```php
if (!UicApiHelper::hasToken()) {
    return redirect('/login?mode=uic-api');
}
```

### Issue: "Token expired"
**Solution:** Clear token and prompt re-login
```php
if (!UicApiHelper::isTokenValid()) {
    $uicApi = app(UicApiClient::class);
    $uicApi->clearCachedToken(auth()->id());
    return redirect('/login');
}
```

### Issue: "API request failed"
**Solution:** Check logs and verify endpoint
```bash
tail -f storage/logs/laravel.log | grep "UIC API"
```

---

## 📖 Documentation Files

1. **`UIC_API_IMPLEMENTATION_SUMMARY.md`** - This summary
2. **`UIC_API_V2_INTEGRATION.md`** - Detailed documentation
3. **`EXAMPLE_UIC_API_ROUTES.php`** - Route examples
4. **`app/Http/Controllers/Api/UicApiTestController.php`** - Code examples

---

## ✅ Checklist

- [x] UicApiClient service created
- [x] UicApiHelper helper created
- [x] LoginRequest updated with UIC API support
- [x] AuthenticatedSessionController updated for token cleanup
- [x] Test controller created
- [x] Documentation created
- [ ] Add routes to routes/api.php (optional)
- [ ] Test login with mode=uic-api
- [ ] Test API endpoints
- [ ] Explore UIC API documentation
- [ ] Build features using bearer token

---

## 🎯 Key Benefits

✅ **Both systems work together** - Legacy scraper + UIC API  
✅ **Bearer token cached** - 24-hour cache, auto-refresh on login  
✅ **Easy to use** - Simple helper functions  
✅ **Backward compatible** - Existing features still work  
✅ **Well documented** - PHPDoc comments on all methods  
✅ **Error handling** - Comprehensive logging  
✅ **Clean code** - No lint errors  

---

## 💡 Pro Tips

1. **Use the helper** - `UicApiHelper` is easier than direct client access
2. **Check token first** - Always verify `hasToken()` before API calls
3. **Handle nulls** - Helper returns `null` on failure, check before use
4. **Monitor logs** - Tail `laravel.log` when testing
5. **Test modes** - Try different login modes to see behavior

---

**You're all set! 🎉**

For detailed examples and full API reference, see `UIC_API_V2_INTEGRATION.md`
