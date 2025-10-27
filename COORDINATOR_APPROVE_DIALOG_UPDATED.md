# Coordinator Approve Dialog - Complete Overhaul

## ✅ Changes Applied

The coordinator approval dialog has been **completely rewritten** to match the adviser's endorsement dialog structure and workflow.

---

## 🎯 What Changed

### **1. Removed Features (Old Complex Workflow)**
- ❌ Document regeneration logic
- ❌ PDF signature positioning with drag-and-drop
- ❌ Template selection system
- ❌ Complex signature overlay calculations
- ❌ Upload file functionality
- ❌ Multiple tabs (preview/signature/upload)

### **2. Added Features (New Simplified Workflow)**
- ✅ **Coordinator Information Input**: Full name and title fields
- ✅ **Email Notification Dialog**: Ask user if they want to send email to student
- ✅ **Direct PDF Preview**: Shows existing endorsement form from adviser
- ✅ **Signature Management**: Same signature library system as adviser
- ✅ **Simple Approval**: Just loads existing PDF and records approval

---

## 🔄 New Workflow

### **Step 1: Open Dialog**
- Loads existing endorsement form from adviser (from storage)
- Loads user's signature library
- Shows coordinator info input fields (full name, title)

### **Step 2: Enter Information**
- Coordinator enters their full name (required)
- Optionally updates their title (defaults to "Program Coordinator")
- Selects or creates their signature

### **Step 3: Review & Approve**
- Preview the endorsement form in an iframe
- Click "Approve Request" button
- Email confirmation dialog appears

### **Step 4: Email Confirmation**
- Dialog asks: "Send email notification to student?"
- Options:
  - **Cancel**: Goes back to review
  - **Confirm Approval**: Proceeds with approval and sends notification to student if checked

### **Step 5: Submit**
- PATCH request to `/coordinator/defense-requirements/{id}/coordinator-status`
- Payload includes:
  ```json
  {
    "coordinator_status": "Approved",
    "coordinator_full_name": "...",
    "coordinator_title": "...",
    "coordinator_user_id": ...,
    "send_email": true/false
  }
  ```
- Callback `onApproveComplete()` executes (refreshes page)
- Dialog closes
- Success toast shown

---

## 📋 Key Features

### **Coordinator Information Section**
```tsx
<div className="space-y-3">
  <Label>Your Information</Label>
  <Input
    placeholder="Enter your full name"
    value={coordinatorFullName}
    onChange={(e) => setCoordinatorFullName(e.target.value)}
  />
  <Input
    placeholder="e.g., Program Coordinator"
    value={coordinatorTitle}
    onChange={(e) => setCoordinatorTitle(e.target.value)}
  />
</div>
```

### **Email Confirmation Dialog**
```tsx
<Dialog open={showEmailDialog}>
  <DialogContent>
    <DialogTitle>Send Email Notification?</DialogTitle>
    <Checkbox
      checked={sendEmail}
      onCheckedChange={(checked) => setSendEmail(checked === true)}
    />
    <Label>Send email notification to student</Label>
    <Button onClick={handleFinalApprove}>Confirm Approval</Button>
  </DialogContent>
</Dialog>
```

### **Signature Management**
- Same system as adviser's endorsement dialog
- Load existing signatures from `/api/signatures`
- Draw new signature with `SignatureCanvas`
- Activate signature with PATCH `/api/signatures/{id}/activate`
- Active signature shown with preview

---

## 🔧 Backend Integration

### **Endpoint: PATCH `/coordinator/defense-requirements/{id}/coordinator-status`**

**Expected Payload:**
```json
{
  "coordinator_status": "Approved",
  "coordinator_full_name": "Dr. John Smith",
  "coordinator_title": "Program Coordinator",
  "coordinator_user_id": 123,
  "send_email": true
}
```

**Expected Response:**
```json
{
  "ok": true,
  "message": "Coordinator status updated successfully",
  "request": { /* updated defense request object */ }
}
```

### **Email Functionality**
- When `send_email: true`, backend should send notification email to:
  - **Student** (defense request submitter)
  - Optionally: Adviser, panel members
- Email should indicate that coordinator has approved the request
- Include defense details (date, time, venue, panels)

---

## 📁 Files Modified

### **1. coordinator-approve-dialog.tsx** (Completely Rewritten)
- **Before**: 700+ lines with drag-and-drop signature positioning
- **After**: ~550 lines with simple form-based approval
- **Location**: `resources/js/pages/coordinator/submissions/defense-request/`

### **2. details.tsx** (Minor Update)
- **Changed**: Button text from "Approve & Sign" to "Approve Request"
- **No other changes**: Dialog integration remains the same
- **Location**: `resources/js/pages/coordinator/submissions/defense-request/`

---

## 🎨 UI Layout

### **Sidebar (Left)**
- Header: "Approve Request"
- **Your Information** section:
  - Full Name input
  - Title input
- **Active Signature** section:
  - Shows current active signature image
  - Alert: "This signature will be used on the endorsement form"
- **Manage Signature** button:
  - Opens draw signature dialog
- **Your Signatures** list:
  - All saved signatures
  - Click to activate
  - Active one highlighted
- **Request Details** (bottom):
  - Student name
  - Program
  - Defense type
- **Approve Request** button (footer):
  - Disabled if no signature or no name entered
  - Shows loading state when processing

### **Main Content (Right)**
- **PDF Preview**:
  - Full-width iframe showing endorsement form
  - 700px height
  - Scrollable if needed
- **Loading State**:
  - Spinner with message while loading PDF
- **Empty State**:
  - Alert if no endorsement form available

---

## ✅ Testing Checklist

- [ ] Dialog opens when "Approve Request" button clicked
- [ ] Endorsement form loads from storage correctly
- [ ] Signature library loads and displays
- [ ] Can draw new signature
- [ ] Can activate different signatures
- [ ] Full name input validation works (required)
- [ ] Title input works (optional)
- [ ] Email dialog appears on approve click
- [ ] Checkbox toggles send_email correctly
- [ ] Approval submits with correct payload
- [ ] Email sent to student when checked
- [ ] Page refreshes after successful approval
- [ ] Success toast appears
- [ ] Dialog closes after approval

---

## 🔍 Comparison: Old vs New

| Feature | Old Workflow | New Workflow |
|---------|-------------|--------------|
| **Document Generation** | Regenerated entire PDF | Uses existing PDF from adviser |
| **Signature Placement** | Drag-and-drop positioning | No positioning needed |
| **Coordinator Info** | Not captured | Full name + title required |
| **Email Notification** | Not asked | Confirmation dialog with checkbox |
| **Complexity** | ~700 lines, 3 tabs | ~550 lines, single view |
| **User Steps** | 5-7 clicks | 3-4 clicks |
| **Template System** | Required template selection | Not needed |
| **Upload Option** | Could upload custom PDF | Not needed |

---

## 🚀 Benefits

1. **Simpler Workflow**: Coordinators don't regenerate documents
2. **Faster Approval**: Fewer steps, less confusion
3. **Better UX**: Clear, focused interface
4. **Data Capture**: Records coordinator name and title
5. **Email Control**: User decides if notification sent
6. **Consistency**: Matches adviser's endorsement dialog
7. **Maintainability**: Less complex code, easier to debug
8. **No Signature Errors**: No coordinate calculations needed

---

## 📝 Notes

- The coordinator's signature is **not overlaid** on the PDF in this version
- The approval is **recorded in the database** with coordinator info
- If signature overlay is needed in the future, it should be done server-side after approval
- The endorsement form remains **unchanged** - it already has the adviser's signature
- Coordinator approval is a **status change** with metadata (name, title, signature reference)

---

## 🔗 Related Files

- `endorsement-dialog.tsx` - Adviser's endorsement dialog (reference implementation)
- `details.tsx` - Main coordinator details page
- Backend routes:
  - `PATCH /coordinator/defense-requirements/{id}/coordinator-status`
  - `GET /api/signatures`
  - `POST /api/signatures`
  - `PATCH /api/signatures/{id}/activate`

---

## 🎉 Summary

The coordinator approve dialog now follows the **same pattern** as the adviser's endorsement dialog:
1. Load existing document
2. Capture user information
3. Select signature
4. Confirm with email option
5. Submit approval

This provides a **consistent, intuitive experience** across both roles while significantly reducing complexity and potential errors.
