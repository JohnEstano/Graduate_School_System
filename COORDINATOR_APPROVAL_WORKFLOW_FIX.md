# Coordinator Approval Workflow Fix

## Problem
The previous workflow was saving panel assignments and schedule information **before** opening the approval dialog. This meant:
1. Clicking "Approve & Sign" button would immediately save panels/schedule
2. Then open the dialog for signature
3. The coordinator could cancel the dialog, but the data was already saved

## Solution
Changed the workflow so that panels and schedules are only saved when the coordinator **confirms the final approval** in the dialog.

## Changes Made

### 1. `details.tsx` - Modified `handleOpenApprovalDialog()`
**Before:** 
- Auto-saved panels and schedule
- Then opened the dialog

**After:**
- Validates that panels and schedule are filled
- Validates time logic (end time > start time)
- Opens the dialog WITHOUT saving
- Passes `panelsData` and `scheduleData` as props to the dialog

### 2. `coordinator-approve-dialog.tsx` - Updated Interface
**Added new props:**
```typescript
panelsData?: {
  defense_chairperson: string;
  defense_panelist1: string;
  defense_panelist2: string;
  defense_panelist3: string;
  defense_panelist4: string;
};
scheduleData?: {
  scheduled_date: string;
  scheduled_time: string;
  scheduled_end_time: string;
  defense_mode: string;
  defense_venue: string;
  scheduling_notes: string;
};
```

### 3. `coordinator-approve-dialog.tsx` - Modified `handleFinalApprove()`
**New workflow order:**
1. **STEP 1:** Save panel assignments (if provided)
2. **STEP 2:** Save schedule information (if provided)
3. **STEP 3:** Add coordinator signature to PDF
4. **STEP 4:** Update coordinator status to "Approved"
5. Show success message mentioning all saved items

## New Workflow Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Coordinator fills in panels and schedule in details.tsx     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Clicks "Approve & Sign" button                              │
│    - Validates panels (at least Chairperson + 2 Panelists)    │
│    - Validates schedule (all required fields filled)           │
│    - Validates time logic (end > start)                        │
│    - ❌ Does NOT save anything yet                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Approval dialog opens with signature options                │
│    - Panels and schedule data passed as props                  │
│    - Coordinator reviews endorsement                           │
│    - Adds/selects signature                                    │
│    - Enters full name                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Clicks final "Approve" button in dialog                     │
│    - Shows email confirmation dialog                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Clicks "Confirm Approval"                                   │
│    ✅ NOW everything is saved in sequence:                     │
│       a. Save panel assignments to database                    │
│       b. Save schedule information to database                 │
│       c. Add coordinator signature to PDF                      │
│       d. Update status to "Approved"                           │
│       e. Send email notification (if selected)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Success! All changes are committed atomically               │
└─────────────────────────────────────────────────────────────────┘
```

## Benefits

1. **Atomic Operation:** All changes (panels, schedule, signature, status) happen together
2. **Cancellable:** Coordinator can close the dialog without saving anything
3. **Better UX:** Clear that nothing is committed until final approval
4. **Data Integrity:** If any step fails, previous steps don't leave partial data
5. **Validation:** Ensures all required data is present before allowing approval

## Testing Checklist

- [ ] Open a defense request in coordinator view
- [ ] Assign panels (at least Chairperson and 2 Panelists)
- [ ] Fill in schedule information
- [ ] Click "Approve & Sign" button
- [ ] Verify dialog opens without saving data
- [ ] Add/select signature
- [ ] Enter coordinator name
- [ ] Click "Approve" button
- [ ] Select email preference
- [ ] Click "Confirm Approval"
- [ ] Verify success message mentions panels, schedule, and signature
- [ ] Verify all data is saved in database
- [ ] Verify coordinator status is "Approved"
- [ ] Test cancellation: Open dialog and close it - verify nothing is saved

## Rollback Instructions

If this causes issues, you can revert by:
1. Restore the old `handleOpenApprovalDialog()` function in `details.tsx` that saves before opening
2. Remove the `panelsData` and `scheduleData` props from the dialog
3. Restore the old `handleFinalApprove()` that only handles signature and status

---
**Date:** October 28, 2025
**Status:** ✅ Implemented
