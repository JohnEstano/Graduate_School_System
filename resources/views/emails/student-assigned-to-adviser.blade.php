<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Student Assignment</title>
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

        .action-box {
            background-color: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
        }

        .action-box h3 {
            font-size: 16px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
        }

        .action-box p {
            margin: 0 0 10px 0;
            font-size: 16px;
        }

        .action-box ul {
            margin: 10px 0;
            padding-left: 20px;
        }

        .action-box li {
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

        <h1>New Student Assignment!</h1>

        <div class="content">
            <p class="message">
                <strong>Dear Prof. {{ $adviserName }},</strong>
            </p>
            <p class="message">
                The coordinator <strong>{{ $coordinatorName }}</strong> has assigned you to be the adviser of the following student in the University of the Immaculate Conception Graduate School system.
            </p>

            <div class="info-box">
                <h2>Student Information</h2>
                
                <div class="label"><i class="fas fa-user"></i> Student Name</div>
                <div class="value">{{ $studentName }}</div>
                
                <div class="label"><i class="fas fa-envelope"></i> Email</div>
                <div class="value">{{ $studentEmail }}</div>
                
                <div class="label"><i class="fas fa-graduation-cap"></i> Program</div>
                <div class="value">{{ $studentProgram }}</div>
            </div>

            <div class="action-box">
                <h3><i class="fas fa-clipboard-check"></i> Action Required</h3>
                <p>Please log in to the Graduate School System to:</p>
                <ul>
                    <li><strong>Confirm</strong> this student assignment if you accept to be their adviser</li>
                    <li><strong>Review</strong> the student's profile and academic information</li>
                    <li><strong>Contact</strong> the coordinator if you have any concerns or questions about this assignment</li>
                </ul>
                
                <div style="text-align: center;">
                    <a href="{{ config('app.url') }}/adviser/students" class="cta-button">
                        Click to View Student Assignments
                    </a>
                </div>
            </div>

            <div class="notice-box">
                <div class="title"><i class="fas fa-info-circle"></i> Important</div>
                <div class="details">
                    If you are unable to accept this student or have any concerns about this assignment, please contact <strong>{{ $coordinatorName }}</strong> (Coordinator) as soon as possible to discuss alternative arrangements.
                </div>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                Your confirmation helps ensure smooth communication and academic support for our graduate students. We appreciate your dedication to mentoring and guiding our students through their academic journey.
            </p>
            <p class="message" style="font-size: 14px; color: #6b7280;">
                Thank you for your service to the Graduate School.
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
