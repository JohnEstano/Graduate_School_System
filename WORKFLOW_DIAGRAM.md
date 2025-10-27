# Complete Workflow Diagram

## 📊 Document Generation & Approval Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PHASE 0: SETUP                                │
│                     (Admin/Coordinator)                              │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Upload PDF Template  │
                    │  /settings/documents  │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │   Map Fields Using    │
                    │   Template Editor     │
                    │  (TemplateEditor.tsx) │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Fields Saved to DB   │
                    │ (document_templates)  │
                    └───────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 1: STUDENT SUBMISSION                       │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Student Fills Form   │
                    │ - Thesis title        │
                    │ - Defense type        │
                    │ - Upload documents    │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Submit to Database   │
                    │  (defense_requests)   │
                    │  Status: Pending      │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Notify Adviser       │
                    └───────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   PHASE 2: ADVISER ENDORSEMENT                       │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Adviser Reviews      │
                    │  Submission           │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Click "Endorse"      │
                    │  Opens Dialog         │
                    └───────────────────────┘
                                 │
                                 ▼
         ┌──────────────────────┴──────────────────────┐
         │                                              │
         ▼                                              ▼
┌─────────────────┐                          ┌─────────────────┐
│  Preview Tab    │                          │  Signature Tab  │
│                 │                          │                 │
│ Auto-generate   │                          │ - Draw sig      │
│ endorsement     │                          │ - Upload sig    │
│ form PDF        │                          │ - Select sig    │
└─────────────────┘                          └─────────────────┘
         │                                              │
         └──────────────────────┬──────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  DocumentGenerator    │
                    │  Service              │
                    │  - Inject data        │
                    │  - Embed signature    │
                    │  - Generate PDF       │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Save to Storage      │
                    │  /generated/defense/  │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Create Record        │
                    │ (generated_documents) │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Update Status        │
                    │  adviser_status:      │
                    │  Approved             │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Notify Coordinator   │
                    └───────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                  PHASE 3: COORDINATOR APPROVAL                       │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Coordinator Reviews  │
                    │  Endorsed Request     │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Click "Approve"      │
                    │  Opens Dialog         │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Load Existing        │
                    │  Endorsement Form     │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Enter Coordinator    │
                    │  - Full name          │
                    │  - Title              │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Select/Create        │
                    │  Coordinator Sig      │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Generate New PDF     │
                    │  with Coordinator     │
                    │  Info + Signature     │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Save to Storage      │
                    │  (replaces old)       │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Update Status        │
                    │  coordinator_status:  │
                    │  Approved             │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Optional: Send Email │
                    └───────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  COMPLETE             │
                    │  Ready for Scheduling │
                    └───────────────────────┘
```

---

## 🔄 Data Flow

### 1. Template Setup
```
Admin → Upload PDF → Map Fields → Save to DB
                                     ↓
                        document_templates table
                        (fields JSON, fields_meta JSON)
```

### 2. Student Submission
```
Student → Fill Form → Upload Docs → Submit
                                      ↓
                         defense_requests table
                         (status: Pending)
```

### 3. Adviser Endorsement
```
Adviser → Review → Create/Select Signature
                           ↓
                   user_signatures table
                   (active: true)
                           ↓
                   Generate Document
                           ↓
                   DocumentGenerator Service
                   (FPDI + Data Injection)
                           ↓
                   Storage: /generated/defense/
                           ↓
                   generated_documents table
                           ↓
                   Update defense_requests
                   (adviser_status: Approved,
                    endorsement_form: path)
```

### 4. Coordinator Approval
```
Coordinator → Review → Add Info → Select Signature
                                      ↓
                             Generate New Document
                             (with coordinator data)
                                      ↓
                             Save to Storage
                             (replace old)
                                      ↓
                             Update defense_requests
                             (coordinator_status: Approved)
                                      ↓
                             Optional: Send Email
```

---

## 🗄️ Database Relationships

```
users
  │
  ├─── user_signatures (1:N)
  │    └─── active signature used for PDF generation
  │
  ├─── defense_requests (as adviser/coordinator)
  │    │
  │    └─── generated_documents (1:N)
  │         └─── references document_template
  │
  └─── document_templates (as creator)
       └─── stores field mappings (JSON)
```

---

## 📦 File Storage Structure

```
storage/app/public/
│
├── templates/
│   └── {unique-slug}-{timestamp}.pdf
│       (Original PDF templates)
│
├── signatures/
│   └── {user_id}/
│       ├── uploaded_{timestamp}.png
│       └── drawn_{uniqid}.png
│
└── generated/
    └── defense/
        └── {request_id}_{template_code}_{timestamp}.pdf
            (Generated endorsement forms)
```

---

## 🔐 Security Flow

```
Request → CSRF Token Check → Authentication → Authorization
                                                    ↓
                                     Check User Role & Ownership
                                                    ↓
                                         File Type Validation
                                                    ↓
                                          File Size Check
                                                    ↓
                                       Secure Storage Path
                                                    ↓
                                         SHA256 Hash
                                                    ↓
                                         Success Response
```

---

## 🎯 Key Integration Points

### Frontend ↔ Backend

1. **Template Upload**
   ```
   POST /api/document-templates
   FormData: { name, file }
   ```

2. **Field Mapping**
   ```
   PUT /api/document-templates/{id}/fields
   JSON: { fields: [], fields_meta: {} }
   ```

3. **Signature Upload**
   ```
   POST /api/signatures
   FormData: { image } or { image_base64 }
   ```

4. **Generate Document**
   ```
   POST /api/generate-document
   JSON: { template_id, defense_request_id, fields: {} }
   Response: PDF download
   ```

5. **Status Updates**
   ```
   PATCH /api/defense-requests/{id}/adviser-status
   PATCH /coordinator/defense-requirements/{id}/coordinator-status
   JSON: { adviser_status: "Approved" }
   ```

---

## 🎨 Component Hierarchy

```
AppLayout
  └── SettingsLayout
      └── Index (Template List)
          └── TemplateEditor (Field Mapper)

AppLayout
  └── StudentLayout
      └── SubmitDefenseRequirements (Submission Form)

AppLayout
  └── AdviserLayout
      └── DetailsRequirements (Review Page)
          └── EndorsementDialog
              ├── Preview Tab
              ├── Signature Tab
              │   └── SignatureCanvas
              └── Upload Tab

AppLayout
  └── CoordinatorLayout
      └── Details (Review Page)
          └── CoordinatorApproveDialog
              ├── Preview Tab
              ├── Signature Tab
              │   └── SignatureCanvas
              └── Upload Tab
```

---

## 📊 State Management

### Defense Request States
```
Submitted → Adviser Review → Adviser Approved
                          ↓
                   Adviser Rejected

Adviser Approved → Coordinator Review → Coordinator Approved
                                     ↓
                              Coordinator Rejected

Coordinator Approved → Panel Assignment → Scheduled → Completed
```

### Document States
```
Template Uploaded → Fields Mapped → Ready for Generation

Generation Requested → Processing → Generated → Stored
                                               ↓
                                     Database Record Created
```

---

This workflow ensures a secure, traceable, and efficient document generation and approval process for graduate school defense requirements.
