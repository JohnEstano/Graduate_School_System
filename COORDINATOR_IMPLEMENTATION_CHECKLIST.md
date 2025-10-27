# ✅ Coordinator Workflow Implementation Checklist

## Overview
This checklist ensures all coordinator workflow fixes have been properly implemented and tested.

---

## 1. Panel Assignment Based on Program Level

### Implementation
- [ ] **File Created/Modified**: `resources/js/pages/coordinator/submissions/defense-request/details.tsx`
- [ ] Panel assignment section updated with conditional rendering
- [ ] Helper text added showing program requirements
- [ ] Committee table updated to show only relevant members

### Testing
- [ ] Open Masteral defense request as coordinator
- [ ] Verify only 3 panel fields visible (Chairperson, Panelist 1, Panelist 2)
- [ ] Verify helper text: "Masteral program: 3 panel members required"
- [ ] Open Doctorate defense request as coordinator
- [ ] Verify all 4 panel fields visible (Chairperson, Panelist 1-4)
- [ ] Verify helper text: "Doctorate program: 4 panel members required"
- [ ] Verify Committee table shows only assigned members
- [ ] Verify payment rates display correctly for each member

### Validation
- [ ] No errors in browser console
- [ ] Panel comboboxes work correctly
- [ ] Can assign different panel members successfully
- [ ] Duplicate assignment prevention works
- [ ] Clear button (X) works on comboboxes

---

## 2. Coordinator Approve Dialog

### Implementation
- [ ] **File Created**: `resources/js/pages/coordinator/submissions/defense-request/coordinator-approve-dialog.tsx`
- [ ] Three-tab interface implemented (Preview, Signature, Upload)
- [ ] Signature management system integrated
- [ ] Document generation with role='coordinator'
- [ ] Approval workflow with status update

### Component Integration
- [ ] Dialog imported in `details.tsx`
- [ ] State added: `approveDialogOpen`
- [ ] "Approve & Sign" button opens dialog
- [ ] Dialog passes correct props (defenseRequest, coordinatorId, etc.)
- [ ] `onApproveComplete` callback refreshes page

### Preview Tab
- [ ] Auto-generates document on dialog open
- [ ] Displays PDF in iframe
- [ ] Shows loading state while generating
- [ ] "Regenerate" button works
- [ ] PDF displays correctly

### Signature Tab
- [ ] Loads user's saved signatures
- [ ] Shows active signature with badge
- [ ] "Draw New Signature" opens signature canvas
- [ ] Canvas has guideline
- [ ] "Clear" button works on canvas
- [ ] "Save Signature" saves and adds to list
- [ ] Can activate different signatures
- [ ] Active badge updates correctly

### Upload Tab
- [ ] Drag-and-drop area works
- [ ] File browser button works
- [ ] Only accepts PDF files
- [ ] Shows selected file info
- [ ] "Remove" button clears selection
- [ ] "Use This File" creates preview

### Approval Flow
- [ ] "Approve & Sign" button disabled without active signature
- [ ] Button disabled without generated document
- [ ] Clicking button shows loading state
- [ ] Success saves endorsement form to database
- [ ] Success updates coordinator_status to "Approved"
- [ ] Success shows toast notification
- [ ] Success triggers onApproveComplete callback
- [ ] Error handling shows appropriate messages

### Testing
- [ ] Open coordinator details page
- [ ] Click "Approve & Sign" button
- [ ] Verify dialog opens
- [ ] Navigate between tabs
- [ ] Test all features listed above
- [ ] Complete full approval workflow
- [ ] Verify no console errors
- [ ] Verify no network errors

---

## 3. Role-Based Document Field Filtering

### Frontend Implementation
- [ ] **File Modified**: `resources/js/pages/adviser/defense-requirements/endorsement-dialog.tsx`
  - [ ] Added `role: 'adviser'` to generate-document request
- [ ] **File Modified**: `resources/js/pages/coordinator/submissions/defense-request/coordinator-approve-dialog.tsx`
  - [ ] Added `role: 'coordinator'` to generate-document request

### Backend Implementation
- [ ] **File Modified**: `app/Http/Controllers/GeneratedDocumentController.php`
  - [ ] Added `role` parameter validation
  - [ ] Passes role to DocumentGenerator service
- [ ] **File Modified**: `app/Services/DocumentGenerator.php`
  - [ ] Updated `generate()` method signature to accept `$role` parameter
  - [ ] Added role-based field filtering logic in field rendering loop
  - [ ] Adviser role skips coordinator/dean fields
  - [ ] Coordinator role skips adviser signature (preserves it)

### Testing - Adviser Role
- [ ] Login as adviser
- [ ] Open defense request details
- [ ] Click "Endorse" button
- [ ] Generate endorsement form
- [ ] Download and open PDF
- [ ] **Verify**: Adviser signature is present
- [ ] **Verify**: Adviser name is filled
- [ ] **Verify**: Student info is filled
- [ ] **Verify**: Schedule info is filled
- [ ] **Verify**: Committee names are filled
- [ ] **Verify**: Coordinator signature is EMPTY/BLANK
- [ ] **Verify**: Coordinator name is EMPTY/BLANK
- [ ] **Verify**: Dean signature is EMPTY/BLANK
- [ ] **Verify**: Dean name is EMPTY/BLANK
- [ ] Submit endorsement

### Testing - Coordinator Role
- [ ] Login as coordinator
- [ ] Open same defense request (after adviser endorsed)
- [ ] Click "Approve & Sign"
- [ ] Generate endorsement form
- [ ] Review in preview tab
- [ ] **Verify**: Adviser signature is STILL present (preserved)
- [ ] **Verify**: Adviser name is STILL filled (preserved)
- [ ] **Verify**: Student info is filled
- [ ] **Verify**: Schedule info is filled
- [ ] **Verify**: Committee names are filled
- [ ] **Verify**: Coordinator signature is NOW present
- [ ] **Verify**: Coordinator name is NOW filled
- [ ] **Verify**: Dean fields are filled (if applicable)
- [ ] Complete approval

### Validation
- [ ] Check Laravel logs for field filtering messages
- [ ] Verify no errors during document generation
- [ ] Compare adviser-generated PDF with coordinator-generated PDF
- [ ] Confirm progressive field filling (adviser → coordinator)

---

## 4. Backend API for Coordinator Status

### Implementation
- [ ] **Route Added**: `routes/web.php`
  - [ ] PATCH `/coordinator/defense-requirements/{id}/coordinator-status`
  - [ ] Middleware: `auth`
  - [ ] Route name: `coordinator.defense-requirements.coordinator-status`
- [ ] **Method Added**: `DefenseRequestController::updateCoordinatorStatus()`
  - [ ] Authorization check (Coordinator/AA/Dean)
  - [ ] Request validation (coordinator_status, coordinator_user_id)
  - [ ] Database transaction
  - [ ] Status update
  - [ ] Workflow state update
  - [ ] Workflow history logging
  - [ ] Response with updated request

### Testing
- [ ] Open browser DevTools → Network tab
- [ ] Open coordinator details page
- [ ] Click "Approve & Sign" and complete approval
- [ ] **Verify in Network tab**:
  - [ ] PATCH request to correct endpoint
  - [ ] Request payload has `coordinator_status: "Approved"`
  - [ ] Response status is 200
  - [ ] Response has `ok: true`
  - [ ] Response has updated `request` object
- [ ] **Verify in Database**:
  - [ ] `coordinator_status` = "Approved"
  - [ ] `workflow_state` = "coordinator-approved"
  - [ ] `last_status_updated_at` is updated
  - [ ] `last_status_updated_by` is set to coordinator's user_id
  - [ ] `workflow_history` has new entry with correct data

### Authorization Testing
- [ ] Try accessing endpoint as student (should fail)
- [ ] Try accessing endpoint as faculty (should fail)
- [ ] Try accessing endpoint as adviser (should fail)
- [ ] Access as coordinator (should succeed)
- [ ] Access as administrative assistant (should succeed)
- [ ] Access as dean (should succeed)

---

## 5. Integration Testing

### Complete Workflow
- [ ] **Student submits request**
  - [ ] adviser_status: "Pending"
  - [ ] coordinator_status: "Pending"
  - [ ] workflow_state: "submitted"

- [ ] **Adviser endorses**
  - [ ] Opens endorsement dialog
  - [ ] Reviews request
  - [ ] Manages signature
  - [ ] Generates document (role='adviser')
  - [ ] Reviews PDF (adviser fields filled, coordinator fields empty)
  - [ ] Clicks "Endorse"
  - [ ] adviser_status: "Approved"
  - [ ] workflow_state: "adviser-approved"
  - [ ] Endorsement form saved to database

- [ ] **Coordinator reviews**
  - [ ] Opens defense request
  - [ ] Reviews student submission
  - [ ] Reviews adviser endorsement
  - [ ] Checks program level
  - [ ] Assigns correct number of panel members (3 or 4)
  - [ ] Schedules defense (date, time, venue, mode)

- [ ] **Coordinator approves**
  - [ ] Clicks "Approve & Sign"
  - [ ] Dialog opens
  - [ ] Reviews generated document
  - [ ] Manages signature
  - [ ] Reviews PDF (all fields filled correctly)
  - [ ] Clicks "Approve & Sign"
  - [ ] coordinator_status: "Approved"
  - [ ] workflow_state: "coordinator-approved"
  - [ ] Endorsement form updated in database

- [ ] **Administrative Assistant processes**
  - [ ] Can now see request in their queue
  - [ ] All required information is present
  - [ ] Can proceed with payment verification

### Edge Cases
- [ ] What if coordinator tries to approve without adviser endorsement?
- [ ] What if coordinator tries to approve without assigning panels?
- [ ] What if coordinator tries to approve without scheduling?
- [ ] What if coordinator has no active signature?
- [ ] What if document generation fails?
- [ ] What if network error during approval?
- [ ] What if concurrent coordinators try to approve?

---

## 6. User Experience Validation

### Visual Design
- [ ] Coordinator approve dialog matches system design language
- [ ] Tab navigation is intuitive
- [ ] Signature canvas is easy to use
- [ ] Upload area provides clear feedback
- [ ] Loading states are visible and appropriate
- [ ] Success/error messages are clear
- [ ] Colors and typography are consistent

### Usability
- [ ] Panel assignment is easy to understand
- [ ] Helper text clarifies requirements
- [ ] Combobox search works well
- [ ] Duplicate prevention is clear
- [ ] Signature management is straightforward
- [ ] PDF preview is readable
- [ ] Approval flow is logical
- [ ] Error messages are helpful

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus indicators are visible
- [ ] Screen reader compatibility (if required)
- [ ] Color contrast meets standards
- [ ] Form labels are present

### Performance
- [ ] Dialog opens quickly
- [ ] Document generation is reasonably fast
- [ ] Signature loading doesn't block UI
- [ ] PDF rendering doesn't freeze browser
- [ ] Page refresh after approval is smooth

---

## 7. Documentation

### Code Documentation
- [ ] Complex logic has comments
- [ ] Function parameters are described
- [ ] TypeScript types are accurate
- [ ] PHP type hints are present
- [ ] API contracts are clear

### User Documentation
- [ ] `COORDINATOR_WORKFLOW_COMPLETE_FIX.md` is complete
- [ ] `COORDINATOR_WORKFLOW_VISUAL_GUIDE.md` has diagrams
- [ ] `COORDINATOR_FIXES_SUMMARY.md` summarizes changes
- [ ] Testing instructions are clear
- [ ] Known issues are documented

### Developer Documentation
- [ ] File changes are listed
- [ ] API endpoints are documented
- [ ] Database schema changes (if any) are noted
- [ ] Environment requirements are specified
- [ ] Deployment notes are included

---

## 8. Pre-Deployment Checklist

### Code Quality
- [ ] No TypeScript errors
- [ ] No PHP syntax errors
- [ ] No ESLint warnings (or suppressed with reason)
- [ ] No unused imports
- [ ] No console.log statements in production code
- [ ] No hardcoded values (use env variables)

### Database
- [ ] All required columns exist
- [ ] Indexes are in place (if needed)
- [ ] Migrations have been run
- [ ] Seeders work (if applicable)
- [ ] Database backups are recent

### Assets
- [ ] Frontend assets are built (`npm run build`)
- [ ] Images are optimized
- [ ] Fonts are loaded
- [ ] CSS is compiled

### Security
- [ ] CSRF protection is active
- [ ] Authorization checks are in place
- [ ] Input validation is thorough
- [ ] SQL injection prevention (using Eloquent)
- [ ] XSS prevention (proper escaping)
- [ ] File upload validation (PDF only, size limits)

### Performance
- [ ] No N+1 queries
- [ ] Eager loading is used where needed
- [ ] Large files are not blocking requests
- [ ] Caching is utilized (if applicable)
- [ ] Database queries are optimized

---

## 9. Final Verification

### Smoke Testing
- [ ] Can login as coordinator
- [ ] Can view defense requests list
- [ ] Can open request details
- [ ] Can assign panels
- [ ] Can schedule defense
- [ ] Can approve with signature
- [ ] Can reject request
- [ ] Can retrieve request
- [ ] All pages load without errors
- [ ] All dialogs open correctly

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if Mac available)
- [ ] Edge (latest)
- [ ] Mobile browsers (if required)

### Different Screen Sizes
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Different User Roles
- [ ] Student: Cannot access coordinator features
- [ ] Faculty: Cannot access coordinator features
- [ ] Adviser: Can endorse but not approve
- [ ] Coordinator: Can assign, schedule, and approve
- [ ] Administrative Assistant: Can see approved requests
- [ ] Dean: Has full coordinator permissions

---

## 10. Sign-Off

### Development Team
- [ ] All code has been written
- [ ] All features have been implemented
- [ ] All tests have passed
- [ ] Documentation is complete
- [ ] Code has been reviewed (if applicable)

### Quality Assurance
- [ ] All test cases have been executed
- [ ] All bugs have been fixed or documented
- [ ] Edge cases have been tested
- [ ] User experience has been validated

### Project Manager / Product Owner
- [ ] Requirements have been met
- [ ] Acceptance criteria are satisfied
- [ ] Stakeholders have been informed
- [ ] Ready for deployment

### Deployment
- [ ] Code has been merged to main branch
- [ ] Database migrations have been run
- [ ] Assets have been built and deployed
- [ ] Environment variables are set
- [ ] Monitoring is in place
- [ ] Rollback plan is ready (if needed)

---

## ✅ Completion

**Date Completed**: _______________

**Completed By**: _______________

**Notes**:
```
(Add any final notes, observations, or recommendations here)
```

---

## 🚀 Next Steps (Optional Enhancements)

Future improvements to consider:
- [ ] Email notifications on coordinator approval/rejection
- [ ] Dean approval dialog (similar to coordinator)
- [ ] Document versioning and audit trail
- [ ] Bulk approval operations
- [ ] Mobile app optimization
- [ ] Analytics dashboard
- [ ] Signature templates
- [ ] PDF annotations

---

## 📞 Support Contacts

**Technical Issues**: _______________
**User Training**: _______________
**Bug Reports**: _______________

---

**All checkboxes must be completed before considering this feature production-ready!** ✅
