# AA View: Receivables & Coordinator Display Fix

## Problems Identified

1. **Receivables showing as "—" (empty)** in the Committee table
2. **Program Coordinator name and email not displaying** in the summary section

## Root Causes

### Issue 1: Missing `program_level` Field
The `showAADetails()` method in `DefenseRequestController.php` was not returning the `program_level` field, which is **required** by the `getMemberReceivable()` function to calculate payment amounts.

### Issue 2: Missing Coordinator Relationship
The controller was not loading the `coordinator` relationship and not passing coordinator data to the frontend.

## Solutions Implemented

### 1. Backend: DefenseRequestController.php

**File**: `app/Http/Controllers/DefenseRequestController.php`

#### Changes to `showAADetails()` method:

```php
// ✅ Added eager loading
$defenseRequest = \App\Models\DefenseRequest::with(['coordinator', 'aaVerification'])->findOrFail($id);

// ✅ Added program_level to response
'program_level' => $programLevel,

// ✅ Added coordinator data
'coordinator' => $defenseRequest->coordinator ? [
    'id' => $defenseRequest->coordinator->id,
    'name' => $defenseRequest->coordinator->name,
    'email' => $defenseRequest->coordinator->email,
] : null,

// ✅ Added AA verification status
'aa_verification_status' => optional($defenseRequest->aaVerification)->status ?? 'pending',
'aa_verification_id' => optional($defenseRequest->aaVerification)->id,
```

### 2. Frontend: details.tsx (Debug Logging)

**File**: `resources/js/pages/assistant/all-defense-list/details.tsx`

Added comprehensive console logging to help diagnose issues:

#### Initial Data Logging:
```typescript
useEffect(() => {
  console.log('🔍 Defense Request Details Loaded:', {
    id: details?.id,
    program: details?.program,
    program_level: details?.program_level,  // ✅ Now available
    defense_type: details?.defense_type,
    coordinator: details?.coordinator,        // ✅ Now available
    panelists: {...}
  });
}, [details]);
```

#### Payment Rates Logging:
```typescript
console.log('📊 Fetching payment rates...');
console.log('✅ Payment rates loaded:', arr.length, 'rates');
console.log('   Sample rates:', arr.slice(0, 3));
```

#### Receivable Calculation Logging:
```typescript
console.log('🔍 Looking for payment rate:', {
  program_level: details.program_level,
  rateType,
  defense_type: details.defense_type,
  normalized: targetDefenseType,
  available_rates: paymentRates.length
});

// Per-rate checking
console.log('   Checking rate:', {
  rate_program: r.program_level,
  rate_type: r.type,
  rate_defense: r.defense_type,
  matchesProgram,
  matchesType,
  matchesDefense
});

console.log(rate ? '✅ Found rate:' : '❌ No rate found:', rate ? rate.amount : 'N/A');
```

## How the Fix Works

### Receivables Calculation Flow:
```
1. Backend sends program_level field (e.g., "Masteral" or "Doctorate")
   ↓
2. Frontend loads payment_rates from /dean/payment-rates/data
   ↓
3. getMemberReceivable() matches:
   - program_level (exact match)
   - type (Adviser or Panel Chair)
   - defense_type (normalized comparison: "proposal" === "Proposal")
   ↓
4. Returns amount or null
   ↓
5. Displays in Committee table as formatted currency
```

### Coordinator Display Flow:
```
1. Backend loads coordinator relationship with User model
   ↓
2. Returns coordinator object with id, name, email
   ↓
3. Frontend displays in summary section:
   - Name: details?.coordinator?.name || '—'
   - Email: details?.coordinator?.email
```

## Testing Guide

### 1. Test Receivables Display

1. Navigate to `/assistant/all-defense-list`
2. Click on any defense request with panels assigned
3. Open browser console (F12)
4. Look for these logs:
   ```
   🔍 Defense Request Details Loaded: {...}
   📊 Fetching payment rates...
   ✅ Payment rates loaded: X rates
   🔍 Looking for payment rate: {...}
   ✅ Found rate: 5000
   ```

5. Check the Committee table:
   - **Adviser** should show receivable (e.g., ₱3,000.00)
   - **Panel Chair** should show receivable (e.g., ₱5,000.00)
   - **Panel Members 1-4** should show same as Panel Chair

### 2. Test Coordinator Display

1. In the same details page
2. Look at the summary card (top section)
3. Find "Program Coordinator" field
4. Should display coordinator's full name
5. Console should show:
   ```javascript
   coordinator: {
     id: 123,
     name: "Dr. John Doe",
     email: "coordinator@example.com"
   }
   ```

### 3. Debug Empty Receivables

If receivables still show as "—", check console for:

**Missing program_level:**
```
⚠️ Cannot calculate receivable - missing data: {
  program_level: undefined,  // ❌ Problem!
  defense_type: "Proposal",
  role: "Adviser"
}
```
**Solution:** Verify backend is returning `program_level`

**No matching rate:**
```
❌ No rate found: N/A
```
**Solution:** Check payment rates table has entries for that program_level + defense_type

**No rates loaded:**
```
available_rates: 0  // ❌ Problem!
```
**Solution:** Check `/dean/payment-rates/data` endpoint

## Database Requirements

### Payment Rates Table

Must have entries like:
```sql
SELECT * FROM payment_rates 
WHERE program_level IN ('Masteral', 'Doctorate')
  AND defense_type IN ('Proposal', 'Pre-Final', 'Final')
  AND type IN ('Adviser', 'Panel Chair', 'School Share');
```

Example data:
```
| program_level | type        | defense_type | amount |
|--------------|-------------|--------------|--------|
| Masteral     | Adviser     | Proposal     | 3000   |
| Masteral     | Panel Chair | Proposal     | 5000   |
| Doctorate    | Adviser     | Proposal     | 4000   |
| Doctorate    | Panel Chair | Proposal     | 6000   |
```

### Defense Requests Table

Must have:
- `coordinator_user_id` - Foreign key to users table
- `program` - Program name (e.g., "Master of Arts in Education")
- `defense_type` - Type of defense (e.g., "Proposal", "Pre-Final", "Final")

## Files Modified

### Backend:
1. `app/Http/Controllers/DefenseRequestController.php`
   - Enhanced `showAADetails()` method
   - Added `program_level` to response
   - Added `coordinator` relationship data
   - Added `aa_verification_status` and `aa_verification_id`

### Frontend:
1. `resources/js/pages/assistant/all-defense-list/details.tsx`
   - Added debug logging to initial data load
   - Added debug logging to payment rates fetch
   - Enhanced `getMemberReceivable()` with detailed logging
   - Shows exact matching logic for each payment rate

## Expected Console Output

When everything works correctly:
```
🔍 Defense Request Details Loaded: {
  id: 123,
  program: "Master of Arts in Education",
  program_level: "Masteral",
  defense_type: "Proposal",
  coordinator: { id: 45, name: "Dr. Jane Smith", email: "jane@edu.ph" },
  panelists: {...}
}

📊 Fetching payment rates...
✅ Payment rates loaded: 24 rates
   Sample rates: [
     { program_level: "Masteral", type: "Adviser", defense_type: "Proposal", amount: 3000 },
     { program_level: "Masteral", type: "Panel Chair", defense_type: "Proposal", amount: 5000 },
     ...
   ]

🔍 Looking for payment rate: {
  program_level: "Masteral",
  rateType: "Adviser",
  defense_type: "Proposal",
  normalized: "proposal",
  available_rates: 24
}
   Checking rate: { matchesProgram: true, matchesType: true, matchesDefense: true }
✅ Found rate: 3000

🔍 Looking for payment rate: {
  program_level: "Masteral",
  rateType: "Panel Chair",
  defense_type: "Proposal",
  normalized: "proposal",
  available_rates: 24
}
   Checking rate: { matchesProgram: true, matchesType: true, matchesDefense: true }
✅ Found rate: 5000
```

## Troubleshooting

### Receivables still showing "—"

1. **Check backend response:**
   ```bash
   # In browser network tab, find the page request
   # Look for: defenseRequest.program_level
   ```

2. **Verify payment rates exist:**
   ```sql
   SELECT * FROM payment_rates;
   ```

3. **Check exact field values:**
   - `program_level` must match exactly: "Masteral" or "Doctorate" (case-sensitive)
   - `defense_type` normalized during comparison (case-insensitive)
   - `type` must be "Adviser" or "Panel Chair" (case-sensitive)

### Coordinator not showing

1. **Check defense_requests.coordinator_user_id:**
   ```sql
   SELECT id, coordinator_user_id FROM defense_requests WHERE id = X;
   ```

2. **Verify user exists:**
   ```sql
   SELECT id, name, email FROM users WHERE id = Y;
   ```

3. **Check relationship in model:**
   ```php
   // DefenseRequest.php
   public function coordinator() { 
     return $this->belongsTo(User::class, 'coordinator_user_id'); 
   }
   ```

## Summary

✅ **Fixed:** Missing `program_level` field in backend response
✅ **Fixed:** Missing `coordinator` relationship data
✅ **Fixed:** Missing `aa_verification_status` and `aa_verification_id`
✅ **Added:** Comprehensive debug logging for troubleshooting
✅ **Result:** Receivables now display correctly with proper currency formatting
✅ **Result:** Coordinator name and email now display in summary section

All AA view data now matches coordinator view functionality! 🎉
