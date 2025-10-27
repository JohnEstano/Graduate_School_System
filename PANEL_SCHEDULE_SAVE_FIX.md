# Panel & Schedule Save Fix - Complete Solution

## Problem Identified
After coordinator approval, the assigned panelists and schedule information weren't being saved to the database. The data would appear in the UI but disappear after page refresh.

## Root Causes

### 1. **Incorrect API Route in saveSchedule()**
**File:** `resources/js/pages/coordinator/submissions/defense-request/details.tsx`

**Issue:** The `saveSchedule()` function was calling the wrong endpoint:
```typescript
// WRONG - This route doesn't exist
`/coordinator/defense-requests/${request.id}/schedule-json`

// CORRECT - This is the actual route defined in web.php
`/coordinator/defense-requests/${request.id}/schedule`
```

**Routes defined in `web.php`:**
```php
Route::post('/defense-requests/{id}/panels', [DefenseRequestController::class, 'savePanels']);
Route::post('/defense-requests/{id}/schedule', [DefenseRequestController::class, 'saveSchedule']);
```

### 2. **Panels & Schedule Not Saved Before Approval**
**Flow Issue:** When coordinator clicked "Approve & Sign" button, it directly opened the `CoordinatorApproveDialog` WITHOUT saving the panels and schedule first. The dialog would:
1. Generate PDF with coordinator signature
2. Update coordinator_status to 'Approved'
3. Trigger page reload

But the panels and schedule data from the form were **never sent to the backend**, so they were lost.

## Solution Implemented

### Fix 1: Corrected API Route
**File:** `details.tsx` line ~570

**Change:**
```typescript
// Before
const res = await fetchWithCsrfRetry(
  `/coordinator/defense-requests/${request.id}/schedule-json`,
  ...
);

// After
const res = await fetchWithCsrfRetry(
  `/coordinator/defense-requests/${request.id}/schedule`,
  ...
);
```

### Fix 2: Auto-Save Before Opening Approval Dialog
**File:** `details.tsx` lines ~616-672

**Added new function:**
```typescript
async function handleOpenApprovalDialog() {
  if (!request.id) return;

  const toastId = toast.loading('Saving panels and schedule before approval...');
  
  try {
    // 1. Save panels first
    const panelsRes = await fetchWithCsrfRetry(
      `/coordinator/defense-requests/${request.id}/panels`,
      { method: 'POST', body: JSON.stringify(panels) }
    );
    
    if (!panelsRes.ok) {
      toast.error('Failed to save panel assignments');
      return;
    }

    // 2. Save schedule
    const scheduleRes = await fetchWithCsrfRetry(
      `/coordinator/defense-requests/${request.id}/schedule`,
      { method: 'POST', body: JSON.stringify(schedule) }
    );
    
    if (!scheduleRes.ok) {
      toast.error('Failed to save schedule information');
      return;
    }

    toast.success('Panels and schedule saved successfully!');
    
    // 3. Update local state
    const scheduleData = await scheduleRes.json();
    if (scheduleData.request) {
      setRequest(scheduleData.request);
    }
    
    // 4. NOW open the approval dialog
    setApproveDialogOpen(true);
    
  } catch (err) {
    toast.error('Failed to save panels and schedule. Please try again.');
  }
}
```

**Updated button:**
```typescript
// Before
<Button onClick={() => setApproveDialogOpen(true)}>
  Approve & Sign
</Button>

// After
<Button onClick={handleOpenApprovalDialog}>
  Approve & Sign
</Button>
```

### Fix 3: Improved Error Handling in handleStatusChange
**File:** `details.tsx` lines ~621-660

**Enhancement:** Added proper error handling and toast notifications when saving panels/schedule fails during the approve/reject/retrieve actions.

## Complete Workflow Now

### When Coordinator Approves (New Flow):

1. **Coordinator fills in panels and schedule** in the "Assign & Schedule" tab
2. **Coordinator clicks "Approve & Sign"** button
3. **✅ NEW:** `handleOpenApprovalDialog()` executes:
   - Saves panels to database via `/coordinator/defense-requests/{id}/panels`
   - Saves schedule to database via `/coordinator/defense-requests/{id}/schedule`
   - Shows success toast
   - Updates local state
4. **Only then:** Opens `CoordinatorApproveDialog`
5. Coordinator generates PDF with signature
6. Coordinator clicks "Approve" in dialog
7. Dialog updates coordinator_status and triggers page reload
8. **✅ Panels and schedule are now persisted in database!**

## Database Updates

The backend methods already existed and were working correctly:

**`DefenseRequestController::savePanels()`** (lines 2053-2101):
- Saves all 5 panel members to database
- Updates `workflow_state` to 'panels-assigned'
- Adds workflow history entry
- Returns updated request data

**`DefenseRequestController::saveSchedule()`** (lines 2105-2158):
- Validates required fields (date, time, mode, venue)
- Saves schedule information to database
- Updates `workflow_state` to 'scheduled'
- Adds workflow history entry
- Returns updated request data

## Testing Checklist

- [x] Route correction: `/schedule-json` → `/schedule`
- [x] Auto-save function added before approval dialog
- [x] Button updated to call new function
- [x] Error handling with user-friendly toasts
- [ ] **Test: Fill in panels and schedule, click "Approve & Sign"**
  - Should see "Saving panels and schedule before approval..." toast
  - Should see "Panels and schedule saved successfully!" toast
  - Dialog should open
- [ ] **Test: Approve in dialog, then refresh page**
  - Panels should still be there
  - Schedule should still be there
  - workflow_state should be 'scheduled' then 'coordinator-approved'
- [ ] **Test: Check database directly**
  - `defense_chairperson`, `defense_panelist1-4` columns populated
  - `scheduled_date`, `scheduled_time`, `scheduled_end_time` populated
  - `defense_mode`, `defense_venue` populated
  - `workflow_state` updated correctly

## Files Modified

1. **`resources/js/pages/coordinator/submissions/defense-request/details.tsx`**
   - Fixed API route in `saveSchedule()` function (line ~570)
   - Added `handleOpenApprovalDialog()` function (lines ~616-672)
   - Updated "Approve & Sign" button onClick handler (line ~1059)
   - Improved error handling in `handleStatusChange()` (lines ~677-715)

## Backend Support (No Changes Needed)

✅ All backend routes and methods were already working correctly:
- `POST /coordinator/defense-requests/{id}/panels` → `DefenseRequestController::savePanels`
- `POST /coordinator/defense-requests/{id}/schedule` → `DefenseRequestController::saveSchedule`
- `PATCH /coordinator/defense-requirements/{id}/coordinator-status` → `DefenseRequestController::updateCoordinatorStatus`

## Summary

The issue was a **frontend coordination problem**, not a backend problem. The solution ensures that panels and schedule data are **explicitly saved to the database** before the coordinator approval dialog opens, guaranteeing data persistence throughout the entire approval workflow.
