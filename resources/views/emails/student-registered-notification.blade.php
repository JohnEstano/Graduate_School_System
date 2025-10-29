<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Registration Complete</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif,
                'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }

        .container {
            background-color: #ffffff;
            padding: 30px;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
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

        .message {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 32px;
        }

        .notice-box {
            background-color: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
            display: flex;
            align-items: center;
        }

        .notice-icon {
            font-size: 20px;
            margin-right: 15px;
            color: #FF4B64;
        }

        .info-box {
            border: 1px solid #e5e7eb;
            padding: 20px;
            margin-top: 20px;
            border-radius: 8px;
            background-color: #fafafa;
        }

        .info-box h2 {
            font-size: 18px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 15px;
        }

        .info-box .info-row {
            display: flex;
            margin-bottom: 10px;
        }

        .info-box .info-label {
            font-weight: bold;
            min-width: 120px;
            color: #555;
        }

        .info-box .info-value {
            color: #333;
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
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <img src="{{ asset('gss-uic-logo-v2.png') }}" alt="UIC Graduate School Logo" class="logo">
            <span class="header-title">Graduate School System</span>
        </div>
        
        {{-- Testing Disclaimer --}}
        @include('emails.partials.testing-disclaimer')

        <h1>Student Registration Complete!</h1>

        <div class="content">
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

            <div class="notice-box">
                <span class="notice-icon">⏰</span>
                <p style="margin: 0;">
                    <strong>Action Required:</strong> This student is currently in your "Pending Confirmation" list. 
                    Please review their information and accept or reject the assignment.
                </p>
            </div>

            <div class="button-container">
                <a href="{{ $actionUrl }}" class="cta-button">
                    Review Pending Students
                </a>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                If you have any questions about this assignment or need assistance, please contact 
                the Graduate School office or <strong>{{ $coordinatorName }}</strong>.
            </p>
        </div>
    </div>

    <div class="footer">
        <img src="{{ asset('gss-uic-logo-v2.png') }}" alt="UIC Graduate School Logo" class="logo">
        <p>
            <strong>University of the Immaculate Conception</strong><br>
            Graduate School Office<br>
            Father Selga St., Davao City, Philippines 8000
        </p>
        <p style="margin-top: 15px;">
            This is an automated message from the Graduate School System. Please do not reply to this email.
        </p>
    </div>
</body>
</html>
