<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graduate School System Invitation</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
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
            margin-bottom: 30px;
            color: #333;
        }

        .message {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 20px;
            color: #333;
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

        .notice-box {
            background-color: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
        }

        .notice-icon {
            font-size: 20px;
            color: #FF4B64;
        }

        .get-started-box {
            border: 1px solid #e5e7eb;
            padding: 20px;
            margin: 20px 0;
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
            max-width: 50px;
            height: auto;
            margin-bottom: 10px;
        }

        /* Mobile responsiveness */
        @media (max-width: 600px) {
            .email-container {
                padding: 20px !important;
            }

            h1 {
                font-size: 24px !important;
            }

            .message {
                font-size: 14px !important;
            }

            .info-box {
                padding: 12px !important;
            }

            .notice-box {
                padding: 15px !important;
            }

            .get-started-box {
                padding: 15px !important;
            }

            .get-started-box h2 {
                font-size: 16px !important;
            }

            .cta-button {
                display: block !important;
                width: 100% !important;
                text-align: center;
                padding: 12px 20px !important;
            }
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
                                <!-- Header -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td width="50">
                                            <img src="{{ asset('gss-uic-logo-v2.png') }}" alt="UIC Graduate School Logo" class="logo" style="max-width: 50px; height: auto;">
                                        </td>
                                        <td align="right">
                                            <span class="header-title" style="color: #FF4B64; font-size: 14px; font-weight: bold;">Graduate School System</span>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Testing Disclaimer -->
                                @include('emails.partials.testing-disclaimer')

                                <!-- Main Heading -->
                                <h1 style="font-size: 32px; font-weight: bold; margin-top: 20px; margin-bottom: 30px; color: #333;">Please Login to the Graduate School System</h1>

                                <!-- Content -->
                                <p class="message" style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333;">
                                    <strong>Dear Student,</strong>
                                </p>
                                <p class="message" style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333;">
                                    You are being invited to access the <strong>Graduate School System</strong>. A coordinator has initiated an adviser assignment for you, which is pending adviser acceptance.
                                </p>

                                <!-- Info Box -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" class="info-box" style="background-color: #eff6ff; border-left: 4px solid #3b82f6; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 15px; font-size: 16px; line-height: 1.8;">
                                            <strong style="color: #1e40af;">Invited by:</strong> {{ $coordinatorName }}<br>
                                            <strong style="color: #1e40af;">Status:</strong> Pending adviser acceptance
                                        </td>
                                    </tr>
                                </table>

                                <!-- Get Started Box -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" class="get-started-box" style="border: 1px solid #e5e7eb; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h2 style="font-size: 18px; font-weight: bold; margin-top: 0; margin-bottom: 15px;">To Get Started:</h2>
                                            <ol style="padding-left: 20px; margin: 0;">
                                                <li style="margin-bottom: 10px;">Click the button below to access the login page</li>
                                                <li style="margin-bottom: 10px;">Enter your <strong>my.uic.edu.ph</strong> username and password</li>
                                                <li style="margin-bottom: 10px;">Your account will be automatically activated upon successful login</li>
                                                <li style="margin-bottom: 10px;">You'll be notified once your adviser accepts the assignment</li>
                                                <li style="margin-bottom: 10px;">After acceptance, you can start submitting requirements</li>
                                            </ol>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Notice Box -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" class="notice-box" style="background-color: #f3f4f6; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <table cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td valign="top" style="padding-right: 15px;">
                                                        <span class="notice-icon" style="font-size: 20px; color: #FF4B64;">❗</span>
                                                    </td>
                                                    <td>
                                                        <p style="margin: 0; font-size: 16px; line-height: 1.8;">
                                                            <strong>Important Notice:</strong> To activate your account and access the system, please
                                                            log in using your <strong>my.uic.edu.ph</strong> credentials. Your adviser assignment is currently pending and will be confirmed by your assigned adviser.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Button -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td align="center" style="padding: 20px 0;">
                                            <a href="{{ config('app.url') }}/login" class="cta-button" style="display: inline-block; background-color: #FF4B64; color: #ffffff; padding: 15px 35px; text-decoration: none; font-weight: bold; font-size: 16px;">
                                                Log In to Graduate School System
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <p class="message" style="font-size: 14px; line-height: 1.8; color: #6b7280; margin-bottom: 10px;">
                                    Once your adviser accepts the assignment and you log in, you'll have access to:
                                </p>
                                <ul style="font-size: 14px; color: #6b7280; line-height: 1.8; padding-left: 20px; margin: 0 0 20px 0;">
                                    <li>View your assigned adviser's information</li>
                                    <li>Submit comprehensive exam applications</li>
                                    <li>Request defense schedules</li>
                                    <li>Track your academic progress</li>
                                </ul>

                                <p class="message" style="font-size: 14px; line-height: 1.8; color: #6b7280;">
                                    <strong>Note:</strong> Your adviser assignment is currently <strong>pending</strong>. You will receive a notification once your adviser accepts the assignment. In the meantime, please log in to activate your account.
                                </p>

                                <p class="message" style="font-size: 14px; line-height: 1.8; color: #6b7280;">
                                    If you encounter any issues or have questions about the system, please don't hesitate
                                    to contact the Graduate School office or your program coordinator.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td class="footer">
                                <img src="{{ asset('gss-uic-logo-v2.png') }}" alt="UIC Graduate School Logo" class="logo">
                                <p class="footer-text">
                                    <strong>University of the Immaculate Conception</strong><br>
                                    Graduate School Office<br>
                                    Father Selga St., Davao City, Philippines 8000
                                </p>
                                <p class="footer-text" style="margin-top: 15px;">
                                    This is an automated message from the Graduate School System. Please do not
                                    reply to this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
