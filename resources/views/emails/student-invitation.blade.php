<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graduate School System Invitation</title>
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

        .get-started-box {
            border: 1px solid #e5e7eb;
            padding: 20px;
            margin-top: 20px;
            border-radius: 8px;
        }

        .get-started-box h2 {
            font-size: 18px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 15px;
        }

        .get-started-box ol {
            padding-left: 20px;
            margin: 0;
        }

        .get-started-box li {
            margin-bottom: 10px;
        }

        .info-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
        }

        .info-box strong {
            color: #1e40af;
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

        <h1>Please Login to the Graduate School System</h1>

        <div class="content">
            <p class="message">
                <strong>Dear Student,</strong>
            </p>
            <p class="message">
                You are being invited to access the <strong>Graduate School System</strong>. A coordinator has initiated an adviser assignment for you, which is pending adviser acceptance.
            </p>

            <div class="info-box">
                <strong>Invited by:</strong> {{ $coordinatorName }}<br>
                <strong>Status:</strong> Pending adviser acceptance
            </div>

            <div class="get-started-box">
                <h2>To Get Started:</h2>
                <ol>
                    <li>Click the button below to access the login page</li>
                    <li>Enter your <strong>my.uic.edu.ph</strong> username and password</li>
                    <li>Your account will be automatically activated upon successful login</li>
                    <li>You'll be notified once your adviser accepts the assignment</li>
                    <li>After acceptance, you can start submitting requirements</li>
                </ol>
            </div>

            <div class="notice-box">
                <span class="notice-icon">❗</span>
                <p style="margin: 0;">
                    <strong>Important Notice:</strong> To activate your account and access the system, please
                    log in using your <strong>my.uic.edu.ph</strong> credentials. Your adviser assignment is currently pending and will be confirmed by your assigned adviser.
                </p>
            </div>

            <div class="button-container">
                <a href="{{ config('app.url') }}/login" class="cta-button">
                    Log In to Graduate School System
                </a>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                Once your adviser accepts the assignment and you log in, you'll have access to:
            </p>
            <ul style="font-size: 14px; color: #6b7280; line-height: 1.8;">
                <li>View your assigned adviser's information</li>
                <li>Submit comprehensive exam applications</li>
                <li>Request defense schedules</li>
                <li>Track your academic progress</li>
            </ul>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                <strong>Note:</strong> Your adviser assignment is currently <strong>pending</strong>. You will receive a notification once your adviser accepts the assignment. In the meantime, please log in to activate your account.
            </p>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                If you encounter any issues or have questions about the system, please don't hesitate
                to contact the Graduate School office or your program coordinator.
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
            This is an automated message from the Graduate School System. Please do not
            reply to this email.
        </p>
    </div>
</body>
</html>
