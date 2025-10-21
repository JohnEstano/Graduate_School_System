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
      top: 4.5cm;
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
      right: 5.3cm;
      text-align: right;
      font-family: Arial, sans-serif;
      font-size: 12.7px;
      font-weight: bold;
      color: #ff00ff;
    }

    /* --- Main Content --- */
    .content-area {
      position: relative;
      top: 0cm; /* Align directly below header line */
      left: 4cm; /* Align with header’s left start */
      /* width: calc(100% - 5cm); Keeps consistent left/right margins */
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #333;
    }

    /* --- Footer --- */
    .footer-horizontal-line {
      position: absolute;
      left: 0;
      right: 7cm;
      bottom: 3cm;
      height: 3px;
      background-color: #ff00ff;
    }

    .footer-left {
      position: absolute;
      bottom: 0.8cm;
      right: 7cm;
      letter-spacing: 0.5px;
      font-family: 'Tahoma', Times, serif;
      font-size: 8px;
      line-height: 1.3;
      text-align: center;
    }

    .footer-right {
      position: absolute;
      bottom: 2.5cm;
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

    /* --- Fee Breakdown --- */
    .fee-section {
      width: 100%;
      margin-top: 10px;
    }

    .fee-breakdown {
      margin-top: 25px;
      margin-bottom: 25px;
      max-width: 600px;
      font-family: Arial, sans-serif;
      font-size: 12px;
    }

    .fee-line {
      width: 100%;
      margin-bottom: 4px;
    }

    .label-group {
      display: inline-block;
      width: 75%;
    }

    .amount {
      display: inline-block;
      width: 20%;
      text-align: right;
    }

    .amount::before {
      content: "₱ ";
    }

    .fee-line.total {
      font-weight: bold;
      font-size: 13px;
      border-top: 1px solid #333;
      padding-top: 6px;
    }

    .fee-line.total .amount {
      border-bottom: 2px double #333;
    }

    .rec-fee {
      background-color: #ffffa0;
      display: inline-block;
      padding: 1px 4px;
      font-weight: bold;
    }

    .rec-fee-note {
      font-style: italic;
      font-size: 11px;
      padding-left: 6px;
    }

    .reference-line {
      width: 100%;
      margin-top: 15px;
      font-family: 'Courier New', Courier, monospace;
      font-weight: bold;
    }

    .reference-line span:first-child {
      float: left;
    }

    .reference-line span:last-child {
      float: right;
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
            Father Selga Street, Davao City 8000, Philippines</p>
          <p><img src="images/phoneIcon.png" width="10" height="10" style="vertical-align: middle; margin-right: 5px;">
            221-8090 local 131</p>
          <p><img src="images/printerIcon.png" width="10" height="10" style="vertical-align: middle; margin-right: 5px;">
            (63-082) 226-2676</p>
          <p><img src="images/internetIcon.png" width="10" height="10" style="vertical-align: middle; margin-right: 5px;">
            www.uic.edu.ph</p>
          <p><img src="images/emailIcon.png" width="10" height="10" style="vertical-align: middle; margin-right: 5px;">
            <span>ccs@uic.edu.ph</span></p>
        </div>
      </div>
    </div>

    <div class="header-right">Office of the College of Computer Studies</div>

    <div class="content-area">
      <div class="fee-document-date">Today date</div>

      <p><strong>Student's Name:</strong> DYNAH C. SOLIS (MAED-PE)</p>
      <p><strong>Type of Defense:</strong> Onsite Defense</p>
      <p><strong>Date of Defense:</strong> April 22, 2025</p>

      <div class="fee-section">
        <h3 style="text-decoration: underline;">Proposal Defense Fee (Thesis Writing)</h3>

        <div class="fee-breakdown">
          <div class="fee-line"><span class="label-group"><strong>Adviser:</strong> DR. AVA SHELDIN GUERRERO</span><span class="amount">3,000.00</span></div>
          <div class="fee-line"><span class="label-group"><strong>Chairman:</strong> DR. PORFERIA S. PORALAN</span><span class="amount">2,000.00</span></div>
          <div class="fee-line"><span class="label-group"><strong>Members:</strong></span></div>
          <div class="fee-line"><span class="label-group">DR. EDNA T. SALVA</span><span class="amount">1,200.00</span></div>
          <div class="fee-line"><span class="label-group">DR. REGINE JOYCE RODRIGUEZ</span><span class="amount">1,200.00</span></div>
          <div class="fee-line"><span class="label-group">DR. JAFFMAR PALAWAN</span><span class="amount">1,200.00</span></div>
          <div class="fee-line"><span class="label-group"><span class="rec-fee">REC FEE</span> <span class="rec-fee-note">(PLEASE TRANSFER TO REC FUND)</span></span><span class="amount"><strong>2,200.00</strong></span></div>
          <div class="fee-line"><span class="label-group">Document Processing (UIC Share):</span><span class="amount">450.00</span></div>
          <div class="fee-line total"><span class="label-group"><strong>TOTAL</strong></span><span class="amount">11,250.00</span></div>
        </div>

        <div class="reference-line">
          <span>1558453-D</span>
          <span>₱11,250.00</span>
        </div>
      </div>

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

      <div class="footer-logo">
        Management System<br>ISO 9001:2015
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
