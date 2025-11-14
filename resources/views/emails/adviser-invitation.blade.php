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
                                <h1 style="font-size: 32px; font-weight: bold; margin-top: 20px; margin-bottom: 30px; color: #333;">You have been registered as an Adviser!</h1>

                                <!-- Content -->
                                <p class="message" style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333;">
                                    <strong>Dear, {{ $adviserName }}</strong>
                                </p>
                                <p class="message" style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333;">
                                    We hope this message finds you well. You have been registered as an adviser in
                                    the <strong>Graduate School System</strong> by <strong>{{ $coordinatorName }}</strong>.
                                </p>

                                <!-- Get Started Box -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" class="get-started-box" style="border: 1px solid #e5e7eb; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h2 style="font-size: 18px; font-weight: bold; margin-top: 0; margin-bottom: 15px;">To Get Started:</h2>
                                            <ol style="padding-left: 20px; margin: 0;">
                                                <li style="margin-bottom: 10px;">Click the button below to access the login page</li>
                                                <li style="margin-bottom: 10px;">Enter your <strong>my.uic.edu.ph</strong> username and password</li>
                                                <li style="margin-bottom: 10px;">Your account will be automatically activated upon successful login</li>
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
                                                            log in using your <strong>my.uic.edu.ph</strong> credentials.
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

                                <p class="message" style="font-size: 14px; line-height: 1.8; color: #6b7280;">
                                    If you encounter any issues or have questions about the system, please don't hesitate
                                    to contact the Graduate School office or your program coordinator.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
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
