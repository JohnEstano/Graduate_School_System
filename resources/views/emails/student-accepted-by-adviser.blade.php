<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to the Advisery</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
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

        .info-box {
            border: 1px solid #e5e7eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ asset('gss-uic-logo-v2.png') }}" alt="UIC Graduate School Logo" class="logo">
            <span class="header-title">Graduate School System</span>
        </div>

        <h1>Welcome to {{ $adviserFullName }}'s Advisery</h1>

        <div class="content">
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
