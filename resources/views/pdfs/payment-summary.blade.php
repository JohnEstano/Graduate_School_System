<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>University of the Immaculate Conception - Official Letterhead</title>

  <style>
    /* --- General Page Setup --- */
    @page {
      size: A4;
      margin: 0;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #f0f0f0;
      display: block;
      color: #000;
      -webkit-print-color-adjust: exact;
    }

    .a4-container {
      width: 21cm;
      min-height: 29.7cm;
      background: white;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.15);
      position: relative;
      padding: 0;
      box-sizing: border-box;
    }

    /* --- Decorative Lines --- */
    .vertical-line {
      position: absolute;
      left: 3.5cm;
      top: 0;
      bottom: 8cm;
      width: 4px;
      background-color: #ff00ff;
    }

    .header-horizontal-line {
      position: absolute;
      left: 0;
      top: 4.2cm;
      right: 0;
      height: 5px;
      background-color: #ff00ff;
    }

    /* --- Header Section --- */
    .header {
      position: relative;
      height: 4.5cm;
      padding-left: 2.5cm;
      padding-top: 1cm;
    }

    .logo-placeholder {
      position: absolute;
      top: 1.2cm;
      left: 0.8cm;
      width: 2.3cm;
      height: 2.3cm;
      z-index: 10;
    }

    .logo-placeholder img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .university-details {
      position: relative;
      left: 2.3cm;
      top: 0;
    }

    .university-name {
      font-family: Arial, sans-serif;
      font-size: 24px;
      font-weight: bold;
      color: #ff66ff;
      margin-bottom: 2px;
      letter-spacing: 0.5px;
    }

    .contact-info p {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10.8px;
      line-height: 1.6;
      color: #ff66ff;
      margin: 0;
    }

    .contact-info span {
      color: #0000ff;
      text-decoration: underline;
    }

    .header-right {
      position: absolute;
      top: 3.8cm;
      right: 2cm;
      text-align: right;
      font-family: Arial, sans-serif;
      font-size: 12.7px;
      font-weight: bold;
      color: #ff00ff;
    }

    /* --- Main Content --- */
    .content-area {
      position: relative;
      top: 0; /* Align directly below header line */
      left: 4cm; /* Align with header’s left start */
      /* width: calc(100% - 5cm); Keeps consistent left/right margins */
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #333;
    }

    .fee-document-date {
      font-weight: bold;       /* Makes it stand out a bit */
      margin-bottom: 24px;     /* ⬅ adds space equivalent to ~2 lines before next section */
      margin-top: 10px;        /* optional, small top space */
    }

    /* --- Defense Info Section Styling --- */
    .defense-info p {
      margin: 4px 0;            /* Controls vertical spacing between lines */
      font-size: 13px;           /* Slightly smaller than headings for readability */
      line-height: 1.4;          /* Keeps clean spacing in PDF */
      color: #000;               /* Ensure dark readable text */
      font-family: 'Arial', sans-serif; /* Matches rest of document */
    }

    .defense-info strong {
      color: #333;               /* Emphasize the label (e.g. Student’s Name:) */
    }

    /* --- Fee Breakdown --- */
    .fee-section {
      width: 100%;
      margin-top: 10px;
      clear: both;
    }

    .fee-breakdown {
      margin-top: 25px;
      margin-bottom: 25px;
      max-width: 600px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      position: relative;
    }

    .fee-line {
      width: 100%;
      margin-bottom: 4px;
      display: table;
      table-layout: fixed;
      clear: both;
    }

    .label-group {
      display: table-cell;
      width: 75%;
      vertical-align: top;
      position: relative;
      padding-right: 10px;
    }

    .amount {
      display: table-cell;
      width: 25%;
      text-align: right;
      vertical-align: top;
      white-space: nowrap;
    }

    .fee-line.total {
      font-weight: bold;
      font-size: 13px;
      border-top: 1px solid #333;
      padding-top: 6px;
      margin-top: 8px;
    }

    .rec-fee {
      background-color: #ffffa0;
      display: inline-block;
      padding: 1px 4px;
      font-weight: bold;
      margin-right: 4px;
    }

    .rec-fee-note {
      font-style: italic;
      font-size: 11px;
      padding-left: 6px;
      white-space: nowrap;
    }

    .reference-line {
      width: 100%;
      margin-top: 15px;
      font-family: 'Courier New', Courier, monospace;
      font-weight: bold;
    }

    .reference-line span:first-child {
      float: left;
      width: 80%;
    }

    .reference-line span:last-child {
      float: right;
      width: 80%;
    }

    .signatures {
      margin-top: 80px;
      width: 100%;
    }

    .signature-block {
      width: 35%;
      display: inline-block;
      vertical-align: top;
    }

    .signature-block .label {
      font-size: 0.9em;
      color: #555;
    }

    .signature-block .name {
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 40px;
      border-top: 1px solid #777;
      padding-top: 5px;
    }

    .signature-block .title {
      font-size: 0.9em;
    }

        /* --- Footer --- */
    .footer-horizontal-line {
      position: absolute;
      left: 0;
      right: 5cm;
      bottom: 3cm;
      height: 3px;
      background-color: #ff00ff;
    }

    .footer-left {
      position: absolute;
      bottom: 0.8cm;
      right: 6.5cm;
      letter-spacing: 0.5px;
      font-family: 'Tahoma', Times, serif;
      font-size: 8px;
      line-height: 1.3;
      text-align: center;
    }

    .footer-right {
      position: absolute;
      bottom: 2cm;
      right: 1cm;
      text-align: right;
    }

    .tuv-logo-placeholder {
      width: 3.5cm;
      height: auto;
    }

    .tuv-logo {
      width: 100%;
      height: auto;
      display: block;
    }

    .page-info {
      font-size: 9pt;
      margin-top: 5px;
      text-align: center;
    }

    .footer-logo {
      text-align: right;
      font-size: 0.8em;
      color: #888;
      margin-top: 40px;
      padding-right: 5.5cm;
    }
  </style>
</head>

<body>
  <div class="a4-container">
    <div class="vertical-line"></div>
    <div class="header-horizontal-line"></div>

    <div class="header">
      <div class="logo-placeholder">
        <img src="images/logoUIC.png" alt="University Logo" />
      </div>

      <div class="university-details">
        <div class="university-name">University of the Immaculate Conception</div>
        <div class="contact-info">
          <p><img src="images/locationIcon.png" width="10" height="10" style="vertical-align: middle; margin-right: 5px;">
            Bonifacio Street, Davao City 8000, Philippines</p>
          <p><img src="images/phoneIcon.png" width="10" height="10" style="vertical-align: middle; margin-right: 5px;">
            (63-082) 227-1573 local 240/(63-082) 227-3794</p>
          <p><img src="images/printerIcon.png" width="10" height="10" style="vertical-align: middle; margin-right: 5px;">
            (63-082) 226-3606</p>
          <p><img src="images/internetIcon.png" width="10" height="10" style="vertical-align: middle; margin-right: 5px;">
            www.uic.edu.ph</p>
          <p><img src="images/emailIcon.png" width="10" height="10" style="vertical-align: middle; margin-right: 5px;">
            <span>graduateschool@uic.edu.ph</span></p>
        </div>
      </div>
    </div>

    <div class="header-right">Office of the Dean of Graduate School</div>

    <div class="content-area">
      <div class="fee-document-date">{{ $today_date }}</div>

      <div class="defense-info">
        <p><strong>Student's Name:</strong> {{ $student_name }} ({{ $program }})</p>
        <p><strong>Type of Defense:</strong> {{ $defense_mode ?? 'Onsite' }} Defense</p>
        <p><strong>Date of Defense:</strong> {{ \Carbon\Carbon::parse($defense_date)->format('F d, Y') }}</p>
      </div>

      <div class="fee-section">
        <h3 style="text-decoration: underline;">{{ $defense_type }} Defense Fee (Thesis Writing)</h3>

        <div class="fee-breakdown">
          @foreach($panelists as $panelist)
            @if($panelist['role'] === 'Adviser')
              <div class="fee-line"><span class="label-group"><strong>Adviser:</strong> {{ strtoupper($panelist['name']) }}</span><span class="amount">{{ number_format($panelist['amount'], 2) }}</span></div>
            @elseif($panelist['role'] === 'Panel Chair')
              <div class="fee-line"><span class="label-group"><strong>Chairman:</strong> {{ strtoupper($panelist['name']) }}</span><span class="amount">{{ number_format($panelist['amount'], 2) }}</span></div>
            @endif
          @endforeach

          <div class="fee-line"><span class="label-group"><strong>Members:</strong></span></div>
          @foreach($panelists as $panelist)
            @if(str_starts_with($panelist['role'], 'Panel Member') || $panelist['role'] === 'Panel Member')
              <div class="fee-line"><span class="label-group">{{ strtoupper($panelist['name']) }}</span><span class="amount">{{ number_format($panelist['amount'], 2) }}</span></div>
            @endif
          @endforeach

          <br />
          <br />

          @if($rec_fee > 0)
            <div class="fee-line"><span class="label-group"><span class="rec-fee">REC FEE</span> <span class="rec-fee-note">(PLEASE TRANSFER TO REC FUND)</span></span><span class="amount"><strong>{{ number_format($rec_fee, 2) }}</strong></span></div>
          @endif
          
          @if($school_share > 0)
            <div class="fee-line"><span class="label-group">Document Processing (UIC Share):</span><span class="amount">{{ number_format($school_share, 2) }}</span></div>
          @endif
          
          <div class="fee-line total"><span class="label-group"><strong>TOTAL</strong></span><span class="amount">{{ number_format($grand_total, 2) }}</span></div>
        </div>

          <br />
          <br />

        <div class="reference-line">
          <span>{{ $or_number }}</span>
          <span style="float: right; margin-left= 10px;" >Php {{ number_format($grand_total, 2) }}</span>
        </div>
      </div>

          <br />
          <br />
          <br />
          <br />

      <div class="signatures">
        <div class="signature-block">
          <span class="label">Prepared by:</span>
          <div class="name">MS. CATHERINE C. SEMILLA</div>
          <div class="title">Graduate School Admin Asst.</div>
        </div>
        <div class="signature-block">
          <span class="label">Noted by:</span>
          <div class="name">DR. MARY JANE B. AMOGUIS</div>
          <div class="title">Dean, Graduate School</div>
        </div>
      </div>
    </div>

    <div class="footer-horizontal-line"></div>

    <div class="footer-left">
      <p><strong>CHED Full Autonomous Status • PAASCU Accredited, Institutional Accreditation Status<br>
      Bureau of Immigration Accredited • Deputized to offer ETEEAP • Science Resource Center, DENR Recognized</strong></p>
      <strong>MEMBER: Catholic Educational Association of the Philippines (CEAP) • Association of Catholic Universities of the <br>
      Philippines (ACUP) • ASEAN University Network (AUN-QA, Associate Member) • University Mobility in Asia and the <br>
      Pacific (UMAP) • Association of Southeast and East Asian Catholic Colleges and Universities (ASEACCU) • Southeast <br>
      Asian Ministers of Education Organization (SEAMEO) Schools' Network</strong>
    </div>

    <div class="footer-right">
      <div class="tuv-logo-placeholder">
        <img src="images/managementSystemLogo.jpg" alt="TÜV Rheinland Certified Logo" class="tuv-logo">
      </div>
      <div class="page-info">PAGE 1 of 1</div>
    </div>
  </div>
</body>
</html>
