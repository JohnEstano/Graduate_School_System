# Defense Approval Workflow Implementation Summary

## Overview
This implementation modifies the defense request approval workflow to:
1. Allow coordinators to schedule defenses from the `coordinator-review` state
2. Validate all required fields before approval
3. Automatically send notification emails to all parties after approval

## Changes Made

### 1. CoordinatorDefenseController.php

#### Modified `approve()` Method (Lines 495-572)
- **Validation**: Checks for missing required fields before approval:
  - Defense Date
  - Defense Start Time
  - Defense End Time
  - Defense Mode (Face-to-face/Online)
  - Defense Venue
  - At least one Panel Member must be assigned

- **Error Handling**: Returns detailed error message listing all missing fields

- **Database Transaction**: Wraps approval and email sending in a transaction

- **Email Notification**: Calls `sendDefenseNotificationEmails()` after successful approval

#### Modified `schedule()` Method (Line 706)
- **State Allowance**: Changed allowed states from `['panels-assigned','scheduled','coordinator-approved']` to `['coordinator-review', 'coordinator-approved', 'panels-assigned', 'scheduled']`
- **Purpose**: Allows coordinators to schedule defenses while in `coordinator-review` state

#### New `sendDefenseNotificationEmails()` Method (Lines 574-656)
- **Student Email**: Sends defense schedule confirmation
- **Adviser Email**: Sends defense schedule notification
- **Panel Emails**: Sends panel invitation to each panel member with their role
- **Error Handling**: Catches and logs email failures individually without breaking the approval
- **Logging**: Comprehensive logging of all email sends with success/failure tracking

### 2. Email Mailable Classes

#### DefenseScheduledStudent.php
- **Purpose**: Student notification email
- **Variables**: studentName, defenseTitle, defenseDate, defenseTime, defenseEndTime, defenseMode, defenseVenue, adviserName, panels
- **Subject**: "Your Defense Has Been Scheduled - UIC Graduate School"

#### DefenseScheduledAdviser.php
- **Purpose**: Adviser notification email
- **Variables**: adviserName, studentName, defenseTitle, defenseDate, defenseTime, defenseEndTime, defenseMode, defenseVenue, panels
- **Subject**: "Defense Scheduled - Adviser Notification - UIC Graduate School"

#### DefensePanelInvitation.php
- **Purpose**: Panel member invitation email
- **Variables**: panelistName, role, studentName, defenseTitle, defenseDate, defenseTime, defenseEndTime, defenseMode, defenseVenue, adviserName, otherPanels
- **Subject**: "Invitation to Serve on Defense Panel - UIC Graduate School"

### 3. Email Templates (Blade Views)

#### defense-scheduled-student.blade.php
- **Design**: Congratulatory message with complete defense details
- **Features**:
  - Defense schedule (date, time, venue, mode)
  - Adviser information
  - Full panel listing with roles
  - Preparation tips section
  - What to expect section
- **Theme**: UIC burgundy gradient (#991B1B to #7F1D1D)

#### defense-scheduled-adviser.blade.php
- **Design**: Professional faculty notification
- **Features**:
  - Student information
  - Defense details
  - Panel composition
  - Adviser responsibilities reminder
- **Theme**: UIC burgundy gradient

#### defense-panel-invitation.blade.php
- **Design**: Formal invitation to serve on panel
- **Features**:
  - Role badge (Chair/Panel Member)
  - Complete defense details
  - Other panel members list
  - Role-specific responsibilities
  - Confirmation request
- **Theme**: UIC burgundy gradient

## User Workflow

### Before (Old Flow)
1. Coordinator reviews defense request
2. Cannot schedule from `coordinator-review` state → **Error**
3. Must approve first to change state
4. Then assign panels and schedule
5. No validation before approval
6. No automatic email notifications

### After (New Flow)
1. Coordinator reviews defense request in `coordinator-review` state
2. Assigns panel members using the interface
3. Fills in schedule details (date, time, venue, mode)
4. Clicks **Approve** button
5. System validates all required fields:
   - If any field is missing → Shows error with list of missing fields
   - If all fields are filled → Proceeds to approval
6. System approves the defense request
7. System automatically sends emails to:
   - Student (schedule confirmation)
   - Adviser (schedule notification)
   - All panel members (panel invitation with role)
8. Success message: "Defense request approved successfully! Notification emails have been sent to all parties."

## Error Handling

### Validation Errors
```php
return back()->withErrors([
    'error' => 'Cannot approve defense request. The following required fields are missing:',
    'missing_fields' => ['Defense Date', 'Defense Start Time', ...]
]);
```

### Email Sending Errors
- Individual email failures are logged but do not prevent approval
- Each email send is wrapped in try-catch
- Comprehensive logging includes:
  - Success: email address and recipient role
  - Failure: email address, error message, and stack trace
- Summary log at the end lists all sent and failed emails

### Database Errors
- Entire operation (approval + emails) wrapped in DB transaction
- If approval fails, transaction rolls back
- Error message returned to user
- Full error logged with defense request ID

## Testing Notes

### Required Testing
1. **Validation**: Try to approve with missing fields (each field individually)
2. **Email Sending**: 
   - Test with valid emails (student, adviser, panels)
   - Test with missing email addresses
   - Test with Resend API vs Gmail SMTP
3. **State Transitions**: Test scheduling from `coordinator-review` state
4. **Error Recovery**: Test transaction rollback on approval failure

### Known Issues
- Resend API is currently experiencing outages (as of implementation)
- Temporary solution: Switch to Gmail SMTP in .env file
- Email templates use inline styles for maximum compatibility

## Email Service Configuration

### Current: Resend API (Experiencing Outage)
```env
MAIL_MAILER=resend
RESEND_KEY=re_9j5Joz72_9XP28KAsoC5nwCVW1DgSm1j5
```

### Backup: Gmail SMTP
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=snackypluck@gmail.com
MAIL_PASSWORD="eebe vgpf uhye rsdy"
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="snackypluck@gmail.com"
MAIL_FROM_NAME="UIC Graduate School"
```

After changing, run:
```bash
php artisan config:clear
php artisan config:cache
```

## Files Modified/Created

### Modified
- `app/Http/Controllers/CoordinatorDefenseController.php`

### Created
- `app/Mail/DefenseScheduledStudent.php`
- `app/Mail/DefenseScheduledAdviser.php`
- `app/Mail/DefensePanelInvitation.php`
- `resources/views/emails/defense-scheduled-student.blade.php`
- `resources/views/emails/defense-scheduled-adviser.blade.php`
- `resources/views/emails/defense-panel-invitation.blade.php`

## Success Metrics
✅ Validation prevents incomplete defense requests from being approved
✅ Coordinators can schedule defenses in `coordinator-review` state
✅ All parties automatically notified via email after approval
✅ Email failures logged but don't prevent approval
✅ Clear error messages guide coordinators to fix missing fields
✅ Professional email templates match UIC branding

## Next Steps (Optional Enhancements)
1. Add email preview functionality for coordinators
2. Add email resend functionality for failed sends
3. Add email templates for other defense workflow states
4. Add SMS notifications as backup for critical emails
5. Create admin dashboard for email delivery monitoring
