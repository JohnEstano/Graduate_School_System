<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Proposal Defense - Endorsement & Application</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  /* Print/A4 friendly layout */
  @page { size: A4; margin: 20mm; }
  html,body { height:100%; margin:0; padding:0; }
  body {
    font-family: "Times New Roman", Times, serif;
    color: #000;
    font-size: 12pt;
    line-height: 1.15;
    -webkit-print-color-adjust: exact;
    padding: 0;
    box-sizing: border-box;
    background: #fff;
  }

  .page {
    width: 100%;
    max-width: 210mm; /* A4 width */
    margin: 0 auto;
    padding: 18mm 18mm 12mm 18mm;
    box-sizing: border-box;
    page-break-after: always;
  }

  /* header */
  .top-row {
    display:flex;
    align-items:center;
    gap: 12px;
  }
  .logo {
    width:72px;
    flex: 0 0 72px;
  }
  .header-center {
    flex:1;
    text-align:center;
  }
  .header-center .univ { font-size:12pt; }
  .header-center .grad { font-size:11pt; margin-top:2px; }
  .title { font-weight:700; font-size:16pt; margin-top:8px; }
  .subtitle { font-weight:700; font-size:14pt; margin-top:6px; }

  /* main content block */
  .content {
    margin-top: 18px;
    padding-left: 6mm;
    padding-right: 6mm;
  }

  .row {
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:12px;
  }
  .label { font-weight:normal; display:block; margin-bottom:6px; }
  .field-left { width:62%; }
  .field-right { width:34%; text-align:right; }

  .program { margin-bottom:10px; }

  /* multiline title lines (four lines) */
  .thesis-lines { margin-top:8px; margin-bottom:8px; }
  .thesis-lines div {
    border-bottom: 1px solid #000;
    height: 14px;
    margin-bottom:6px;
  }

  .paragraph { margin-top:8px; margin-bottom:8px; }

  /* signatures */
  .signatures {
    display:flex;
    justify-content:space-between;
    gap: 12px;
    margin-top:22px;
  }
  .sign-left { width:58%; }
  .sign-right { width:40%; text-align:left; }

  .signature-line {
    display:inline-block;
    width:260px;
    border-bottom:1px solid #000;
    margin-bottom:6px;
    height:1px;
  }
  .small { font-size:11pt; }

  /* bottom boxed two-column area */
  .bottom-box {
    margin-top:18px;
    border:1px solid #000;
    padding:10px;
    display:flex;
    gap:12px;
    align-items:flex-start;
    font-size:10pt;
  }
  .bottom-col { width:50%; box-sizing:border-box; }
  .bottom-col b { display:block; margin-bottom:8px; font-size:10.5pt; }
  .bottom-col ol { margin:0 0 0 18px; padding:0; }
  .bottom-col li { margin-bottom:6px; }

  /* application page (page 2) */
  .app-title { font-weight:700; font-size:14pt; text-align:center; margin-top:6px; margin-bottom:6px; }
  .app-body { margin-top:10px; font-size:11pt; padding-left:6mm; padding-right:6mm; line-height:1.25; }
  .blank {
    display:inline-block;
    border-bottom:1px solid #000;
    min-width:160px;
    height: 12px;
    vertical-align: middle;
  }
  .rec-endorse { display:flex; gap:12px; margin-top:18px; }
  .rec-endorse .col { width:48%; }

  /* prevent splitting of signature lines */
  .avoid-break { page-break-inside: avoid; }

  @media print {
    .page { page-break-after: always; }
  }
</style>
</head>
<body>

  <!-- PAGE 1: ENDORSEMENT FORM -->
  <div class="page">
    <div class="top-row">
      <img src="{{ public_path('uic-logo.png') }}" alt="UIC Logo" class="logo">
      <div class="header-center">
        <div class="univ">University of the Immaculate Conception</div>
        <div class="grad">GRADUATE SCHOOL</div>
        <div class="title">PROPOSAL DEFENSE</div>
        <div class="subtitle">ENDORSEMENT FORM</div>
      </div>
      <!-- optional control no (right) -->
      <div style="flex:0 0 110px; text-align:right; font-size:10pt;">Control No. ________________</div>
    </div>

    <div class="content">
      <div class="row">
        <div class="field-left">
          <span class="label">Name of Student/ Candidate</span>
          <div>{{ $student_name ?? '______________________________' }}</div>
        </div>
        <div class="field-right">
          <span class="label">Date</span>
          <div>{{ $defense_date ?? '_____________' }}</div>
        </div>
      </div>

      <div class="program">
        <span class="label">Program of Study</span>
        <div>{{ $program ?? '______________________________' }}</div>
      </div>

      <div>
        <span class="label">Title of the Thesis / Dissertation:</span>
        <div class="thesis-lines">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>

      <div class="paragraph"><strong>Dear Dr. Amoguis</strong></div>

      <div class="paragraph">
        I have reviewed and fully endorsed the final manuscript attached for evaluation.
      </div>

      <div class="paragraph">Thank you.</div>

      <div class="signatures avoid-break">
        <div class="sign-left">
          <div class="signature-line"></div>
          <div class="small">Thesis / Dissertation Adviser<br>(Signature over Printed Name)</div>
        </div>

        <div class="sign-right">
          <div>Approved by:</div>
          <div style="margin-top:14px;">
            <div class="signature-line" style="width:200px"></div>
            <div class="small" style="font-weight:700; margin-top:6px;">Dr. Mary Jane B. Amoguis</div>
            <div class="small">Dean, Graduate School</div>
          </div>
        </div>
      </div>

      <div class="bottom-box">
        <div class="bottom-col">
          <b>An applicant for Thesis / Dissertation Proposal Defense should have accomplished the following before s/he is granted approval:</b>
          <ol>
            <li>Completed all academic requirements vouched by a Certificate of Completion issued by the Registrar</li>
            <li>Taken review class with the major subject teachers</li>
            <li>Passed the Comprehensive Examinations in all required subjects vouched by a Certification from the Graduate School Dean</li>
            <li>For Doctoral students, must have conducted a Public Forum</li>
            <li>Enrolled and attended classes in Thesis / Dissertation Writing and assigned to an adviser</li>
            <li>Written the Thesis / Dissertation proposal following the prescribed UIC format</li>
          </ol>
        </div>

        <div class="bottom-col">
          <b>Procedure for Proposal Defense:</b>
          <ol>
            <li>Secures and fills up a proposal defense endorsement form from the Administrative Assistant to be signed by the adviser.</li>
            <li>Pays the proposal defense fee at the cashier</li>
            <li>Submits the receipt to the Administrative Assistant and the manuscript, (7) for Doctorate student (5) for Masteral student to the assigned panels and adviser.</li>
            <li>Endorses the candidate to the Program Coordinator for the schedule.</li>
            <li>Asks the Program Coordinator on the proposed member of the panel to be approved by the Dean</li>
            <li>Schedules the proposal oral defense.</li>
          </ol>
        </div>
      </div>
    </div>
  </div>

  <!-- PAGE 2: APPLICATION FORM -->
  <div class="page">
    <div class="top-row">
      <img src="{{ public_path('uic-logo.png') }}" alt="UIC Logo" class="logo">
      <div class="header-center">
        <div class="univ">University of the Immaculate Conception</div>
        <div class="grad">GRADUATE SCHOOL</div>
        <div class="app-title">APPLICATION<br>PROPOSAL DEFENSE</div>
      </div>
      <div style="flex:0 0 110px; text-align:right; font-size:10pt;">Control No. ________________</div>
    </div>

    <div class="app-body">
      <p>
        I, <span class="blank"></span>, a student of <span class="blank" style="min-width:220px"></span>,
        respectfully request the office of the dean of graduate school that I be given APPROVAL to present my thesis/dissertation proposal before the members of the examination/defense panel for <span class="blank" style="min-width:220px"></span>.
      </p>

      <p>
        I swear to the best of my knowledge that I had passed the comprehensive examinations given on <span class="blank" style="min-width:170px"></span> covering all required subjects; that I had conducted my public Forum on <span class="blank" style="min-width:170px"></span> at <span class="blank" style="min-width:170px"></span>.
      </p>

      <p>
        Furthermore, I am aware that I have to submit my manuscript with the photocopy of the receipt of payments, not later than seven (7) days before the tentative date of my defense. I further know that if I fail to submit my manuscript on the specified period, the university reserves the right to reschedule the defense in such a way that it would not be prejudicial to either party; and that I am solely responsible for the delay of my defense.
      </p>

      <p style="margin-top:18px;">
        Date: <span class="blank" style="min-width:160px"></span>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        Applicant: <span class="blank" style="min-width:260px"></span>
      </p>

      <div class="rec-endorse">
        <div class="col">
          Recommended by:<br><br>
          <span class="blank" style="min-width:240px"></span><br>
          <div style="margin-top:6px;">Adviser</div>
        </div>
        <div class="col">
          Endorsed by:<br><br>
          <span class="blank" style="min-width:240px"></span><br>
          <div style="margin-top:6px;">Course Coordinator</div>
        </div>
      </div>

      <div style="margin-top:20px;">
        Approved by:
        <div style="margin-top:10px;">
          <div class="signature-line" style="width:280px"></div>
          <div class="small" style="font-weight:700; margin-top:6px;">Dr. Mary Jane Amoguis</div>
          <div class="small">Dean, Graduate School</div>
        </div>
      </div>
    </div>
  </div>

  <!-- end -->
</body>
</html>
