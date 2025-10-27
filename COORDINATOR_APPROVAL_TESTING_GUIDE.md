# Coordinator Approval - Testing Guide

## Quick Test Steps

### 1. Setup Test Data
```sql
-- Check if you have a defense request ready for coordinator approval
SELECT id, thesis_title, workflow_state, coordinator_status, defense_chairperson, scheduled_date
FROM defense_requests 
WHERE workflow_state = 'adviser-approved'
LIMIT 1;
```

### 2. Test the Fix

#### Step 1: Navigate to Details Page
1. Login as Coordinator
2. Go to Defense Requests
3. Click on a request that's in "Endorsed by Adviser" state

#### Step 2: Fill Panel Assignments
1. Click the "Assign & Schedule" tab
2. Fill in the panel members:
   - Defense Chairperson
   - Panelist 1
   - Panelist 2
   - Panelist 3 (optional)
   - Panelist 4 (optional)
3. **Don't click Save yet!**

#### Step 3: Fill Schedule Information
1. In the same "Assign & Schedule" tab
2. Fill in the schedule:
   - Defense Date
   - Start Time
   - End Time
   - Defense Mode (Online/Face-to-Face/Hybrid)
   - Venue
   - Notes (optional)
3. **Don't click Save yet!**

#### Step 4: Approve Request
1. Click the "Approve Request" button (top right)
2. The approval dialog will open
3. You'll see the endorsement form preview
4. Click the "Approve & Send Email" or "Approve" button
5. Wait for success message

#### Step 5: Verify Everything Was Saved
Open your browser console (F12) and check the logs:
```
✅ Document saved successfully, updating coordinator status...
📋 Including panel assignments: {...}
📅 Including schedule data: {...}
📤 Updating coordinator status with payload: {...}
✅ Approval successful
```

### 3. Database Verification

Run this query to verify all data was saved:

```sql
SELECT 
  id,
  thesis_title,
  coordinator_status,
  workflow_state,
  -- Panel assignments
  defense_chairperson,
  defense_panelist1,
  defense_panelist2,
  defense_panelist3,
  defense_panelist4,
  panels_assigned_at,
  -- Schedule
  scheduled_date,
  scheduled_time,
  scheduled_end_time,
  defense_mode,
  defense_venue,
  scheduling_notes,
  -- Document
  endorsement_form,
  -- Metadata
  last_status_updated_at,
  last_status_updated_by
FROM defense_requests 
WHERE id = <YOUR_TEST_REQUEST_ID>;
```

### Expected Results:
✅ `coordinator_status` = 'Approved'
✅ `workflow_state` = 'scheduled' (if both panels and schedule provided)
✅ `defense_chairperson` = (the name you entered)
✅ `defense_panelist1` = (the name you entered)
✅ `scheduled_date` = (the date you entered)
✅ `scheduled_time` = (the time you entered)
✅ `defense_mode` = (Online/Face-to-Face/Hybrid)
✅ `defense_venue` = (the venue you entered)
✅ `endorsement_form` = (file path, e.g., 'defense_documents/xyz.pdf')
✅ `panels_assigned_at` = (recent timestamp)
✅ `last_status_updated_at` = (recent timestamp)

### 4. Check Workflow History

```sql
SELECT JSON_PRETTY(workflow_history) 
FROM defense_requests 
WHERE id = <YOUR_TEST_REQUEST_ID>;
```

You should see an entry like:
```json
{
  "event_type": "coordinator-status-update",
  "from_state": "adviser-approved",
  "to_state": "scheduled",
  "description": "Coordinator updated status to Approved and assigned panels and set schedule",
  "user_name": "Your Name",
  "created_at": "2025-10-27 ..."
}
```

### 5. Check File Upload

```bash
# Navigate to storage
cd storage/app/public/defense_documents

# List recent files
ls -lt | head -5
```

You should see the endorsement form PDF file.

### 6. Check Logs

```bash
# View the Laravel log
tail -f storage/logs/laravel.log
```

Look for entries like:
```
[2025-10-27 ...] local.INFO: uploadDocuments called {"defense_request_id":123,...}
[2025-10-27 ...] local.INFO: Endorsement form uploaded {"path":"defense_documents/xyz.pdf",...}
[2025-10-27 ...] local.INFO: Panels saved during coordinator approval {...}
[2025-10-27 ...] local.INFO: Schedule saved during coordinator approval {...}
[2025-10-27 ...] local.INFO: Coordinator status updated successfully {...}
```

## Common Issues & Solutions

### Issue 1: "Failed to save document"
**Solution:** Check file upload permissions
```bash
chmod -R 775 storage/app/public/defense_documents
```

### Issue 2: Panels not saving
**Problem:** Panel data not being passed from details page
**Solution:** Make sure you filled the panel fields before clicking Approve

### Issue 3: Schedule not saving  
**Problem:** Schedule data not being passed from details page
**Solution:** Make sure you filled the schedule fields before clicking Approve

### Issue 4: Email not sent
**Check:** Mailpit is running
```bash
# Check if Mailpit is accessible
curl http://localhost:8025
```

### Issue 5: Database shows NULL for panels
**Debug:** Check browser console for the payload being sent
```javascript
// You should see in console:
{
  coordinator_status: "Approved",
  send_email: true,
  defense_chairperson: "Dr. Smith",
  defense_panelist1: "Dr. Jones",
  scheduled_date: "2025-11-15",
  // ... etc
}
```

## Advanced Testing

### Test Different Scenarios:

#### Scenario A: Panels Only
1. Fill panels
2. Leave schedule empty
3. Approve
4. **Expected:** `workflow_state` = 'panels-assigned'

#### Scenario B: Schedule Only
1. Leave panels empty
2. Fill schedule
3. Approve
4. **Expected:** `workflow_state` = 'coordinator-approved'

#### Scenario C: Full Data
1. Fill both panels and schedule
2. Approve
3. **Expected:** `workflow_state` = 'scheduled'

#### Scenario D: No Data (Just Endorsement Form)
1. Leave panels and schedule empty
2. Approve
3. **Expected:** `workflow_state` = 'coordinator-approved', panels and schedule remain NULL

## Success Criteria

✅ All panel members saved to database
✅ All schedule fields saved to database
✅ Endorsement form file saved to storage
✅ Workflow state updated correctly
✅ Workflow history logged
✅ Email sent (if selected)
✅ No errors in browser console
✅ No errors in Laravel logs
✅ Page refreshes and shows "Approved" status

---

**If all checks pass, the fix is working correctly!** 🎉
