# Professional Authentication Flow - UIC API v2 + Legacy Scraping

## ✅ Correct Implementation

Your authentication system now follows this **professional flow**:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LOGIN ATTEMPT                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: UIC API v2 Authentication (PRIMARY)                │
│  ✅ Login with credentials                                   │
│  ✅ Get bearer token                                         │
│  ✅ This is REQUIRED - if fails, login fails                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ✅ SUCCESS?
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Legacy Portal Scraping (DATA ENRICHMENT)           │
│  ✅ Scrape additional data from legacy portal                │
│  ✅ Get clearance, grades, academic records, etc.            │
│  ⚠️  This is OPTIONAL - if fails, login still succeeds       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  CACHE BOTH TOKENS                                           │
│  🔑 UIC API Bearer Token → 24 hours                         │
│  🍪 Legacy Session Cookies → 30 minutes                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   ✅ LOGIN SUCCESS
```

---

## 🎯 Key Points

### 1. **UIC API v2 = PRIMARY AUTHENTICATION**
   - ✅ User **MUST** authenticate with UIC API v2
   - ✅ Bearer token is **REQUIRED** for login
   - ❌ If UIC API fails → **Login fails**

### 2. **Legacy Scraping = DATA ENRICHMENT**
   - ✅ Runs **AFTER** UIC API succeeds
   - ✅ Scrapes additional data (clearance, grades, etc.)
   - ⚠️ If scraping fails → **Login still succeeds** (just no extra data)

### 3. **Both Tokens Cached**
   - 🔑 **Bearer Token** (24 hrs) → For UIC API calls
   - 🍪 **Legacy Session** (30 min) → For data scraping

---

## 📋 What Happens During Login

### Step 1: UIC API v2 Authentication
```php
// Authenticate with UIC API v2
POST https://api.uic.edu.ph/api/v2/accounts/auth/login
Headers:
  X-API-Client-ID: ...
  X-API-Client-Secret: ...
Body:
  username: "2021-12345"
  password: "yourpassword"

Response:
  bearer_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  user_data: {...}
```

**If this fails → User cannot login!**

### Step 2: Legacy Portal Scraping
```php
// Scrape legacy portal for additional data
GET https://portal.uic.edu.ph/index.cfm?fa=login.login_do
Cookies: CFID, CFTOKEN, STUDENT_ID, etc.

// Scrape pages:
- Clearance status
- Academic records
- Grades
- Student info
```

**If this fails → User still logs in, just missing some data**

### Step 3: Cache Both
```php
// Cache bearer token (24 hours)
Cache::put('uic_bearer_token_' . $userId, $bearerToken, now()->addHours(24));

// Cache legacy session (30 minutes)
Cache::put('legacy_session_' . $userId, $legacySession, now()->addMinutes(30));
```

---

## 🔍 Logging Output

### Successful Login (Both Work)
```
[INFO] Login: Step 1 - UIC API v2 authentication SUCCESS
  - identifier: 2021-12345
  - has_token: true
  - token_preview: eyJhbGciOiJIUzI1Ni...

[INFO] Login: Step 2 - UIC API succeeded, now scraping legacy portal
  - student_id: 2021-12345

[INFO] Login: Step 2 - Legacy student scraping successful
  - student_id: 2021-12345

[INFO] Login: UIC API bearer token cached successfully
  - user_id: 123
  - token_preview: eyJhbGciOiJIUzI1Ni...

[INFO] Login: Legacy session cached for data scraping
  - user_id: 123

[INFO] Login: Authentication complete - SUMMARY
  - has_uic_api_token: true
  - has_legacy_session: true
  - authentication_method: UIC API v2 (Primary)
  - data_enrichment: Legacy scraping (Success)
  - status: SUCCESS
```

### UIC API Works, Legacy Fails (Still Success)
```
[INFO] Login: Step 1 - UIC API v2 authentication SUCCESS
  - has_token: true

[WARNING] Login: Step 2 - Legacy scraping failed (non-critical)
  - error: Connection timeout
  - note: User will still be logged in with UIC API token

[INFO] Login: UIC API bearer token cached successfully

[INFO] Login: No legacy session data available for scraping
  - note: Legacy scraping failed but user authenticated via UIC API

[INFO] Login: Authentication complete - SUMMARY
  - has_uic_api_token: true
  - has_legacy_session: false
  - authentication_method: UIC API v2 (Primary)
  - data_enrichment: Legacy scraping (Failed/Skipped)
  - status: SUCCESS
```

### UIC API Fails (Login Fails)
```
[ERROR] Login: Step 1 - UIC API v2 authentication FAILED
  - error: Invalid credentials

Authentication failed. Please check your credentials.
```

---

## 💻 Usage in Your Application

### Using Bearer Token (UIC API)
```php
use App\Helpers\UicApiHelper;

// Make API calls with bearer token
$grades = UicApiHelper::get('/students/grades');
$profile = UicApiHelper::get('/students/profile');
$courses = UicApiHelper::get('/students/courses');
```

### Using Legacy Scraper (Data Enrichment)
```php
use App\Services\LegacyPortalClient;
use Illuminate\Support\Facades\Cache;

$legacy = app(LegacyPortalClient::class);
$userId = auth()->id();

// Get cached legacy session
$legacySession = Cache::get('legacy_session_' . $userId);

if ($legacySession) {
    // Scrape additional data
    $clearance = $legacy->fetchClearanceByKeyword($legacySession, $lastName);
    $records = $legacy->fetchAcademicRecordsHtml($legacySession);
    $grades = $legacy->fetchGrades($legacySession, $userId);
}
```

---

## 🎯 Benefits of This Approach

### ✅ **Reliability**
- UIC API v2 is primary authentication
- Modern, stable API endpoint
- Bearer token for secure API calls

### ✅ **Data Richness**
- Legacy scraper adds extra data
- Clearance status, academic records, etc.
- Best of both worlds

### ✅ **Fault Tolerance**
- If legacy scraping fails, user still logs in
- System degrades gracefully
- No complete failure

### ✅ **Future Proof**
- Primary authentication on modern API
- Legacy scraping can be phased out
- Easy migration path

---

## 🧪 Testing

### Test Successful Login
```bash
# Login normally
curl -X POST http://localhost/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"2021-12345","password":"yourpass"}'
```

**Expected:**
- ✅ UIC API authenticates
- ✅ Bearer token cached
- ✅ Legacy scraping runs
- ✅ Both tokens available

### Check Tokens
```bash
# Check bearer token
http://localhost/check-bearer-token

# Or use script
php check_bearer_token.php 1
```

**Expected Response:**
```json
{
    "has_token": true,
    "token_preview": "eyJhbGciOiJIUzI1NiIs...",
    "is_valid": true,
    "user_id": 1,
    "user_email": "student@uic.edu.ph"
}
```

### Check Logs
```bash
tail -f storage/logs/laravel.log | grep "Login:"
```

**Look for:**
```
Login: Step 1 - UIC API v2 authentication SUCCESS
Login: Step 2 - Legacy student scraping successful
Login: UIC API bearer token cached successfully
Login: Legacy session cached for data scraping
Login: Authentication complete - SUMMARY
```

---

## 🔐 Security

### Bearer Token
- ✅ Cached for 24 hours
- ✅ Used for UIC API calls
- ✅ Cleared on logout

### Legacy Session
- ✅ Cached for 30 minutes (shorter for security)
- ✅ Used only for data scraping
- ✅ Separate from bearer token

---

## 🚀 Summary

Your authentication now works like this:

1. **Try UIC API v2** → Get bearer token (REQUIRED)
2. **If successful, scrape legacy** → Get extra data (OPTIONAL)
3. **Cache both** → Use throughout session
4. **User logs in** → Has access to both systems

**Primary:** UIC API v2 (bearer token)  
**Secondary:** Legacy scraping (data enrichment)

This is the **professional way** to handle dual authentication! 🎉
