# MVP Testing Quick Reference

## 🚀 Quick Start Testing

### Prerequisites
1. Database migrated: `php artisan migrate`
2. Storage linked: `php artisan storage:link`
3. Test accounts created for:
   - Student
   - Adviser (Faculty role)
   - Coordinator

---

## 📋 Step-by-Step Testing Checklist

### ✅ Phase 1: Template Setup (Admin/Coordinator)

**URL**: `/settings/documents`

1. **Upload Template**
   - Select "Endorsement Form (Proposal)" from dropdown
   - Choose a PDF file (endorsement form template)
   - Click Upload
   - ✅ Template appears in list

2. **Map Fields**
   - Click **Fields** link next to the template
   - Add fields by clicking "Add Field" button
   - Map these required fields:
     ```
     student.full_name         (text)
     student.program           (text)
     student.school_id         (text)
     request.thesis_title      (multiline)
     request.defense_type      (text)
     schedule.date             (text)
     schedule.time             (text)
     adviser.full_name         (text)
     coordinator.full_name     (text)
     signature.adviser         (signature)
     signature.coordinator     (signature)
     today.date               (text)
     ```
   - Drag fields to correct positions on PDF
   - Resize as needed
   - Click **Save** button
   - ✅ Fields saved successfully

---

### ✅ Phase 2: Student Submission

**URL**: `/student/defense-requirements` or submit form

1. **Fill Defense Form**
   - Student info auto-filled
   - Select Defense Type: "Proposal Defense"
   - Enter Thesis Title
   - Payment amount auto-calculated
   - ✅ Form validates

2. **Upload Documents**
   - REC Endorsement (PDF)
   - Proof of Payment (image/PDF)
   - Manuscript (PDF)
   - Similarity Form (PDF)
   - ✅ Files selected

3. **Submit**
   - Click "Submit Request"
   - ✅ Success message shown
   - ✅ Redirected to dashboard

---

### ✅ Phase 3: Adviser Endorsement

**URL**: `/all-defense-requirements` → Click on submission

1. **Review Submission**
   - View student details
   - Check uploaded documents
   - ✅ All info visible

2. **Open Endorsement Dialog**
   - Click **Endorse** button
   - Dialog opens with 3 tabs
   - ✅ Dialog loaded

3. **Preview Tab**
   - Endorsement form auto-generates
   - Preview PDF shown
   - ✅ PDF displays correctly

4. **Signature Tab** (Choose one):
   
   **Option A: Draw Signature**
   - Click "Draw Signature" button
   - Draw on canvas
   - Click "Save Signature"
   - ✅ Signature saved and appears in list
   
   **Option B: Upload Signature**
   - Click "Upload Image"
   - Select PNG file (transparent background recommended)
   - ✅ Signature uploaded and appears in list
   
   **Option C: Use Existing**
   - Select from existing signatures
   - Click "Activate"
   - ✅ Signature activated

5. **Generate with Signature**
   - Active signature shown with green badge
   - Click "Regenerate Document" (on Preview tab)
   - ✅ New PDF generated with signature embedded

6. **Upload Tab** (Optional Alternative)
   - Drag/drop or select custom signed PDF
   - Click "Use This File"
   - ✅ File uploaded

7. **Endorse**
   - Click **Endorse Request** button
   - Confirm action
   - ✅ Status updates to "Adviser Approved"
   - ✅ Endorsement form saved

---

### ✅ Phase 4: Coordinator Approval

**URL**: `/coordinator/defense-requests` → Click on request

1. **Review Endorsed Request**
   - View all details
   - See adviser's endorsement form
   - ✅ Endorsement form visible

2. **Open Approval Dialog**
   - Click **Approve** button
   - Dialog opens with 3 tabs
   - ✅ Dialog loaded

3. **Preview Tab**
   - View existing endorsement form
   - Enter Coordinator Full Name (e.g., "Dr. Juan Dela Cruz")
   - Enter Coordinator Title (e.g., "Graduate School Coordinator")
   - ✅ Fields filled

4. **Signature Tab**
   - Create/select coordinator signature (same as adviser)
   - Activate signature
   - ✅ Signature ready

5. **Generate New Version**
   - Click "Generate Document" button
   - New PDF created with:
     - All original content
     - Coordinator name/title
     - Coordinator signature
   - ✅ PDF preview updated

6. **Upload Tab** (Optional Alternative)
   - Upload custom signed PDF if preferred
   - ✅ File uploaded

7. **Approve**
   - Click **Approve Request** button
   - Choose whether to send email
   - Confirm action
   - ✅ Status updates to "Coordinator Approved"
   - ✅ New endorsement form saved

---

## 🔍 Verification Points

### Check Database Records
```sql
-- Templates
SELECT id, name, code FROM document_templates;

-- Signatures
SELECT id, user_id, label, active FROM user_signatures;

-- Generated Documents
SELECT id, defense_request_id, document_template_id, output_path 
FROM generated_documents;

-- Defense Requests
SELECT id, first_name, last_name, adviser_status, coordinator_status, workflow_state
FROM defense_requests;
```

### Check File Storage
```bash
# Templates
ls storage/app/public/templates/

# Signatures (replace {user_id})
ls storage/app/public/signatures/{user_id}/

# Generated Documents
ls storage/app/public/generated/defense/
```

### Check Logs
```bash
# Application logs
tail -f storage/logs/laravel.log

# Look for:
# - "DocumentGenerator: Starting generation"
# - "DocumentGenerator: PDF saved to storage"
# - "Signature found"
```

---

## 🐛 Common Issues & Solutions

### Issue: Template fields not saving
**Solution**: Check browser console for errors, ensure CSRF token is present

### Issue: PDF not generating
**Solution**: 
- Check that template has `fields_meta` data
- Verify FPDI library is installed: `composer require setasign/fpdi`
- Check storage permissions: `chmod -R 775 storage/`

### Issue: Signature not appearing in PDF
**Solution**:
- Verify signature is marked as `active=true`
- Check signature file exists in storage
- Ensure field type is set to `signature` in template

### Issue: "File not found" error
**Solution**:
- Run `php artisan storage:link`
- Check paths don't have double `/storage/` prefix

### Issue: Dialog not opening
**Solution**:
- Check browser console for JavaScript errors
- Verify React component is properly imported
- Check CSRF token is valid

---

## 📊 Test Data Examples

### Sample Student Info
```
Name: Juan Dela Cruz
School ID: 2021-12345
Program: Master of Science in Computer Science
```

### Sample Thesis Titles
```
Proposal: "Machine Learning Applications in Healthcare Data Analysis"
Prefinal: "Implementation of Deep Learning Models for Medical Image Classification"
Final: "A Comprehensive Framework for Predictive Healthcare Analytics Using Deep Learning"
```

### Sample Coordinator Info
```
Full Name: Dr. Maria Santos
Title: Graduate School Coordinator
```

---

## ✅ Success Criteria

- [ ] Template uploaded and fields mapped
- [ ] Student can submit defense requirements
- [ ] Adviser can endorse with digital signature
- [ ] Coordinator can approve with additional signature
- [ ] Generated PDFs contain all mapped fields
- [ ] Signatures properly embedded in PDFs
- [ ] Workflow states update correctly
- [ ] Files stored in correct directories
- [ ] No errors in logs

---

## 🎉 MVP Complete!

Once all checkboxes are checked, the MVP is fully functional and ready for production use.

**Next Steps**:
1. Create test accounts
2. Upload sample PDF templates
3. Run through complete workflow
4. Document any issues
5. Deploy to production
