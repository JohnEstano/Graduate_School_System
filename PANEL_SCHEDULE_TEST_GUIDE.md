# Quick Test Guide - Panel & Schedule Save Fix

## Quick Test (5 minutes)

### 1. Navigate to a Defense Request as Coordinator
```
Go to: /coordinator/defense-requests/{id}/details
```

### 2. Fill in Panel Assignments (Assign & Schedule Tab)
- Click "Assign & Schedule" tab
- Fill in:
  - Defense Chairperson
  - Panelist 1
  - Panelist 2
  - Panelist 3 (optional)
  - Panelist 4 (optional)

### 3. Fill in Schedule Information
- Scheduled Date: Pick any future date
- Start Time: e.g., 9:00 AM
- End Time: e.g., 11:00 AM (must be after start time)
- Defense Mode: Select "Face-to-Face" or "Online"
- Defense Venue: e.g., "Room 301"
- Notes: (optional) "Thesis defense for Spring 2025"

### 4. Click "Approve & Sign" Button
**Expected Behavior:**
- ✅ Toast appears: "Saving panels and schedule before approval..."
- ✅ Toast appears: "Panels and schedule saved successfully!"
- ✅ Approval dialog opens

**If you see errors:**
- Check browser console for network errors
- Verify routes are accessible: `/coordinator/defense-requests/{id}/panels` and `/coordinator/defense-requests/{id}/schedule`

### 5. In the Approval Dialog
- Review the endorsement form
- Make sure you have an active signature
- Enter coordinator full name
- Click "Generate Document" (optional, to see signature on PDF)
- Click "Approve" button

**Expected:**
- ✅ Document saved with coordinator signature
- ✅ Status updated to "Approved"
- ✅ Dialog closes
- ✅ Page reloads with updated data

### 6. CRITICAL: Refresh the Page (F5)
**Expected:**
- ✅ Panel assignments still visible in UI
- ✅ Schedule information still visible in UI
- ✅ Workflow state shows "coordinator-approved"

**If data disappeared after refresh:**
- Check browser console for API errors
- Check Laravel logs: `storage/logs/laravel.log`
- Verify database columns are being updated

### 7. Verify in Database (Optional)
```sql
SELECT 
  id,
  defense_chairperson,
  defense_panelist1,
  defense_panelist2,
  defense_panelist3,
  defense_panelist4,
  scheduled_date,
  scheduled_time,
  scheduled_end_time,
  defense_mode,
  defense_venue,
  workflow_state,
  coordinator_status
FROM defense_requests
WHERE id = YOUR_REQUEST_ID;
```

**Expected:**
- All panel fields populated with names
- All schedule fields populated with values
- `workflow_state` = 'coordinator-approved'
- `coordinator_status` = 'Approved'

## Common Issues & Solutions

### Issue: "Failed to save panel assignments" toast
**Cause:** Route not found or validation error
**Solution:** 
- Check route exists: `php artisan route:list | grep panels`
- Check Laravel logs for validation errors
- Verify coordinator has permission (role check)

### Issue: "End time must be after start time" toast
**Cause:** Invalid time range
**Solution:** 
- Make sure End Time is later than Start Time
- Use 24-hour format or proper AM/PM

### Issue: Data saves but disappears after refresh
**Cause:** Frontend state not syncing with backend response
**Solution:** 
- Check if API returns updated `request` object
- Verify `setRequest()` is called with response data
- Check Inertia reload is working: `router.reload({ only: ['defenseRequest'] })`

### Issue: Dialog doesn't open after clicking "Approve & Sign"
**Cause:** Auto-save failed silently
**Solution:**
- Open browser console and check for errors
- Look for failed network requests (red in Network tab)
- Check if CSRF token is valid

## Success Criteria

✅ **All of these must be true:**
1. Toast messages appear when clicking "Approve & Sign"
2. Approval dialog opens after successful save
3. Approval completes without errors
4. **Page refresh keeps all panel and schedule data**
5. Database contains all saved values
6. Workflow state progresses correctly

## Next Steps After Testing

If all tests pass:
- ✅ Mark this fix as complete
- ✅ Document in changelog
- ✅ Deploy to staging/production

If tests fail:
- Check browser console errors
- Check Laravel logs: `tail -f storage/logs/laravel.log`
- Verify CSRF token is being sent
- Verify user has coordinator role
- Check database permissions
