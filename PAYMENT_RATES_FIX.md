# Payment Rates Calculation Fix

## Problem Identified

The payment rates were **stored in the database** but **not calculated** in the coordinator and AA details pages.

## Root Cause

**Database vs. Code Mismatch:**
- **Database** stores payment rates with types: `"Panel Member 1"`, `"Panel Member 2"`, `"Panel Member 3"`, `"Panel Member 4"` (with numbers)
- **Code** was mapping all panel member roles to `"Panel Member"` (without number)
- **Result**: No matches found because the code searched for `"Panel Member"` but database only had `"Panel Member 1"`, etc.

### Example of the Issue:
```
Frontend role: "Panel Member 1"
Code mapped to: "Panel Member"  ❌
Database has:   "Panel Member 1" ✓
Match:          NO ❌
```

## Diagnostic Results

### Database Content (from tinker):
```json
{
  "rates": [
    { "program_level": "Masteral", "type": "Adviser", "defense_type": "Proposal", "amount": 1001 },
    { "program_level": "Masteral", "type": "Panel Chair", "defense_type": "Proposal", "amount": 200 },
    { "program_level": "Masteral", "type": "Panel Member 1", "defense_type": "Proposal", "amount": 300 },
    { "program_level": "Masteral", "type": "Panel Member 2", "defense_type": "Proposal", "amount": 300 },
    { "program_level": "Masteral", "type": "Panel Member 3", "defense_type": "Proposal", "amount": 300 },
    { "program_level": "Masteral", "type": "Panel Member 4", "defense_type": "Proposal", "amount": 300 }
  ]
}
```

### Why Adviser and Panel Chair Worked:
- ✅ **Adviser**: Exact match - database has `"Adviser"`, code searches for `"Adviser"`
- ✅ **Panel Chair**: Exact match - database has `"Panel Chair"`, code searches for `"Panel Chair"`
- ❌ **Panel Members**: NO match - database has `"Panel Member 1"`, code searched for `"Panel Member"`

## Solution

Changed the role mapping logic to **preserve the number** in panel member roles:

### Before (WRONG):
```typescript
else if (role.includes('Panel Member')) {
  // Panel Member 1, Panel Member 2, etc. -> Panel Member
  rateType = 'Panel Member';  // ❌ Strips the number!
}
```

### After (CORRECT):
```typescript
else if (role.includes('Panel Member')) {
  // Keep the full role name including number
  rateType = role;  // ✅ Keeps "Panel Member 1", "Panel Member 2", etc.
}
```

## Files Fixed

1. ✅ `resources/js/pages/coordinator/submissions/defense-request/details.tsx`
   - Fixed `getMemberReceivable()` function
   
2. ✅ `resources/js/pages/assistant/all-defense-list/details.tsx`
   - Fixed `getMemberReceivable()` function

## Expected Behavior After Fix

### Committee Table Display:
```
Name & Email              | Role            | Receivable
-------------------------|-----------------|-------------
Dr. John Adviser         | Adviser         | ₱1,001.00
Dr. Jane Chair           | Panel Chair     | ₱200.00
Dr. Bob Member           | Panel Member 1  | ₱300.00
Dr. Alice Smith          | Panel Member 2  | ₱300.00
Dr. Charlie Brown        | Panel Member 3  | ₱300.00
Dr. Eve Johnson          | Panel Member 4  | ₱300.00  (Doctorate only)
```

## Testing Verification

Run the test script:
```bash
node test_rate_fix.js
```

Expected output:
```
=== TESTING RATE LOOKUPS ===

Looking for: role="Adviser" -> rateType="Adviser"
✓ Found: Adviser = 1001
Adviser: ₱1001

Looking for: role="Panel Chair" -> rateType="Panel Chair"
✓ Found: Panel Chair = 200
Panel Chair: ₱200

Looking for: role="Panel Member 1" -> rateType="Panel Member 1"
✓ Found: Panel Member 1 = 300
Panel Member 1: ₱300

Looking for: role="Panel Member 2" -> rateType="Panel Member 2"
✓ Found: Panel Member 2 = 300
Panel Member 2: ₱300

Looking for: role="Panel Member 3" -> rateType="Panel Member 3"
✓ Found: Panel Member 3 = 300
Panel Member 3: ₱300
```

## Browser Console Debugging

When viewing a defense request, check the browser console (F12) for logs:

### Success:
```
💰 Rate Lookup: {originalRole: "Panel Member 1", mappedRateType: "Panel Member 1", ...}
✅ Rate found: {program_level: "Masteral", type: "Panel Member 1", amount: 300}
```

### Failure (old code):
```
💰 Rate Lookup: {originalRole: "Panel Member 1", mappedRateType: "Panel Member", ...}
❌ No rate found: {role: "Panel Member 1", rateType: "Panel Member", ...}
```

## Additional Notes

- The fix maintains compatibility with both "Panel Chair" and "Chairperson" mappings
- Handles edge case for generic "Panelist" role by defaulting to "Panel Member 1"
- All defense type normalization remains the same (case-insensitive)
- Program level matching remains exact (case-sensitive)

## Deployment

1. ✅ Changes made to TypeScript files
2. 🔄 Build frontend assets: `npm run build` or `npm run dev`
3. 🧪 Test in browser with active defense requests
4. ✅ Verify receivables display correctly in both Coordinator and AA views
