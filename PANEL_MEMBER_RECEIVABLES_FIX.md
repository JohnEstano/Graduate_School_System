# Panel Member Receivables Fix - Individual Records

## Problem
Panel members in individual records were all receiving the same payment rate (Panel Member 1's rate) instead of their own numbered rates.

### Affected Pages
- `/student-records` - Individual student record view
- `/honorarium` - Individual panelist record view

## Root Cause
In `StudentRecordController.php`, the code was:
```php
// ❌ WRONG: All panel members used the same rate
$memberRate = $rates->get('Panel Member 1') ?? $rates->get('Panel Member');

if ($defense->defense_panelist1) {
    $panelists[] = [
        'role' => 'Panel Member',
        'amount' => $memberRate ? $memberRate->amount : 0,
    ];
}
// ... same for panelist2, panelist3, panelist4
```

This caused all panel members to receive the same amount (Panel Member 1's rate).

## Solution
Each panel member now gets their own numbered rate:

```php
// ✅ CORRECT: Each panel member gets their own numbered rate
if ($defense->defense_panelist1) {
    $memberRate1 = $rates->get('Panel Member 1') ?? $rates->get('Panel Member');
    $panelists[] = [
        'role' => 'Panel Member 1',
        'amount' => $memberRate1 ? $memberRate1->amount : 0,
    ];
}

if ($defense->defense_panelist2) {
    $memberRate2 = $rates->get('Panel Member 2') ?? $rates->get('Panel Member 1') ?? $rates->get('Panel Member');
    $panelists[] = [
        'role' => 'Panel Member 2',
        'amount' => $memberRate2 ? $memberRate2->amount : 0,
    ];
}

if ($defense->defense_panelist3) {
    $memberRate3 = $rates->get('Panel Member 3') ?? $rates->get('Panel Member 1') ?? $rates->get('Panel Member');
    $panelists[] = [
        'role' => 'Panel Member 3',
        'amount' => $memberRate3 ? $memberRate3->amount : 0,
    ];
}

if ($defense->defense_panelist4) {
    $memberRate4 = $rates->get('Panel Member 4') ?? $rates->get('Panel Member 1') ?? $rates->get('Panel Member');
    $panelists[] = [
        'role' => 'Panel Member 4',
        'amount' => $memberRate4 ? $memberRate4->amount : 0,
    ];
}
```

## Database Structure
Payment rates are stored with numbered types:
- "Adviser" → ₱1,001
- "Panel Chair" → ₱200
- "Panel Member 1" → ₱300
- "Panel Member 2" → ₱300
- "Panel Member 3" → ₱300
- "Panel Member 4" → ₱300

## Changes Made
**File:** `app/Http/Controllers/StudentRecordController.php`
- Lines 268-314: Updated panel member rate lookup logic
- Each panel member now fetches their own numbered rate from the database
- Added fallback logic to ensure rates are found even if specific numbered rate is missing

## Testing
1. Navigate to `/student-records`
2. Click on a student with multiple panel members
3. Expand the payment details
4. Verify each panel member shows their correct receivable amount

## Notes
- HonorariumSummaryController does NOT need this fix as it uses actual payment records from the database
- The fix only applies to StudentRecordController which generates payment data on-the-fly
- Fallback logic ensures backward compatibility if numbered rates don't exist
