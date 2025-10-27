# Graduate School Document Generation MVP

## Overview

This MVP implements a workflow for generating, endorsing, and approving defense-related documents (endorsement forms) for graduate school defense requests. It covers the following roles and steps:

- **Student**: Submits defense requirements and uploads necessary files.
- **Adviser**: Reviews the submission, generates or uploads an endorsement form, and digitally signs it.
- **Coordinator**: Reviews the adviser’s endorsement, adds their signature, and approves the request.

## Key Features

- **PDF Template Mapping**: Admins can upload PDF templates and map dynamic fields (text, signatures) using the Template Editor.
- **Document Generation**: Endorsement forms are generated using mapped fields and real data from defense requests.
- **Digital Signatures**: Advisers and coordinators can draw or upload their signatures, which are embedded in generated documents.
- **Endorsement Workflow**: Advisers and coordinators can preview, sign, and upload endorsement forms. Status updates are tracked.
- **File Storage**: All generated and uploaded documents are stored securely and linked to the corresponding defense request.

## Workflow

1. **Student Submission**
   - Student fills out the defense requirements form and uploads required files.
   - Payment amount is auto-calculated based on program and defense type.

2. **Adviser Endorsement**
   - Adviser reviews the request.
   - Adviser generates the endorsement form using the mapped PDF template, or uploads a signed PDF.
   - Adviser selects/creates a digital signature and endorses the request.

3. **Coordinator Approval**
   - Coordinator reviews the adviser’s endorsement form.
   - Coordinator generates a new version with their info/signature, or uploads a signed PDF.
   - Coordinator approves the request, optionally sending an email notification.

## Technical Highlights

- **Backend**: Laravel models for `DefenseRequest`, `DocumentTemplate`, `GeneratedDocument`, and `UserSignature`. Document generation uses FPDI for PDF manipulation.
- **Frontend**: React/TypeScript pages for submission, endorsement, approval, and template editing. PDF.js is used for preview and mapping.
- **API Endpoints**: RESTful routes for document generation, signature management, and status updates.
- **Security**: CSRF protection for all sensitive actions. Only authorized users can endorse/approve.

## How to Test

1. **Setup PDF Templates**
   - Go to Settings > Documents > Template Editor.
   - Upload a PDF and map required fields (e.g., student name, adviser signature).

2. **Submit a Defense Request**
   - Log in as a student and submit a new defense request.

3. **Adviser Endorsement**
   - Log in as an adviser, open the request, and endorse using the dialog.
   - Draw or upload a signature, generate the PDF, and submit.

4. **Coordinator Approval**
   - Log in as a coordinator, open the request, and approve using the dialog.
   - Add coordinator info/signature, generate the PDF, and approve.

## Notes

- All generated documents are stored in `/storage/generated/defense/`.
- Signature images are stored in `/storage/signatures/{user_id}/`.
- Only active signatures are used for document generation.
- Endorsement forms can be regenerated or replaced at any step.

## Future Improvements

- Add Dean signature workflow.
- Support multi-page templates and advanced field types.
- Email notifications for all workflow steps.
- Audit trail for document changes and approvals.

---