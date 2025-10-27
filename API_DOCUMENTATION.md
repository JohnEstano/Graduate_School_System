# API Endpoints Documentation

Complete API reference for the Graduate School Document Generation MVP.

---

## 📋 Table of Contents

1. [Document Templates](#document-templates)
2. [User Signatures](#user-signatures)
3. [Document Generation](#document-generation)
4. [Defense Requests](#defense-requests)
5. [Authentication](#authentication)

---

## 🎯 Document Templates

### List All Templates
```http
GET /api/document-templates
```

**Headers:**
```
X-CSRF-TOKEN: {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Endorsement Form (Proposal)",
    "code": "endorsement-form-proposal-abc123",
    "defense_type": null,
    "file_path": "templates/endorsement-form-proposal-abc123.pdf",
    "page_count": 1,
    "version": 1,
    "fields": [
      {
        "id": "uuid-1",
        "key": "student.full_name",
        "page": 1,
        "x": 100,
        "y": 200,
        "width": 200,
        "height": 30,
        "type": "text",
        "font_size": 12
      }
    ],
    "fields_meta": {
      "canvas_width": 595,
      "canvas_height": 842
    },
    "created_by": 1,
    "created_at": "2025-10-27T10:00:00.000000Z",
    "updated_at": "2025-10-27T10:30:00.000000Z"
  }
]
```

---

### Get Single Template
```http
GET /api/document-templates/{id}
```

**Response:** Same as single item in list above

---

### Upload New Template
```http
POST /api/document-templates
```

**Headers:**
```
Content-Type: multipart/form-data
X-CSRF-TOKEN: {token}
```

**Body:**
```
name: "Endorsement Form (Proposal)"
file: [PDF file]
```

**Response:**
```json
{
  "id": 1,
  "name": "Endorsement Form (Proposal)",
  "code": "endorsement-form-proposal-xyz789",
  "file_path": "templates/endorsement-form-proposal-xyz789.pdf",
  "page_count": 1,
  "version": 1,
  "created_by": 1,
  "created_at": "2025-10-27T10:00:00.000000Z",
  "updated_at": "2025-10-27T10:00:00.000000Z"
}
```

**Validation:**
- `name`: required, string
- `file`: required, PDF file, max 10MB

---

### Update Template Fields
```http
PUT /api/document-templates/{id}/fields
```

**Headers:**
```
Content-Type: application/json
X-CSRF-TOKEN: {token}
```

**Body:**
```json
{
  "fields": [
    {
      "id": "uuid-1",
      "key": "student.full_name",
      "page": 1,
      "x": 100,
      "y": 200,
      "width": 200,
      "height": 30,
      "type": "text",
      "font_size": 12
    },
    {
      "id": "uuid-2",
      "key": "signature.adviser",
      "page": 1,
      "x": 100,
      "y": 600,
      "width": 150,
      "height": 50,
      "type": "signature"
    }
  ],
  "fields_meta": {
    "canvas_width": 595,
    "canvas_height": 842
  }
}
```

**Response:**
```json
{
  "ok": true
}
```

---

### Delete Template
```http
DELETE /api/document-templates/{id}
```

**Response:**
```json
{
  "ok": true
}
```

---

## ✍️ User Signatures

### List User Signatures
```http
GET /api/signatures
```

**Headers:**
```
X-CSRF-TOKEN: {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 5,
    "label": "Primary",
    "image_path": "signatures/5/uploaded_1234567890.png",
    "natural_width": 300,
    "natural_height": 100,
    "active": true,
    "created_at": "2025-10-27T10:00:00.000000Z",
    "updated_at": "2025-10-27T10:00:00.000000Z"
  }
]
```

---

### Upload/Draw Signature
```http
POST /api/signatures
```

**Headers:**
```
Content-Type: multipart/form-data (for upload)
Content-Type: application/json (for drawn)
X-CSRF-TOKEN: {token}
```

**Body (Upload):**
```
image: [PNG file]
label: "Primary" (optional)
```

**Body (Draw):**
```json
{
  "image_base64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "label": "Primary"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 5,
  "label": "Primary",
  "image_path": "signatures/5/drawn_abc123.png",
  "natural_width": 300,
  "natural_height": 100,
  "active": true,
  "created_at": "2025-10-27T10:00:00.000000Z",
  "updated_at": "2025-10-27T10:00:00.000000Z"
}
```

**Validation:**
- Image file: PNG only, max 1MB
- Base64: Must be valid PNG data URL, decoded size < 1MB

**Notes:**
- Previous signatures for this user are automatically deleted
- New signature is set as active

---

### Activate Signature
```http
PATCH /api/signatures/{id}/activate
```

**Headers:**
```
X-CSRF-TOKEN: {token}
```

**Response:**
```json
{
  "ok": true
}
```

**Notes:**
- Deactivates all other signatures for this user
- Only the signature owner can activate it

---

## 📄 Document Generation

### Generate Document
```http
POST /api/generate-document
```

**Headers:**
```
Content-Type: application/json
X-CSRF-TOKEN: {token}
```

**Body:**
```json
{
  "template_id": 1,
  "defense_request_id": 10,
  "role": "adviser",
  "fields": {
    "adviser.full_name": "Dr. Maria Santos",
    "coordinator.full_name": "Dr. Juan Dela Cruz"
  }
}
```

**Response:** PDF file download

**Content-Type:** `application/pdf`

**Content-Disposition:** `attachment; filename="endorsement_form_10_1698400000.pdf"`

**Validation:**
- `template_id`: required, integer, exists in document_templates
- `defense_request_id`: required, integer, exists in defense_requests
- `role`: optional, one of: adviser, coordinator
- `fields`: optional, object with field overrides

**Notes:**
- Automatically uses active signature for the authenticated user
- Creates record in `generated_documents` table
- Deletes previous generated documents for same request/template
- PDF is also stored in `storage/app/public/generated/defense/`

---

### Download Generated Document
```http
GET /generated-documents/{id}
```

**Response:** PDF file download

---

## 🎓 Defense Requests

### Upload Endorsement Form
```http
POST /api/defense-requests/{id}/upload-endorsement
```

**Headers:**
```
Content-Type: multipart/form-data
X-CSRF-TOKEN: {token}
```

**Body:**
```
endorsement_form: [PDF file]
```

**Response:**
```json
{
  "endorsement_form": "/storage/defense_documents/abc123.pdf"
}
```

---

### Update Adviser Status
```http
PATCH /api/defense-requests/{id}/adviser-status
```

**Headers:**
```
Content-Type: application/json
X-CSRF-TOKEN: {token}
```

**Body:**
```json
{
  "adviser_status": "Approved",
  "coordinator_user_id": 3
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Adviser status updated successfully",
  "request": {
    "id": 10,
    "adviser_status": "Approved",
    "workflow_state": "adviser-approved",
    "coordinator_user_id": 3,
    ...
  }
}
```

**Validation:**
- `adviser_status`: required, one of: Pending, Approved, Rejected
- `coordinator_user_id`: optional, integer, exists in users

**Authorization:** Only Faculty/Adviser role

---

### Update Coordinator Status
```http
PATCH /coordinator/defense-requirements/{id}/coordinator-status
```

**Headers:**
```
Content-Type: application/json
X-CSRF-TOKEN: {token}
```

**Body:**
```json
{
  "coordinator_status": "Approved",
  "coordinator_user_id": 3
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Coordinator status updated successfully",
  "request": {
    "id": 10,
    "coordinator_status": "Approved",
    "workflow_state": "coordinator-approved",
    ...
  }
}
```

**Validation:**
- `coordinator_status`: required, one of: Approved, Rejected, Pending
- `coordinator_user_id`: optional, integer, exists in users

**Authorization:** Only Coordinator/Administrative Assistant/Dean role

---

## 🔐 Authentication

All endpoints require authentication via Laravel session cookies.

### CSRF Token
Get CSRF cookie before making requests:
```http
GET /sanctum/csrf-cookie
```

Then include token in all subsequent requests:
```
X-CSRF-TOKEN: {token from meta tag or cookie}
```

**Getting Token from Meta Tag:**
```javascript
const token = document.querySelector('meta[name="csrf-token"]')?.content;
```

---

## 📝 Common Field Keys

Use these keys when mapping template fields:

### Student Information
- `student.full_name` - Full name
- `student.first_name` - First name
- `student.middle_name` - Middle name
- `student.last_name` - Last name
- `student.school_id` - School ID
- `student.program` - Program name

### Request Details
- `request.thesis_title` - Thesis title
- `request.defense_type` - Defense type (Proposal/Prefinal/Final)
- `request.submitted_at` - Submission date

### Schedule
- `schedule.date` - Defense date
- `schedule.time` - Defense time
- `schedule.venue` - Defense venue
- `schedule.mode` - Defense mode (Online/Face-to-face)

### Adviser Information
- `adviser.full_name` - Adviser full name
- `adviser.first_name` - Adviser first name
- `adviser.last_name` - Adviser last name

### Coordinator Information
- `coordinator.full_name` - Coordinator full name
- `coordinator.first_name` - Coordinator first name
- `coordinator.last_name` - Coordinator last name

### Dean Information
- `dean.full_name` - Dean full name

### Signatures
- `signature.adviser` - Adviser signature image
- `signature.coordinator` - Coordinator signature image
- `signature.dean` - Dean signature image

### Other
- `today.date` - Current date

---

## 🔄 Status Codes

### Success
- `200 OK` - Request successful
- `201 Created` - Resource created

### Client Errors
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized for this action
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation failed

### Server Errors
- `500 Internal Server Error` - Server error (check logs)

---

## 📊 Example Workflow

### Complete Document Generation Flow

1. **Setup Template**
```javascript
// Upload template
const formData = new FormData();
formData.append('name', 'Endorsement Form (Proposal)');
formData.append('file', pdfFile);

const template = await fetch('/api/document-templates', {
  method: 'POST',
  body: formData,
  headers: { 'X-CSRF-TOKEN': csrfToken }
}).then(r => r.json());

// Map fields
await fetch(`/api/document-templates/${template.id}/fields`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': csrfToken
  },
  body: JSON.stringify({
    fields: [
      { id: '1', key: 'student.full_name', page: 1, x: 100, y: 200, width: 200, height: 30, type: 'text' },
      { id: '2', key: 'signature.adviser', page: 1, x: 100, y: 600, width: 150, height: 50, type: 'signature' }
    ],
    fields_meta: { canvas_width: 595, canvas_height: 842 }
  })
});
```

2. **Adviser Endorsement**
```javascript
// Upload/draw signature
const signature = await fetch('/api/signatures', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': csrfToken
  },
  body: JSON.stringify({
    image_base64: signatureDataUrl,
    label: 'Primary'
  })
}).then(r => r.json());

// Generate document
const pdfBlob = await fetch('/api/generate-document', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': csrfToken
  },
  body: JSON.stringify({
    template_id: 1,
    defense_request_id: 10,
    role: 'adviser'
  })
}).then(r => r.blob());

// Update status
await fetch(`/api/defense-requests/10/adviser-status`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': csrfToken
  },
  body: JSON.stringify({
    adviser_status: 'Approved',
    coordinator_user_id: 3
  })
});
```

3. **Coordinator Approval**
```javascript
// Generate with coordinator info
const pdfBlob = await fetch('/api/generate-document', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': csrfToken
  },
  body: JSON.stringify({
    template_id: 1,
    defense_request_id: 10,
    role: 'coordinator',
    fields: {
      'coordinator.full_name': 'Dr. Juan Dela Cruz'
    }
  })
}).then(r => r.blob());

// Approve request
await fetch(`/coordinator/defense-requirements/10/coordinator-status`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': csrfToken
  },
  body: JSON.stringify({
    coordinator_status: 'Approved'
  })
});
```

---

## 🛡️ Security Notes

1. **CSRF Protection**: All POST/PUT/PATCH/DELETE requests require CSRF token
2. **Authentication**: All endpoints require authenticated session
3. **Authorization**: Role-based access control enforced
4. **File Validation**: Type and size checks on all uploads
5. **Ownership**: Users can only manage their own signatures
6. **Path Security**: All file paths validated and sanitized

---

## 📞 Support

For issues or questions about the API, check:
1. Application logs: `storage/logs/laravel.log`
2. Browser console for client-side errors
3. Network tab for request/response details

---

*API Version*: 1.0  
*Last Updated*: October 27, 2025
