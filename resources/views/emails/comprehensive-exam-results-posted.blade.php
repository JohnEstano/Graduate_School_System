<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Exam Results Posted</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif,
                'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }

        .email-wrapper {
            width: 100%;
            background-color: #f4f4f4;
            padding: 20px 0;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 30px;
        }

        .logo {
            max-width: 50px;
            height: auto;
        }

        .header-title {
            color: #FF4B64;
            font-size: 14px;
            font-weight: bold;
        }

        h1 {
            font-size: 32px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 50px;
        }

        .content {
            margin-bottom: 30px;
        }

        .message { font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333; }

        .badge {
            display: inline-block;
            background-color: #FF4B64;
            color: #ffffff;
            padding: 10px 20px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 20px 0;
        }

        .info-box { border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0;
        }

        .info-box h2 {
            font-size: 18px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
        }

        .info-box .label {
            font-weight: bold;
            color: #666;
            margin-top: 12px;
            margin-bottom: 4px;
            font-size: 14px;
        }

        .info-box .value {
            color: #333;
            margin-bottom: 8px;
            font-size: 16px;
        }

        .success-box {
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 20px 0;
        }

        .success-box h2 {
            color: #047857;
            font-size: 18px;
            margin: 0 0 10px 0;
        }

        .success-box p {
            color: #065f46;
            margin: 0;
            font-size: 14px;
        }

        .warning-box {
            background-color: #fef2f2;
            border: 1px solid #ef4444;
            border-left: 4px solid #ef4444;
            padding: 20px;
            margin: 20px 0;
        }

        .warning-box h2 {
            color: #991b1b;
            font-size: 18px;
            margin: 0 0 10px 0;
        }

        .warning-box p {
            color: #7f1d1d;
            margin: 0;
            font-size: 14px;
        }

        .subjects-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
        }

        .subjects-table th {
            background-color: #f9fafb;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
            font-size: 14px;
        }

        .subjects-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }

        .subjects-table tr:last-child td {
            border-bottom: none;
        }

        .score-passed {
            color: #047857;
            font-weight: bold;
        }

        .score-failed {
            color: #991b1b;
            font-weight: bold;
        }

        .average-row {
            background-color: #f9fafb;
            font-weight: bold;
        }

        .average-row td {
            color: #374151;
            border-top: 2px solid #e5e7eb;
        }

        .cta-button {
            display: inline-block;
            background-color: #FF4B64;
            color: #ffffff;
            padding: 15px 35px;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
            margin-top: 20px;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            font-size: 12px;
            color: #6b7280;
        }

        .footer .logo {
            max-width: 60px;
            margin-bottom: 10px;
        }
    
        @media (max-width: 600px) {
            .email-container { padding: 20px !important; }
            h1 { font-size: 24px !important; }
            .message { font-size: 14px !important; }
            .info-box, .notice-box, .schedule-box { padding: 15px !important; }
            .cta-button { display: block !important; width: 100% !important; text-align: center; padding: 12px 20px !important; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px;">
                        <tr>
                            <td style="padding: 30px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td width="50">
                                            <img src="{{ asset('gss-uic-logo-v2.png') }}" alt="UIC Graduate School Logo" style="max-width: 50px; height: auto;">
                                        </td>
                                        <td align="right">
                                            <span style="color: #FF4B64; font-size: 14px; font-weight: bold;">Graduate School System</span>
                                        </td>
                                    </tr>
                                </table>
        {{-- Testing Disclaimer --}}
        @include('emails.partials.testing-disclaimer')

        <h1>Comprehensive Exam Results</h1>

        
            <p class="message">
                <strong>Dear {{ $student->first_name }} {{ $student->last_name }},</strong>
            </p>

            <p class="message">
                Your comprehensive examination results have been posted and are now available for review. 
                Below is a summary of your performance.
            </p>

            <!-- Result Status Box -->
            @if($resultStatus === 'passed')
                <div class="success-box">
                    <h2>Congratulations - You Passed</h2>
                    <p>You have successfully passed the comprehensive examination with an average score of {{ $averageScore }}.</p>
                </div>
            @else
                <div class="warning-box">
                    <h2>Results Notification</h2>
                    <p>Your comprehensive examination results show an average score of {{ $averageScore }}. Unfortunately, this does not meet the passing requirement.</p>
                </div>
            @endif

            <!-- Application Details -->
            <div class="info-box">
                <h2>Application Details</h2>
                
                <div class="label">Application ID</div>
                <div class="value">{{ $examApplication->application_id }}</div>
                
                <div class="label">Student ID</div>
                <div class="value">{{ $examApplication->student_id }}</div>
                
                <div class="label">Program</div>
                <div class="value">{{ $examApplication->program }}</div>
                
                <div class="label">School Year</div>
                <div class="value">{{ $examApplication->school_year }}</div>
            </div>

            <!-- Subject Scores -->
            <div class="info-box">
                <h2>Individual Subject Scores</h2>
            </div>

            <table class="subjects-table" role="presentation">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th style="text-align: center;">Score</th>
                        <th style="text-align: center;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($subjects as $subject)
                        <tr>
                            <td>{{ $subject['subject_name'] }}</td>
                            <td style="text-align: center;" class="{{ $subject['score'] > 74 ? 'score-passed' : 'score-failed' }}">
                                {{ $subject['score'] }}
                            </td>
                            <td style="text-align: center;" class="{{ $subject['score'] > 74 ? 'score-passed' : 'score-failed' }}">
                                {{ $subject['score'] > 74 ? 'Passed' : 'Failed' }}
                            </td>
                        </tr>
                    @endforeach
                    <tr class="average-row">
                        <td>Overall Average</td>
                        <td style="text-align: center;">{{ $averageScore }}</td>
                        <td style="text-align: center;">{{ $resultStatus === 'passed' ? 'Passed' : 'Failed' }}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Next Steps -->
            <div class="info-box">
                <h2>Next Steps</h2>
                @if($resultStatus === 'passed')
                    <p style="margin: 5px 0;">1. Your results will be forwarded to the Registrar's Office for processing</p>
                    <p style="margin: 5px 0;">2. You will receive further instructions regarding completion requirements</p>
                    <p style="margin: 5px 0;">3. Please wait for official communication regarding your next steps</p>
                    <p style="margin: 5px 0;">4. Contact the Graduate School Office if you have any questions</p>
                @else
                    <p style="margin: 5px 0;">1. Review your performance in each subject area</p>
                    <p style="margin: 5px 0;">2. Consult with your adviser regarding retake procedures</p>
                    <p style="margin: 5px 0;">3. Contact the Graduate School Office for guidance on next steps</p>
                    <p style="margin: 5px 0;">4. A passing score of 75 or higher is required (average must be above 74)</p>
                @endif
            </div>

            <div style="text-align: center;">
                <a href="{{ url('/comprehensive-exam') }}" class="cta-button">
                    View Full Details
                </a>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
                <strong>Important:</strong> This is an official notification from the Graduate School System. 
                If you believe there is an error in your results, please contact the Graduate School Office 
                within 5 working days of receiving this notification.
            </p>
        </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                                @include('emails.partials.footer')
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
