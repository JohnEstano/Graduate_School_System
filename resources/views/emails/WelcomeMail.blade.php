
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to the Graduate School System</title>
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
        }

        .message {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 20px;
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
                    <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0"
                        style="background-color: #ffffff; max-width: 600px;">
                        <tr>
                            <td style="padding: 30px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td width="50">
                                            <img src="{{ asset('gss-uic-logo-v2.png') }}" alt="UIC Graduate School Logo"
                                                class="logo">
                                        </td>
                                        <td align="right">
                                            <span class="header-title">Graduate School System</span>
                                        </td>
                                    </tr>
                                </table>
                                {{-- Testing Disclaimer --}}
                                @include('emails.partials.testing-disclaimer')

                                <h1>Welcome to the Graduate School System!</h1>

                                <p class="message">
                                    <strong>Dear User,</strong>
                                </p>
                                <p class="message">
                                    You've successfully registered your account to the University of the Immaculate
                                    Conception Graduate School System. We are excited to have you on board.
                                </p>
                                <p class="message">
                                    Click the button below to log in and get started.
                                </p>

                                <div style="text-align: center;">
                                    <a href="{{ url('/login') }}" class="cta-button">
                                        <i class="fas fa-sign-in-alt"></i> Go to Login
                                    </a>
                                </div>

                                <p class="message" style="margin-top: 30px;">
                                    If you have any questions, feel free to contact the Graduate School office.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <img src="{{ asset('gss-uic-logo-v2.png') }}" alt="UIC Graduate School Logo"
                                    class="logo">
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