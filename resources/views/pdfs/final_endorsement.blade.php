<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Final Defense Endorsement Form</title>
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
            <div class="title">FINAL DEFENSE</div>
            <div class="subtitle">ENDORSEMENT FORM</div>
        </div>

        <table class="info-table">
            <tr><td colspan="3" style="height:30px;"></td></tr>
            <tr>
                <!-- Name: line left, label centered below -->
                <td style="width:52%; vertical-align:bottom;">
                    <div class="line" style="width:95%; margin-left:8px; text-align:left;">
                        <span style="position:relative; width:100%; display:inline-block; text-align:left; font-weight:bold;">
                            {{ $student_name ?? '_________________________' }}
                        </span>
                    </div>
                    <div class="label" style="text-align:center; margin-top:2px;">Name of Student/ Candidate</div>
                </td>
                <td style="width:4%;"></td>
                <!-- Date: line right, label centered below -->
                <td style="width:34%; vertical-align:bottom;">
                    <div class="line" style="width:95%; margin-right:8px; text-align:center;">
                        <span style="position:relative; width:100%; display:inline-block; text-align:center; font-weight:bold;">
                            {{ $defense_date ?? now()->format('F d, Y') }}
                        </span>
                    </div>
                    <div class="label" style="text-align:center; margin-top:2px;">Date</div>
                </td>
            </tr>
            <tr>
                <!-- Program of Study: line left, label centered below, input wider -->
                <td style="width:52%; vertical-align:bottom;">
                    <div class="line" style="width:95%; margin-left:8px; text-align:left;">
                        <span style="position:relative; width:100%; display:inline-block; text-align:left; font-weight:bold;">
                            {{ $program ?? '_________________________' }}
                        </span>
                    </div>
                    <div class="label" style="text-align:center; margin-top:2px;">Program of Study</div>
                </td>
                <td></td>
                <td></td>
            </tr>
            <tr><td colspan="3" style="height: 18px;"></td></tr>
            <!-- Thesis Title section -->
            <tr>
                <td colspan="3" style="text-align:left; padding-left:9px;">
                    <div class="label">Title of the Thesis / Dissertation:</div>
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding-left:8px;">
                    <div class="line" style="width:100%; position:relative; text-align:left;">
                        <span style="position:relative; width:100%; text-align:left; display:inline-block; padding-left:4px;">
                            {{ Str::limit($thesis_title ?? '', 100, '') }}
                        </span>
                    </div>
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding-left:8px;">
                    <div class="line" style="width:100%; position:relative; text-align:left;">
                        <span style="position:relative; width:100%; text-align:left; display:inline-block; padding-left:4px;">
                            @if(strlen($thesis_title ?? '') > 100)
                                {{ Str::limit(Str::substr($thesis_title ?? '', 100), 100, '') }}
                            @endif
                        </span>
                    </div>
                </td>
            </tr>
            <tr>
                <td colspan="3" style="padding-left:8px;">
                    <div class="line" style="width:100%; position:relative; text-align:left;">
                        <span style="position:relative; width:100%; text-align:left; display:inline-block; padding-left:4px;">
                            @if(strlen($thesis_title ?? '') > 200)
                                {{ Str::substr($thesis_title ?? '', 200) }}
                            @endif
                        </span>
                    </div>
                </td>
            </tr>
        </table>

        <div class="section">
            Dear <span class="dear">{{ $approver_name ?? 'Dr. Mary Jane B. Amoguis' }}</span>,
        </div>
        <div class="section" style="margin-top: 6px;">
            I have reviewed and fully endorsed the final manuscript attached for evaluation. The student has satisfactorily completed all prior defense stages and has incorporated all necessary revisions and recommendations. The manuscript is now ready for final evaluation.
        </div>
        <div class="thankyou section">
            Thank you.
        </div>

        <div class="signature-block">
            <div style="position: relative; display: inline-block;">
                <div class="signature-label" style="margin-bottom: 6px;">{{ $adviser_name ?? 'Thesis / Dissertation Adviser' }}</div>
                @if(!empty($adviser_signature_path))
                    <img src="{{ $adviser_signature_path }}" alt="Adviser Signature" style="position: absolute; top: -30px; left: 0; max-height:60px; z-index: 10;">
                @endif
                <div class="signature-line"></div>
            </div>
            <div class="signature-caption" style="margin-top: 4px;">(Signature over Printed Name)</div>
        </div>

        <div class="approved-block">
            <div class="approved-label">Approved by:</div>
            @if(!empty($coordinator_signature_path) && !empty($coordinator_name))
                <!-- Show coordinator signature if available -->
                <div class="approved-name" style="margin-bottom: 4px;">{{ $coordinator_name }}<br>{{ $coordinator_title ?? 'Program Coordinator' }}</div>
                <div style="margin-bottom: 8px;">
                    <img src="{{ $coordinator_signature_path }}" alt="Coordinator Signature" style="max-height:50px; margin-bottom:2px;">
                </div>
            @else
                <!-- Show dynamic approver -->
                <div class="approved-name" style="margin-bottom: 4px;">{{ $approver_name ?? '' }}<br>{{ $approver_title ?? '' }}</div>
            @endif
        </div>

        <table class="footer-table">
            <tr>
                <td style="width: 50%;">
                    An applicant for Thesis / Dissertation Final Defense should have accomplished the following before s/he is granted approval:
                    <ol>
                        <li>Successfully defended the thesis/dissertation proposal and pre-final defense</li>
                        <li>Incorporated all revisions and recommendations from the pre-final defense panel</li>
                        <li>Completed all research activities including data gathering, analysis, and interpretation</li>
                        <li>Written the complete manuscript following the prescribed UIC format</li>
                        <li>Received final endorsement from the thesis/dissertation adviser</li>
                        <li>Submitted bound copies of the complete manuscript to all panel members</li>
                    </ol>
                </td>
                <td style="width: 50%;">
                    Procedure for Final Defense:
                    <ol>
                        <li>Secures and fills up a final defense endorsement form from the Administrative Assistant to be signed by the adviser.</li>
                        <li>Pays the final defense fee at the cashier</li>
                        <li>Submits the receipt to the Administrative Assistant and the manuscript, (7) for Doctorate student (5) for Masteral student to the assigned panels and adviser.</li>
                        <li>Endorses the candidate to the Program Coordinator for the schedule.</li>
                        <li>Confirms the panel composition with the Program Coordinator and Dean</li>
                        <li>Schedules the final oral defense.</li>
                    </ol>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
