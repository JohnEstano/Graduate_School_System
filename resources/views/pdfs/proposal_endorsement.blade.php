<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Proposal Defense Endorsement Form</title>
    <style>
        body {
            margin: 0;
            font-family: Arial, sans-serif;
            font-size: 11pt;
            color: #000;
            background: #fff;
        }
        .page {
            width: 170mm;
            min-height: 297mm;
            margin: 0 auto;
            position: relative;
            box-sizing: border-box;
            padding: 0;
        }
        .uic-logo {
            position: absolute;
            top: 15mm;
            left: 0;
            width: 28mm;
            height: auto;
        }
        .header {
            text-align: center;
            margin-top: 15mm;
            margin-bottom: 0;
        }
        .school {
            font-size: 12pt;
            margin-bottom: 2px;
        }
        .dept {
            font-size: 11pt;
            margin-bottom: 12px;
        }
        .title {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 0;
            margin-top: 6px;
            letter-spacing: 0.5px;
        }
        .subtitle {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 20px;
            margin-top: 0;
            letter-spacing: 0.5px;
        }
        .info-table {
            width: 100%;
            margin: 0 auto;
            margin-top: 18px;
            margin-bottom: 8px;
            border-collapse: collapse;
        }
        .info-table td {
            font-size: 11pt;
            padding: 0;
            vertical-align: bottom;
        }
        .line {
            border-bottom: 1px solid #000;
            height: 18px;
            width: 100%;
            display: inline-block;
        }
        .label {
            padding-right: 8px;
            font-size: 10pt;
        }
        .section {
            width: 100%;
            margin: 0 auto;
            margin-top: 18px;
            margin-bottom: 0;
            font-size: 11pt;
        }
        .dear {
            font-weight: bold;
        }
        .thankyou {
            margin-top: 10px;
        }
        .signature-block {
            width: 100%;
            margin: 0 auto;
            margin-top: 22px;
        }
        .signature-label {
            margin-bottom: 2px;
            font-size: 10pt;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            width: 120px;
            margin-top: 10px;
            margin-bottom: 2px;
        }
        .signature-caption {
            font-size: 9pt;
        }
        .approved-block {
            width: 100%;
            margin: 0 auto;
            margin-top: 18px;
            text-align: right;
        }
        .approved-label {
            margin-bottom: 8px;
            font-size: 10pt;
        }
        .approved-name {
            font-size: 10pt;
            font-weight: bold;
        }
        .footer-table {
            width: 100%;
            margin: 0 auto;
            border: 1px solid #000;
            border-collapse: collapse;
            margin-top: 18px;
            font-size: 9pt;
        }
        .footer-table td {
            vertical-align: top;
            border: 1px solid #000;
            padding: 4px 6px 4px 6px;
        }
        .footer-table ol {
            margin: 0 0 0 16px;
            padding: 0;
        }
        .footer-table li {
            margin-bottom: 1px;
        }
        .centered-cell {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="page">
        <img src="{{ public_path('uic-logo.png') }}" class="uic-logo">
        <div class="header">
            <div class="school">University of the Immaculate Conception</div>
            <div class="dept">GRADUATE SCHOOL</div>
            <div class="title">PROPOSAL DEFENSE</div>
            <div class="subtitle">ENDORSEMENT FORM</div>
        </div>

        <table class="info-table">
            <tr>
                <td style="width:48%; text-align:left;">
                    <div class="line" style="width:220px;"></div>
                </td>
                <td style="width:4%;"></td>
                <td style="width:36%; text-align:right;">
                    <div class="line" style="width:90px;"></div>
                </td>
            </tr>
            <tr>
                <td class="label" style="text-align:left; position:relative;">
                    <span style="position:absolute; left:0; width:220px; text-align:center; display:inline-block;">Name of Student/ Candidate</span>
                </td>
                <td></td>
                <td class="label" style="text-align:right; top:2; position:relative;">
                    <span style="position:absolute; right:0; width:90px; text-align:center; display:inline-block;">Date</span>
                </td>
            </tr>
            <tr><td colspan="3" style="height: 30px;"></td></tr>
            <tr>
                <td style="width:48%; text-align:left;">
                    <div class="line" style="width:220px;"></div>
                </td>
                <td></td>
                <td></td>
            </tr>
            <tr>
                <td class="label" style="text-align:left; top:2; position:relative;">
                    <span style="position:absolute; left:0; width:220px; text-align:center; display:inline-block;">Program of Study</span>
                </td>
                <td></td>
                <td></td>
            </tr>
            <tr><td colspan="3" style="height: 30px;"></td></tr> <!-- Increased space below Program of Study -->
            <tr>
                <td colspan="3" style="padding-left:9px;">
                    Title of the Thesis / Dissertation:
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding-left:8px;">
                    <div class="line"></div>
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding-left:8px;">
                    <div class="line"></div>
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding-left:8px;">
                    <div class="line"></div>
                </td>
            </tr>
        </table>

        <div class="section">
            Dear <span class="dear">{{ $dean_name ?? 'Dr. Amoguis' }}</span>,
        </div>
        <div class="section" style="margin-top: 6px;">
            I have reviewed and fully endorsed the final manuscript attached for evaluation.
        </div>
        <div class="thankyou section">
            Thank you.
        </div>

        <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Thesis / Dissertation Adviser</div>
            <div class="signature-caption">(Signature over Printed Name)</div>
        </div>

        <div class="approved-block">
            <div class="approved-label">Approved by:</div>
            <div class="approved-name">{{ $dean_name ?? 'Dr. Mary Jane B. Amoguis' }}<br>{{ $dean_title ?? 'Dean, Graduate School' }}</div>
        </div>

        <table class="footer-table">
            <tr>
                <td style="width: 50%;">
                    An applicant for Thesis / Dissertation Proposal Defense should have accomplished the following before s/he is granted approval:
                    <ol>
                        <li>Completed all academic requirements vouched by a Certificate of Completion issued by the Registrar</li>
                        <li>Taken review class with the major subject teachers</li>
                        <li>Passed the Comprehensive Examinations in all required subjects vouched by a Certification from the Graduate School Dean</li>
                        <li>For Doctoral students, must have conducted a Public Forum</li>
                        <li>Enrolled and attended classes in Thesis / Dissertation Writing and assigned to an adviser</li>
                        <li>Written the Thesis / Dissertation proposal following the prescribed UIC format</li>
                    </ol>
                </td>
                <td style="width: 50%;">
                    Procedure for Proposal Defense:
                    <ol>
                        <li>Secures and fills up a proposal defense endorsement form from the Administrative Assistant to be signed by the adviser.</li>
                        <li>Pays the proposal defense fee at the cashier</li>
                        <li>Submits the receipt to the Administrative Assistant and the manuscript, (7) for Doctorate student (5) for Masteral student to the assigned panels and adviser.</li>
                        <li>Endorses the candidate to the Program Coordinator for the schedule.</li>
                        <li>Asks the Program Coordinator on the proposed member of the panel to be approved by the Dean</li>
                        <li>Schedules the proposal oral defense.</li>
                    </ol>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
