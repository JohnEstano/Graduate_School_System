# Coordinator Approval - Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COORDINATOR DETAILS PAGE                         │
│                     (defense-request/details.tsx)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Coordinator fills forms:
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│   PANELS     │          │   SCHEDULE   │          │  ENDORSEMENT │
│              │          │              │          │     FORM     │
│ • Chairper.  │          │ • Date       │          │              │
│ • Panelist1  │          │ • Time       │          │ • Upload or  │
│ • Panelist2  │          │ • End Time   │          │   Generate   │
│ • Panelist3  │          │ • Mode       │          │              │
│ • Panelist4  │          │ • Venue      │          │              │
│              │          │ • Notes      │          │              │
└──────────────┘          └──────────────┘          └──────────────┘
        │                           │                           │
        │                           │                           │
        └───────────────────────────┴───────────────────────────┘
                                    │
                                    │ Coordinator clicks
                                    │ "Approve Request"
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    COORDINATOR APPROVE DIALOG                            │
│                  (coordinator-approve-dialog.tsx)                        │
│                                                                          │
│  Props Received:                                                         │
│  • defenseRequest                                                        │
│  • panelAssignments = { chairperson, panelist1-4 }  ← FROM DETAILS     │
│  • scheduleData = { date, time, mode, venue, ... }  ← FROM DETAILS     │
│  • coordinatorId                                                         │
│                                                                          │
│  [Preview Endorsement Form]                                              │
│                                                                          │
│  ☑ Send email notification                                              │
│                                                                          │
│  [Approve & Send Email] [Approve]                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User confirms
                                    │ handleFinalApprove()
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │                                                   │
        │   STEP 1: Upload Endorsement Form (if exists)    │
        │   ──────────────────────────────────────────      │
        │   POST /api/defense-requests/{id}/upload-         │
        │        endorsement                                │
        │                                                   │
        │   FormData:                                       │
        │   • endorsement_form: <PDF Blob>                  │
        │                                                   │
        │   Backend: uploadDocuments()                      │
        │   • Saves file to storage/defense_documents/      │
        │   • Updates defense_requests.endorsement_form     │
        │   • Updates defense_requests.attachments JSON     │
        │                                                   │
        └───────────────────────────────────────────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │                                                   │
        │   STEP 2: Update Coordinator Status with ALL DATA│
        │   ──────────────────────────────────────────────  │
        │   PATCH /coordinator/defense-requirements/{id}/   │
        │         coordinator-status                        │
        │                                                   │
        │   JSON Payload:                                   │
        │   {                                               │
        │     "coordinator_status": "Approved",             │
        │     "send_email": true,                           │
        │                                                   │
        │     // Panel assignments (from details page)      │
        │     "defense_chairperson": "Dr. Smith",           │
        │     "defense_panelist1": "Dr. Jones",             │
        │     "defense_panelist2": "Dr. Brown",             │
        │     "defense_panelist3": "Dr. Wilson",            │
        │     "defense_panelist4": "Dr. Taylor",            │
        │                                                   │
        │     // Schedule data (from details page)          │
        │     "scheduled_date": "2025-11-15",               │
        │     "scheduled_time": "14:00",                    │
        │     "scheduled_end_time": "16:00",                │
        │     "defense_mode": "Hybrid",                     │
        │     "defense_venue": "Room 301",                  │
        │     "scheduling_notes": "Bring copies",           │
        │                                                   │
        │     "coordinator_user_id": 42                     │
        │   }                                               │
        │                                                   │
        └───────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND CONTROLLER                               │
│           DefenseRequestController::updateCoordinatorStatus()            │
│                                                                          │
│  DB::beginTransaction()                                                  │
│                                                                          │
│  1. UPDATE coordinator_status = 'Approved'                               │
│                                                                          │
│  2. SAVE PANELS (if provided):                                           │
│     • defense_chairperson                                                │
│     • defense_panelist1                                                  │
│     • defense_panelist2                                                  │
│     • defense_panelist3                                                  │
│     • defense_panelist4                                                  │
│     • panels_assigned_at = NOW()                                         │
│                                                                          │
│  3. SAVE SCHEDULE (if provided):                                         │
│     • scheduled_date                                                     │
│     • scheduled_time                                                     │
│     • scheduled_end_time                                                 │
│     • defense_mode                                                       │
│     • defense_venue                                                      │
│     • scheduling_notes                                                   │
│                                                                          │
│  4. UPDATE WORKFLOW STATE:                                               │
│     IF (panels + schedule) → 'scheduled'                                 │
│     ELSE IF (panels only)  → 'panels-assigned'                           │
│     ELSE                   → 'coordinator-approved'                      │
│                                                                          │
│  5. LOG WORKFLOW HISTORY:                                                │
│     {                                                                    │
│       "event_type": "coordinator-status-update",                         │
│       "from_state": "adviser-approved",                                  │
│       "to_state": "scheduled",                                           │
│       "description": "Coordinator updated status to Approved             │
│                      and assigned panels and set schedule",              │
│       "user_name": "Dr. Admin",                                          │
│       "user_id": 42,                                                     │
│       "created_at": "2025-10-27 14:30:00"                                │
│     }                                                                    │
│                                                                          │
│  6. SEND EMAIL (if requested):                                           │
│     Mail::to($student->email)                                            │
│         ->send(new DefenseRequestApproved(...))                          │
│                                                                          │
│  DB::commit()                                                            │
│                                                                          │
│  return response()->json([                                               │
│    'ok' => true,                                                         │
│    'request' => $defenseRequest->fresh()                                 │
│  ])                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE UPDATED                                │
│                     defense_requests table                               │
│                                                                          │
│  coordinator_status      = 'Approved'          ✅                        │
│  workflow_state          = 'scheduled'         ✅                        │
│                                                                          │
│  defense_chairperson     = 'Dr. Smith'         ✅                        │
│  defense_panelist1       = 'Dr. Jones'         ✅                        │
│  defense_panelist2       = 'Dr. Brown'         ✅                        │
│  defense_panelist3       = 'Dr. Wilson'        ✅                        │
│  defense_panelist4       = 'Dr. Taylor'        ✅                        │
│  panels_assigned_at      = '2025-10-27 14:30'  ✅                        │
│                                                                          │
│  scheduled_date          = '2025-11-15'        ✅                        │
│  scheduled_time          = '14:00:00'          ✅                        │
│  scheduled_end_time      = '16:00:00'          ✅                        │
│  defense_mode            = 'Hybrid'            ✅                        │
│  defense_venue           = 'Room 301'          ✅                        │
│  scheduling_notes        = 'Bring copies'      ✅                        │
│                                                                          │
│  endorsement_form        = 'defense_documents/xyz.pdf'  ✅               │
│  attachments             = {"endorsement_form": "..."}  ✅               │
│                                                                          │
│  workflow_history        = [{ event_type: "...", ... }]  ✅             │
│                                                                          │
│  last_status_updated_at  = '2025-10-27 14:30'  ✅                        │
│  last_status_updated_by  = 42                  ✅                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUCCESS RESPONSE                                 │
│                                                                          │
│  • Toast notification: "Request approved successfully!"                  │
│  • Dialog closes                                                         │
│  • Page refreshes (window.location.reload())                             │
│  • Student receives email (if enabled)                                   │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                         KEY IMPROVEMENTS
═══════════════════════════════════════════════════════════════════════════

BEFORE (❌ Broken):
  • Only coordinator_status saved
  • Panels lost
  • Schedule lost
  • Separate API calls required

AFTER (✅ Fixed):
  • Everything saved in ONE request
  • Atomic transaction (all-or-nothing)
  • Intelligent workflow state
  • Comprehensive logging
  • Proper error handling
  • Email notification support

═══════════════════════════════════════════════════════════════════════════
```
