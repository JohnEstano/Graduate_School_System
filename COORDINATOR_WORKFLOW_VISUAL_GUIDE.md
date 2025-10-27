# Coordinator Workflow - Visual Guide

## Panel Assignment Logic

```
┌─────────────────────────────────────────────────────────────┐
│                    PROGRAM LEVEL CHECK                       │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
         ┌──────▼──────┐           ┌───────▼───────┐
         │   MASTERAL  │           │   DOCTORATE   │
         └──────┬──────┘           └───────┬───────┘
                │                           │
    ┌───────────┴───────────┐   ┌───────────┴──────────────┐
    │ 3 Panel Members       │   │ 4 Panel Members          │
    │ • Chairperson         │   │ • Chairperson            │
    │ • Panelist 1          │   │ • Panelist 1             │
    │ • Panelist 2          │   │ • Panelist 2             │
    │                       │   │ • Panelist 3             │
    │                       │   │ • Panelist 4             │
    └───────────────────────┘   └──────────────────────────┘
```

## Document Generation Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADVISER ENDORSEMENT                         │
├─────────────────────────────────────────────────────────────────┤
│ 1. Adviser reviews request                                      │
│ 2. Opens endorsement dialog                                     │
│ 3. Generates PDF with role='adviser'                            │
│ 4. System fills:                                                │
│    ✓ Student information                                        │
│    ✓ Thesis details                                             │
│    ✓ Schedule (if provided)                                     │
│    ✓ Adviser signature                                          │
│    ✓ Adviser full name                                          │
│    ✗ Coordinator signature (SKIPPED)                            │
│    ✗ Coordinator name (SKIPPED)                                 │
│    ✗ Dean signature (SKIPPED)                                   │
│    ✗ Dean name (SKIPPED)                                        │
│ 5. Signs and submits                                            │
│ 6. adviser_status → "Approved"                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   COORDINATOR ASSIGNMENT                         │
├─────────────────────────────────────────────────────────────────┤
│ 1. Coordinator reviews request                                  │
│ 2. Checks program level                                         │
│ 3. Assigns panel members:                                       │
│    • Masteral: 3 members                                        │
│    • Doctorate: 4 members                                       │
│ 4. Schedules defense                                            │
│    • Date, Time, Venue, Mode                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   COORDINATOR APPROVAL                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. Coordinator clicks "Approve & Sign"                          │
│ 2. Dialog opens with 3 tabs:                                    │
│    ┌──────────────────────────────────────────────────┐        │
│    │ PREVIEW TAB                                       │        │
│    │ • Shows generated PDF                             │        │
│    │ • Endorsement form with adviser info filled      │        │
│    │ • Now filling coordinator info                    │        │
│    └──────────────────────────────────────────────────┘        │
│    ┌──────────────────────────────────────────────────┐        │
│    │ SIGNATURE TAB                                     │        │
│    │ • View saved signatures                           │        │
│    │ • Draw new signature                              │        │
│    │ • Activate signature                              │        │
│    └──────────────────────────────────────────────────┘        │
│    ┌──────────────────────────────────────────────────┐        │
│    │ UPLOAD TAB                                        │        │
│    │ • Upload pre-signed PDF                           │        │
│    │ • Drag & drop support                             │        │
│    └──────────────────────────────────────────────────┘        │
│ 3. Generates PDF with role='coordinator'                        │
│ 4. System fills:                                                │
│    ✓ Coordinator signature                                      │
│    ✓ Coordinator full name                                      │
│    ✓ Dean fields (if applicable)                                │
│    → Adviser fields PRESERVED (already filled)                  │
│ 5. Signs and submits                                            │
│ 6. coordinator_status → "Approved"                              │
│ 7. workflow_state → "coordinator-approved"                      │
└─────────────────────────────────────────────────────────────────┘
```

## Role-Based Field Filtering

```
┌────────────────────────────────────────────────────────────────┐
│                  DOCUMENT TEMPLATE FIELDS                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────┐               │
│  │ STUDENT FIELDS                              │               │
│  │ • student.full_name                         │ ✓ Both Roles  │
│  │ • student.school_id                         │ ✓ Both Roles  │
│  │ • request.thesis_title                      │ ✓ Both Roles  │
│  └─────────────────────────────────────────────┘               │
│                                                                 │
│  ┌─────────────────────────────────────────────┐               │
│  │ SCHEDULE FIELDS                             │               │
│  │ • schedule.date                             │ ✓ Both Roles  │
│  │ • schedule.time                             │ ✓ Both Roles  │
│  │ • schedule.venue                            │ ✓ Both Roles  │
│  └─────────────────────────────────────────────┘               │
│                                                                 │
│  ┌─────────────────────────────────────────────┐               │
│  │ ADVISER FIELDS (role='adviser')             │               │
│  │ • signature.adviser                         │ ✓ Adviser     │
│  │ • adviser.full_name                         │ ✓ Adviser     │
│  └─────────────────────────────────────────────┘ ✗ Coordinator │
│                                                                 │
│  ┌─────────────────────────────────────────────┐               │
│  │ COORDINATOR FIELDS (role='coordinator')     │               │
│  │ • signature.coordinator                     │ ✗ Adviser     │
│  │ • coordinator.full_name                     │ ✗ Adviser     │
│  └─────────────────────────────────────────────┘ ✓ Coordinator │
│                                                                 │
│  ┌─────────────────────────────────────────────┐               │
│  │ DEAN FIELDS                                 │               │
│  │ • signature.dean                            │ ✗ Adviser     │
│  │ • dean.full_name                            │ ✗ Adviser     │
│  └─────────────────────────────────────────────┘ ✓ Coordinator │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## State Transitions

```
┌──────────────┐
│  SUBMITTED   │ (Student submits defense request)
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  ADVISER REVIEW      │ (Adviser reviews)
└──────┬───────────────┘
       │
       ├─── REJECT ──► ┌────────────────────┐
       │               │ ADVISER REJECTED   │
       │               └────────────────────┘
       │
       └─── APPROVE ─► ┌────────────────────┐
                       │ ADVISER APPROVED   │ (adviser_status = "Approved")
                       └──────┬─────────────┘
                              │
                              ▼
                       ┌────────────────────────┐
                       │ COORDINATOR REVIEW     │ (Coordinator assigns panels)
                       └──────┬─────────────────┘
                              │
                              ├─── REJECT ──► ┌──────────────────────────┐
                              │               │ COORDINATOR REJECTED     │
                              │               └──────────────────────────┘
                              │
                              └─── APPROVE ─► ┌──────────────────────────┐
                                              │ COORDINATOR APPROVED     │
                                              │ (coordinator_status =    │
                                              │  "Approved")             │
                                              └──────┬───────────────────┘
                                                     │
                                                     ▼
                                              ┌──────────────────────────┐
                                              │ READY FOR PROCESSING     │
                                              │ (AA can now handle)      │
                                              └──────────────────────────┘
```

## UI Components

### Coordinator Details Page
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to List    [Details] [Assign & Schedule]                 │
│                                                                  │
│ [Approve & Sign] [Reject] [Retrieve]  ◄── ACTION BUTTONS       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ SUBMISSION SUMMARY                                     │     │
│  │ • Thesis Title                                         │     │
│  │ • Student Info                                         │     │
│  │ • Program                   Adviser Status: Endorsed   │     │
│  │ • Defense Type              Coordinator Status: ____   │     │
│  │ • Schedule Info                                        │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ COMMITTEE                                              │     │
│  │ ┌──────────────────────────────────────────────────┐   │     │
│  │ │ Name & Email │ Role         │ Receivable        │   │     │
│  │ ├──────────────────────────────────────────────────┤   │     │
│  │ │ John Doe     │ Adviser      │ ₱5,000.00        │   │     │
│  │ │ Jane Smith   │ Panel Chair  │ ₱3,000.00        │   │     │
│  │ │ Bob Wilson   │ Panelist 1   │ ₱3,000.00        │   │     │
│  │ │ Alice Brown  │ Panelist 2   │ ₱3,000.00        │   │     │
│  │ │              │              │                  │   │     │
│  │ │ (Panelist 3 & 4 only if Doctorate)             │   │     │
│  │ └──────────────────────────────────────────────────┘   │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ ATTACHMENTS                                            │     │
│  │ • Adviser's Endorsement                                │     │
│  │ • REC Endorsement                                      │     │
│  │ • Proof of Payment                                     │     │
│  │ • Manuscript                                           │     │
│  │ • Similarity Form                                      │     │
│  │ • Endorsement Form                                     │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Coordinator Approve Dialog
```
┌─────────────────────────────────────────────────────────────────┐
│ Coordinator Approval                                        [X] │
│ Review the endorsement form, ensure your signature is active   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Preview] [Signature] [Upload]  ◄── TAB NAVIGATION            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                                                        │     │
│  │              PREVIEW TAB CONTENT                      │     │
│  │              (PDF Viewer)                             │     │
│  │                                                        │     │
│  │  [Regenerate]                                         │     │
│  │                                                        │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  OR                                                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                                                        │     │
│  │              SIGNATURE TAB CONTENT                    │     │
│  │                                                        │     │
│  │  Your Signatures:         [Draw New Signature]        │     │
│  │  ┌──────────┐  ┌──────────┐                          │     │
│  │  │ [Image]  │  │ [Image]  │                          │     │
│  │  │ Active ✓ │  │          │                          │     │
│  │  └──────────┘  └──────────┘                          │     │
│  │                                                        │     │
│  │  ✓ Signature ready                                    │     │
│  │                                                        │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  OR                                                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                                                        │     │
│  │              UPLOAD TAB CONTENT                       │     │
│  │                                                        │     │
│  │         ┌─────────────────────────────┐               │     │
│  │         │  Drop your PDF here         │               │     │
│  │         │  or click to browse         │               │     │
│  │         │                             │               │     │
│  │         │  [Browse Files]             │               │     │
│  │         └─────────────────────────────┘               │     │
│  │                                                        │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✓ Signature ready                     [Cancel] [Approve & Sign]│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

```
┌─────────────────────────────────────────────────────────────────┐
│ DOCUMENT GENERATION                                              │
├─────────────────────────────────────────────────────────────────┤
│ POST /api/generate-document                                      │
│ {                                                                │
│   "template_id": 1,                                              │
│   "defense_request_id": 123,                                     │
│   "fields": {},                                                  │
│   "role": "adviser" | "coordinator"  ◄── NEW PARAMETER          │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ COORDINATOR STATUS UPDATE                                        │
├─────────────────────────────────────────────────────────────────┤
│ PATCH /coordinator/defense-requirements/{id}/coordinator-status  │
│ {                                                                │
│   "coordinator_status": "Approved" | "Rejected" | "Pending",     │
│   "coordinator_user_id": 5  (optional)                           │
│ }                                                                │
│                                                                  │
│ Response:                                                        │
│ {                                                                │
│   "ok": true,                                                    │
│   "message": "Coordinator status updated successfully",          │
│   "request": { ... updated defense request ... }                 │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Summary

✅ **Fixed:**
- Panel assignment now respects program level (Masteral: 3, Doctorate: 4)
- Coordinator has dedicated approval dialog with signature workflow
- Role-based field filtering prevents premature field filling
- Proper separation of adviser and coordinator document generation
- Backend API for coordinator status updates
- Visual feedback and professional UI

✅ **Workflow is now:**
- Robust and production-ready
- User-friendly with clear visual guidance
- Secure with proper authorization checks
- Auditable with workflow history logging
- Scalable for future enhancements
