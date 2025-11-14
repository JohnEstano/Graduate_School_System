<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Exam Application Requires Revision</title>
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
            font-size: 34px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 20px;
        }

        .content {
            margin-bottom: 30px;
        }

        .message { font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333; }

        .info-box { border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0;
        }

        .info-box h2 {
            font-size: 18px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 15px;
        }

        .info-box .label {
            font-weight: bold;
            color: #374151;
            font-size: 14px;
            margin-top: 10px;
        }

        .info-box .value {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .info-box ul {
            margin: 10px 0;
            padding-left: 20px;
        }

        .info-box ul li {
            margin-bottom: 8px;
            color: #4b5563;
        }

        .notice-box {
            background-color: #fef2f2;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #FF4B64;
        }

        .button-container {
            text-align: center;
            margin: 30px 0;
        }

        .cta-button {
            display: inline-block;
            background-color: #FF4B64;
            color: #ffffff;
            padding: 15px 35px;
            text-decoration: none;
            border-radius: 0px;
            font-weight: bold;
            font-size: 16px;
        }

        .footer {
            text-align: center;
            padding: 20px 30px;
            border-top: 1px solid #e5e7eb;
        }

        .footer .logo {
            max-width: 60px;
            margin-bottom: 10px;
        }
        
        .footer-text {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.6;
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

        <h1>Application Requires Revision!</h1>

        
            <p class="message">
                <strong>Dear {{ $student->first_name }} {{ $student->last_name }},</strong>
            </p>
            <p class="message">
                Your comprehensive exam application has been reviewed by the <strong>{{ $rejectedBy }}</strong> and requires some revisions before it can be approved.
            </p>
            <p class="message">
                <strong>Don't worry!</strong> This is a normal part of the process. Please review the feedback below and make the necessary adjustments.
            </p>

            <div class="info-box">
                <h2>Application Details</h2>
                
                <div class="label">Student ID</div>
                <div class="value">{{ $examApplication->student_id }}</div>

                <div class="label">Program</div>
                <div class="value">{{ $examApplication->program }}</div>

                <div class="label">School Year</div>
                <div class="value">{{ $examApplication->school_year }}</div>

                <div class="label">Reviewed By</div>
                <div class="value">{{ ucfirst($rejectedBy) }}{{ $rejectorName ? ' - ' . $rejectorName : '' }}</div>

                <div class="label">Reviewed On</div>
                <div class="value">{{ now()->format('F j, Y g:i A') }}</div>
            </div>

            @if ($rejectionReason)
                <div class="notice-box">
                    <p><strong><i class="fa-solid fa-circle-info"></i> {{ ucfirst($rejectedBy) }}'s Feedback:</strong></p>
                    <p style="margin: 10px 0 0 0; font-style: italic; color: #991b1b;">{{ $rejectionReason }}</p>
                </div>
            @endif

            <div class="info-box">
                <h2>What You Need to Do</h2>
                <ul>
                    <li>Carefully review the feedback provided above.</li>
                    <li>Address all concerns mentioned by the {{ $rejectedBy }}.</li>
                    <li>Ensure all required documents are complete and accurate.</li>
                    <li>Verify that you meet all eligibility requirements.</li>
                    <li>Contact the Graduate School Office if you need clarification.</li>
                    <li>Submit a new application once all issues are resolved.</li>
                </ul>
            </div>

            <div class="button-container">
                <a href="{{ url('/comprehensive-exam') }}" class="cta-button">
                    View Application Status
                </a>
            </div>
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
    </div>
</body>
</html>
