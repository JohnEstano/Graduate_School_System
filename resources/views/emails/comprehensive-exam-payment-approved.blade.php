<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Exam Payment Approved</title>
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
            margin: 20px 0;
            color: #333;
        }
        
        .message {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 20px;
            color: #333;
        }

        .success-box {
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 20px 0;
        }
        
        .info-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
        }
        
        .label {
            font-weight: bold;
            color: #374151;
            font-size: 14px;
            margin-top: 10px;
        }
        
        .value {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .cta-button {
            display: inline-block;
            background-color: #FF4B64;
            color: #ffffff !important;
            padding: 15px 35px;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
        }
        
        .footer-text {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            line-height: 1.6;
        }
        
        .footer-logo {
            max-width: 60px;
            margin-bottom: 10px;
        }
        
        @media (max-width: 600px) {
            .email-container { padding: 20px !important; }
            h1 { font-size: 24px !important; }
            .message { font-size: 14px !important; }
            .info-box, .success-box { padding: 15px !important; }
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
                                @include('emails.partials.testing-disclaimer')
                                <h1 style="font-size: 32px; font-weight: bold; margin: 20px 0; color: #333;">Payment Approved!</h1>
                                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333;">
                                    <strong>Dear {{ $student->first_name }} {{ $student->last_name }},</strong>
                                </p>
                                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333;">
                                    Great news! Your comprehensive examination fee payment has been verified and approved.
                                </p>
                                <div class="success-box" style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 18px; color: #065f46;"><strong>✓ Payment Verified</strong></p>
                                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #047857;">
                                        Your payment has been successfully verified by the Registrar's office. Your application will now proceed to the next stage of review.
                                    </p>
                                </div>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h2 style="font-size: 18px; font-weight: bold; margin-top: 0; margin-bottom: 15px;">Payment Details</h2>
                                            <div style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Application ID</div>
                                            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">{{ $examApplication->id }}</div>
                                            <div style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Student ID</div>
                                            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">{{ $examApplication->student_id }}</div>
                                            <div style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Verified By</div>
                                            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Registrar's Office</div>
                                            <div style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Verified On</div>
                                            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">{{ now()->format('F j, Y g:i A') }}</div>
                                        </td>
                                    </tr>
                                </table>
                                <div class="info-box" style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
                                    <p style="margin: 0 0 10px 0; font-size: 16px; color: #1e40af;"><strong>Next Steps:</strong></p>
                                    <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                                        <li style="margin-bottom: 8px;">Your application will be forwarded to the Dean for final approval</li>
                                        <li style="margin-bottom: 8px;">You will receive an email notification once the Dean reviews your application</li>
                                        <li style="margin-bottom: 8px;">Continue monitoring your dashboard for updates</li>
                                        <li style="margin-bottom: 8px;">Prepare for your comprehensive examination</li>
                                    </ul>
                                </div>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td align="center" style="padding: 20px 0;">
                                            <a href="{{ url('/comprehensive-exam') }}" style="display: inline-block; background-color: #FF4B64; color: #ffffff; padding: 15px 35px; text-decoration: none; font-weight: bold; font-size: 16px;">View Application Status</a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="font-size: 14px; line-height: 1.8; color: #6b7280; margin-top: 20px;">
                                    If you have any questions about your application or payment, please contact the Registrar's office or the Graduate School Office.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td align="center">
                                            <img src="{{ asset('gss-uic-logo-v2.png') }}" alt="UIC Graduate School Logo" style="max-width: 60px; margin-bottom: 10px;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="font-size: 12px; color: #6b7280; line-height: 1.6;">
                                            <strong>University of the Immaculate Conception</strong><br>
                                            Graduate School Office<br>
                                            Father Selga St., Davao City, Philippines 8000
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="font-size: 12px; color: #6b7280; padding-top: 15px;">
                                            This is an automated message from the Graduate School System. Please do not reply to this email.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
