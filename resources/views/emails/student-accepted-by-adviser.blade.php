<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to the Advisery</title>
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

        .welcome-badge {
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

        .next-steps-box {
            background-color: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
        }

        .next-steps-box h3 {
            font-size: 16px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
        }

        .next-steps-box ul {
            margin: 0;
            padding-left: 20px;
        }

        .next-steps-box li {
            margin-bottom: 8px;
            color: #333;
        }

        .notice-box {
            background-color: #FFFBEB;
            border: 1px solid #F59E0B;
            padding: 20px;
            margin: 20px 0;
        }

        .notice-box .title {
            font-weight: bold;
            color: #92400E;
            margin-bottom: 10px;
            font-size: 14px;
        }

        .notice-box .details {
            color: #78350F;
            font-size: 14px;
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

        <h1>Welcome to {{ $adviserFullName }}'s Advisery</h1>

        
            <p class="message">
                <strong>Dear {{ $studentFullName }},</strong>
            </p>
            <p class="message">
                Congratulations! We are pleased to inform you that <strong>{{ $adviserFullName }}</strong> has accepted your advisery assignment and will be guiding you through your academic journey in the Graduate School.
            </p>

            <div style="text-align: center;">
                <span class="welcome-badge"><i class="fas fa-check-circle"></i> Adviser Assignment Confirmed</span>
            </div>

            <p class="message">
                This is an important milestone in your graduate education. Your adviser will be your primary academic mentor, providing guidance on your coursework, research, thesis/dissertation, and overall academic progress.
            </p>

            <div class="info-box">
                <h2>Your Assigned Adviser</h2>
                
                <div class="label"><i class="fas fa-user"></i> Name</div>
                <div class="value">{{ $adviserFullName }}</div>
                
                <div class="label"><i class="fas fa-envelope"></i> Email</div>
                <div class="value">{{ $adviserEmail }}</div>
                
                <div class="label"><i class="fas fa-graduation-cap"></i> Program</div>
                <div class="value">{{ $adviserProgram }}</div>
            </div>

            <div class="next-steps-box">
                <h3><i class="fas fa-list-check"></i> Next Steps</h3>
                <ul>
                    <li><strong>Prepare Questions:</strong> Come prepared with questions about your program, coursework selection, and research opportunities.</li>
                    <li><strong>Stay Connected:</strong> Maintain regular communication with your adviser throughout your academic journey.</li>
                    <li><strong>Use the System:</strong> Access the Graduate School System to track your defense requests, submissions, and academic progress.</li>
                </ul>
            </div>

            <div class="notice-box">
                <div class="title"><i class="fas fa-envelope"></i> Need to Contact Your Adviser?</div>
                <div class="details">
                    You can reach <strong>{{ $adviserFullName }}</strong> at <strong>{{ $adviserEmail }}</strong>. Please allow 24-48 hours for a response. For urgent academic matters, you may also contact the Graduate School Office.
                </div>
            </div>

            <div style="text-align: center;">
                <a href="{{ url('/student/dashboard') }}" class="cta-button">
                    Go to Your Dashboard
                </a>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                <strong>Important Reminders:</strong>
            </p>
            <ul style="color: #6B7280; padding-left: 20px; margin: 10px 0 20px 0; font-size: 14px;">
                <li>Keep track of all important deadlines and requirements</li>
                <li>Attend all scheduled meetings with your adviser</li>
                <li>Follow university policies and academic integrity guidelines</li>
                <li>Utilize available resources at the Graduate School Office</li>
            </ul>

            <p class="message" style="text-align: center; color: #FF4B64; font-weight: 600;">
                Best wishes on your academic journey!<br>
                <span style="color: #6B7280; font-weight: normal; font-size: 14px;">We look forward to your success in the program.</span>
            </p>
        </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb;">
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
