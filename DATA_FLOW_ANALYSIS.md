# DATA FLOW: Defense Request to Student Records & Honorarium

## Current System Analysis (October 26, 2025)

### ✅ YES - The System IS Connected!

Here's the complete data flow from student submission to payment records:

---

## 📊 WORKFLOW STAGES

### 1️⃣ **STUDENT SUBMITS DEFENSE REQUEST**
**Model:** `DefenseRequest`
**Controller:** `DefenseRequestController::store()`
**Initial State:** `workflow_state = 'adviser-review'`

```
Student → Defense Request Form → DefenseRequest record created
Fields: student info, thesis title, defense type, adviser, etc.
```

---

### 2️⃣ **ADVISER REVIEW**
**Route:** `/defense-requests/{id}/adviser-decision`
**Method:** `DefenseRequestController::adviserDecision()`
**States:** 
- ✅ Approved → `workflow_state = 'adviser-approved'`
- ❌ Rejected → `workflow_state = 'adviser-rejected'`

```
Adviser reviews → Approves/Rejects → Email notification sent
```

---

### 3️⃣ **COORDINATOR REVIEW**
**Route:** `/defense-requests/{id}/coordinator-decision`
**Method:** `DefenseRequestController::coordinatorDecision()`
**States:**
- ✅ Approved → `workflow_state = 'coordinator-approved'`
- ❌ Rejected → `workflow_state = 'coordinator-rejected'`

**Visible to:**
- Coordinator
- Administrative Assistant
- Dean

---

### 4️⃣ **PANELS ASSIGNED**
**State:** `workflow_state = 'panels-assigned'`
**Action:** Coordinator assigns panelists:
- Defense Chairperson
- Panel Members (1-4)

---

### 5️⃣ **DEFENSE SCHEDULED**
**State:** `workflow_state = 'scheduled'`
**Fields Set:**
- `scheduled_date`
- `scheduled_time`
- `scheduled_end_time`
- `defense_mode` (Onsite/Virtual)
- `defense_venue`

---

### 6️⃣ **DEFENSE COMPLETED** ⭐ (KEY INTEGRATION POINT)
**Route:** `/defense-requests/{id}/complete`
**Method:** `DefenseRequestController::completeDefense()`
**State:** `workflow_state = 'completed'`

**What happens automatically:**

#### A. Update Defense Request
```php
$defenseRequest->workflow_state = 'completed';
$defenseRequest->coordinator_status = 'Approved';
$defenseRequest->status = 'Completed';
```

#### B. Create Honorarium Payments (Line 2095-2180)
**For each committee member:**
- Adviser
- Panel Chair
- Panel Members (1-4)

```php
HonorariumPayment::create([
    'defense_request_id' => $defenseRequest->id,
    'panelist_id' => $panelist?->id,
    'panelist_name' => $member['name'],
    'role' => $member['role'],
    'amount' => $rate->amount,  // ⭐ FROM payment_rates table!
    'payment_status' => 'pending',
    'defense_date' => $defenseRequest->scheduled_date,
    'student_name' => $defenseRequest->first_name . ' ' . $defenseRequest->last_name,
    'program' => $defenseRequest->program,
    'defense_type' => $defenseRequest->defense_type,
]);
```

**Payment rates fetched from:**
```php
PaymentRate::where('program_level', $programLevel)
    ->where('defense_type', $defenseRequest->defense_type)
    ->where('type', $member['role'])
    ->first();
```

---

### 7️⃣ **SYNC TO STUDENT RECORDS** (Optional Service)
**Service:** `StudentRecordSyncService::syncDefenseToStudentRecord()`
**What it does:**

#### A. Create/Update Program Record
```php
ProgramRecord::firstOrCreate(['name' => $program])
```

#### B. Create/Update Student Record
```php
StudentRecord::updateOrCreate(
    ['student_id' => $school_id],
    [student details]
)
```

#### C. Create Panelist Records
```php
PanelistRecord::firstOrCreate([
    'pfirst_name' => $panelist->name,
    'program_record_id' => $programRecord->id,
])
```

#### D. Create Payment Records
```php
PaymentRecord::create([
    'student_record_id' => $studentRecord->id,
    'panelist_record_id' => $panelistRecord->id,
    'defense_request_id' => $defenseRequest->id,
    'amount' => $honorariumPayment->amount,
])
```

---

## 🔗 RELATIONSHIPS

### DefenseRequest Model
```php
- honorariumPayments() → hasMany(HonorariumPayment)
- student() → belongsTo(User, 'submitted_by')
- adviser() → belongsTo(User, 'adviser_user_id')
- coordinator() → belongsTo(User, 'coordinator_user_id')
```

### StudentRecord Model
```php
- defenseRequest() → belongsTo(DefenseRequest)
- payments() → hasMany(PaymentRecord)
- panelists() → belongsToMany(PanelistRecord)
- program() → belongsTo(ProgramRecord)
```

### HonorariumPayment Model
```php
- defenseRequest() → belongsTo(DefenseRequest)
- panelist() → belongsTo(Panelist)
```

### PaymentRecord Model
```php
- student() → belongsTo(StudentRecord)
- panelist() → belongsTo(PanelistRecord)
- defenseRequest() → belongsTo(DefenseRequest)
```

---

## 📋 STUDENT RECORDS PAGE

### How It Fetches Data

**Controller:** `StudentRecordController::showProgramStudents()`

**Method 1: From Payment Records (Current Legacy Data)**
```php
StudentRecord::with(['payments.panelist'])
    ->where('program_record_id', $programId)
    ->get();
```

**Method 2: From Defense Requests (New System)**
```php
DefenseRequest::where('school_id', $studentRecord->student_id)
    ->where('workflow_state', 'completed')
    ->get();

// Then builds payment data:
$this->buildDefensePaymentData($defense, $student);
```

### Payment Calculation (USING PAYMENT RATES!)
**File:** `StudentRecordController.php` (Lines 85-136)

```php
// Get REC FEE from database
$recFeeRate = PaymentRate::where('program_level', $programLevel)
    ->where('defense_type', $payment['defense_type'])
    ->where('type', 'REC Fee')
    ->first();

// Get SCHOOL SHARE from database
$schoolShareRate = PaymentRate::where('program_level', $programLevel)
    ->where('defense_type', $payment['defense_type'])
    ->where('type', 'School Share')
    ->first();

$recFee = $recFeeRate ? floatval($recFeeRate->amount) : 0;
$schoolShare = $schoolShareRate ? floatval($schoolShareRate->amount) : 0;

// Calculate total
$grandTotal = $panelistTotal + $recFee + $schoolShare;
```

---

## ✅ VERIFICATION CHECKLIST

### Prerequisites Check
- [x] Student passes comprehensive exam
- [x] Student meets all defense requirements
- [x] Adviser assigned to defense request
- [x] Coordinator assigned to review

### Defense Request Flow
- [x] Student submits defense request
- [x] Adviser reviews (approve/reject)
- [x] Coordinator reviews (approve/reject)
- [x] Administrative Assistant can verify
- [x] Dean has oversight access
- [x] Panels assigned
- [x] Defense scheduled
- [x] Defense marked as completed

### Automatic Processes
- [x] Honorarium payments created automatically on completion
- [x] Payment rates fetched from `payment_rates` table
- [x] REC Fee rates editable via `/dean/payment-rates`
- [x] School Share rates editable via `/dean/payment-rates`
- [x] Email notifications sent at each stage

### Data Visibility
- [x] Student Records page shows all completed defenses
- [x] Honorarium page shows all payments by panelist
- [x] Payment breakdown includes all panelists + REC Fee + School Share
- [x] PDF receipts generated with full payment details

---

## 🎯 ANSWER TO YOUR QUESTION

**YES, the system is fully connected!**

### The Flow:
1. **Student** submits defense request
2. **Adviser** reviews and approves
3. **Coordinator** reviews and approves
4. **Administrative Assistant** can verify documents
5. **Dean** has oversight
6. Defense is scheduled and completed
7. **Honorarium payments automatically created** using payment rates
8. **Student Records fetches data** from both:
   - Legacy `payment_records` table
   - New `defense_requests` + `honorarium_payments`

### All Rates Are Editable:
The **Dean** can edit all rates (including REC Fee and School Share) at:
**`/dean/payment-rates`**

Changes are immediately reflected in:
- New defense completions
- Student record calculations
- Payment breakdowns
- PDF receipts

---

## 🔄 DATA SOURCES

### Student Records Page Gets Data From:

**Source 1: PaymentRecord (Legacy)**
```
payment_records → student_records → panelist_records
```

**Source 2: DefenseRequest + HonorariumPayment (Current)**
```
defense_requests (completed) → honorarium_payments
                             → payment_rates (for amounts)
```

Both sources are **merged and displayed together** in the Student Records interface!

---

## 📝 NOTES

1. **StudentRecordSyncService** can optionally sync completed defenses to the legacy payment_records table for backward compatibility

2. **Payment rates are centralized** in the `payment_rates` table and used by:
   - Defense completion (creates honorarium)
   - Student records (calculates totals)
   - PDF generation (shows breakdown)

3. **All stakeholders have access:**
   - Student: submits and tracks
   - Adviser: reviews and approves
   - Coordinator: manages and assigns
   - Admin Assistant: verifies documents
   - Dean: oversees and edits rates

**System is working as intended! ✅**
