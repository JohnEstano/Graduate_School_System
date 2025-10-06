<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>University of the Immaculate Conception Letter</title>
  <style>
    /* --- Basic Page Setup --- */
    html, body {
        height: 100%;
        margin: 0;
        font-family: "Times New Roman", serif;
    }

    body {
      display: flex;
      flex-direction: column;
      padding: 40px;
      box-sizing: border-box;
    }

    /* --- Header & Contact Info --- */
    .header {
      text-align: center;
      margin-bottom: 20px;
    }

    .header h2 {
      margin: 0;
      font-size: 18pt;
      font-weight: bold;
    }

    .header p {
      margin: 2px 0;
      font-size: 12pt;
    }
    
    .header a, .contact a {
      color: black;
      text-decoration: none;
    }

    .contact {
      text-align: center;
      font-size: 11pt;
      margin-bottom: 40px;
    }

    /* --- Main Content Area --- */
    .content {
      font-size: 12pt;
      text-align: justify;
      flex-grow: 1;
    }

    /* --- Footer Section --- */
    .footer-container {
      border-top: 1px solid #000;
      padding-top: 15px;
      margin-top: 40px;
    }

    .footer {
      display: grid; /* This rule creates the column layout */
      grid-template-columns: 2fr 3fr; /* This sets the column proportions */
      gap: 40px;
      align-items: start; /* This aligns both columns to the top */
      font-size: 9pt;
      line-height: 1.4;
    }

    .footer-left {
      text-align: left;
    }

    .footer-right {
      text-align: left;
    }
  </style>
</head>
<body>

  <div class="header">
    <h2>University of the Immaculate Conception</h2>
    <p>Father Selga Street, Davao City 8000, Philippines</p>
    <p>221-8090 local 131</p>
    <p>(63-082) 226-2676</p>
    <p><a href="http://www.uic.edu.ph">www.uic.edu.ph</a></p>
  </div>

  <div class="contact">
    <p><a href="mailto:ccs@uic.edu.ph">ccs@uic.edu.ph</a></p>
    <p>Office of the College of Computer Studies</p>
  </div>

  <div class="content">
    <p>Dear [Recipient],</p>

    <p>
      This is a sample placeholder for the body of the letter. 
      The content of your document will appear here with the same formatting, 
      font, and justification as the PDF.
    </p>

    <p>Sincerely,<br>
    [Your Name]</p>
  </div>

  <div class="footer-container">
    <div class="footer">
      <div class="footer-left">
        <p>
          CHED Full Autonomous Status • PAASCU Accredited, Institutional Accreditation Status • Bureau of Immigration Accredited • Deputized to offer ETEEAP • Science Resource Center, DENR Recognized  
        </p>
      </div>
      <div class="footer-right">
        <p>
          <strong>MEMBER:</strong> Catholic Educational Association of the Philippines (CEAP) • Association of Catholic Universities of the Philippines (ACUP) • ASEAN University Network (AUN-QA, Associate Member) • University Mobility in Asia and the Pacific (UMAP) • Association of Southeast and East Asian Catholic Colleges and Universities (ASEACCU) • Southeast Asian Ministers of Education Organization (SEAMEO) Schools’ Network
        </p>
      </div>
    </div>
  </div>

</body>
</html>