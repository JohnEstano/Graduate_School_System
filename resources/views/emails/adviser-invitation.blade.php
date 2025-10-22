<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graduate School System Invitation</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 80px;
            height: auto;
            margin-bottom: 10px;
        }
        h1 {
            color: #dc2626;
            font-size: 24px;
            margin: 10px 0;
        }
        .subtitle {
            color: #666;
            font-size: 14px;
        }
        .content {
            margin-bottom: 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 15px;
        }
        .message {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 20px;
        }
        .highlight-box {
            background-color: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 20px 0;
        }
        .credentials {
            font-weight: bold;
            color: #dc2626;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .cta-button {
            display: inline-block;
            background-color: #dc2626;
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
        }
        .cta-button:hover {
            background-color: #b91c1c;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 14px;
            color: #666;
        }
        .instructions {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .instructions li {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ asset('grad_logo.png') }}" alt="Graduate School Logo" class="logo">
            <h1>Graduate School System</h1>
            <p class="subtitle">University of the Immaculate Conception</p>
        </div>

        <div class="content">
            <p class="greeting">Dear {{ $adviserName }},</p>

            <p class="message">
                We hope this message finds you well. You have been registered as an adviser in the 
                <strong>Graduate School System</strong> by <strong>{{ $coordinatorName }}</strong>.
            </p>

            <div class="highlight-box">
                <p style="margin: 0;">
                    <strong>📢 Important Notice:</strong> To activate your account and access the system, 
                    please log in using your <span class="credentials">my.uic.edu.ph</span> credentials.
                </p>
            </div>

            <p class="message">
                The Graduate School System is designed to streamline thesis defense management, 
                student advising, and academic coordination. Once you log in, you will be able to:
            </p>

            <div class="instructions">
                <ul>
                    <li> View and manage your advisees</li>
                    <li> Review defense requirement submissions</li>
                    <li> Track student progress and milestones</li>
                    <li> Communicate with coordinators and students</li>
                    <li> Access important documents and schedules</li>
                </ul>
            </div>

            <p class="message">
                <strong>To get started:</strong>
            </p>

            <div class="instructions">
                <ol>
                    <li>Click the button below to access the login page</li>
                    <li>Enter your <strong>my.uic.edu.ph</strong> username and password</li>
                    <li>Your account will be automatically activated upon successful login</li>
                </ol>
            </div>

            <div class="button-container">
                <a href="{{ config('app.url') }}https://grad.diapana.dev/login" class="cta-button">
                    Log In to Graduate School System
                </a>
            </div>

            <p class="message" style="font-size: 14px; color: #666;">
                If you encounter any issues or have questions about the system, please don't hesitate 
                to contact the Graduate School office or your program coordinator.
            </p>
        </div>

        <div class="footer">
            <p>
                <strong>University of the Immaculate Conception</strong><br>
                Graduate School Office<br>
                Father Selga St., Davao City, Philippines 8000
            </p>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
                This is an automated message from the Graduate School System. 
                Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
