<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Registration Complete</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
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

        @media only screen and (max-width: 600px) {
            .email-container {
                padding: 20px;
            }
        }

        .header {
            width: 100%;
            margin-bottom: 20px;
        }

        .header table {
            width: 100%;
        }

        .logo {
            max-width: 50px;
            height: auto;
        }

        .header-title {
            color: #FF4B64;
            font-size: 14px;
            font-weight: bold;
            text-align: right;
        }

        h1 {
            font-size: 32px;
            font-weight: bold;
            margin: 0 0 30px 0;
            color: #1f2937;
        }

        @media only screen and (max-width: 600px) {
            h1 {
                font-size: 24px;
            }
        }

        .message {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 24px;
            color: #4b5563;
        }

        .info-box {
            border: 1px solid #e5e7eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            background-color: #fafafa;
        }

        @media only screen and (max-width: 600px) {
            .info-box {
                padding: 15px;
            }
        }

        .info-box h2 {
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 15px 0;
            color: #1f2937;
        }

        .info-row {
            margin-bottom: 10px;
        }

        .info-label {
            font-weight: bold;
            color: #6b7280;
            display: inline-block;
            min-width: 120px;
        }

        @media only screen and (max-width: 600px) {
            .info-label {
                display: block;
                min-width: auto;
                margin-bottom: 4px;
            }
        }

        .info-value {
            color: #1f2937;
        }

        .notice-box {
            background-color: #f3f4f6;
            padding: 16px;
            margin: 20px 0;
            border-radius: 6px;
        }

        .notice-icon {
            font-size: 20px;
            color: #FF4B64;
            margin-right: 12px;
        }

        .button-container {
            text-align: center;
            margin: 30px 0;
        }

        .cta-button {
            display: inline-block;
            background-color: #FF4B64;
            color: #ffffff !important;
            padding: 15px 35px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
        }

        @media only screen and (max-width: 600px) {
            .cta-button {
                display: block;
                padding: 12px 20px;
            }
        }

        .footer {
            text-align: center;
            padding: 20px 30px;
            border-top: 1px solid #e5e7eb;
        }

        .footer-text {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
        }

        .footer .logo {
            max-width: 60px;
            margin-bottom: 10px;
        }
    </style>
</head>

<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="header">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td width="60">
                            <img src="{{ asset('gss-uic-logo-v2.png') }}" alt="UIC Graduate School Logo" class="logo">
                        </td>
                        <td class="header-title">
                            Graduate School System
                        </td>
                    </tr>
                </table>
            </div>
            
            @include('emails.partials.testing-disclaimer')

            <h1>Student Registration Complete!</h1>

            <p class="message">
                <strong>Dear {{ $adviserName }},</strong>
            </p>
            <p class="message">
                Great news! A student that was pre-assigned to you by <strong>{{ $coordinatorName }}</strong> 
                has now successfully registered and logged into the Graduate School System.
            </p>

            <div class="info-box">
                <h2>Student Information:</h2>
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span class="info-value">{{ $studentName }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">{{ $studentEmail }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Student Number:</span>
                    <span class="info-value">{{ $studentNumber }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Program:</span>
                    <span class="info-value">{{ $studentProgram }}</span>
                </div>
            </div>

            <table width="100%" border="0" cellpadding="0" cellspacing="0" class="notice-box">
                <tr>
                    <td valign="top" width="32" style="padding-right: 12px;">
                        <span class="notice-icon">⏰</span>
                    </td>
                    <td valign="top">
                        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
                            <strong>Action Required:</strong> This student is currently in your "Pending Confirmation" list. 
                            Please review their information and accept or reject the assignment.
                        </p>
                    </td>
                </tr>
            </table>

            <div class="button-container">
                <a href="{{ $actionUrl }}" class="cta-button">
                    Review Pending Students
                </a>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                If you have any questions about this assignment or need assistance, please contact 
                the Graduate School office or <strong>{{ $coordinatorName }}</strong>.
            </p>

            <div class="footer">
                <img src="{{ asset('gss-uic-logo-v2.png') }}" alt="UIC Graduate School Logo" class="logo">
                <p class="footer-text">
                    <strong>University of the Immaculate Conception</strong><br>
                    Graduate School Office<br>
                    Father Selga St., Davao City, Philippines 8000
                </p>
                <p class="footer-text" style="margin-top: 15px;">
                    This is an automated message from the Graduate School System. Please do not reply to this email.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
