<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Request Assigned for Review</title>
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

        .assignment-badge {
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

        <h1>New Defense Request Assigned!</h1>

        <div class="content">
            <p class="message">
                <strong>Hello, {{ $coordinatorName }}!</strong>
            </p>
            <p class="message">
                A new thesis defense request has been assigned to you for review. The request has been approved by the adviser and is now awaiting your evaluation.
            </p>

            <div style="text-align: center;">
                <span class="assignment-badge"><i class="fas fa-clipboard-check"></i> Assigned for Coordinator Review</span>
            </div>

            <div class="info-box">
                <h2>Defense Request Details</h2>
                
                <div class="label">Student Name</div>
                <div class="value">{{ $studentName }}</div>
                
                <div class="label">School ID</div>
                <div class="value">{{ $defenseRequest->school_id }}</div>

                <div class="label">Program</div>
                <div class="value">{{ $defenseRequest->program }}</div>

                <div class="label">Thesis Title</div>
                <div class="value" style="font-style: italic;">{{ $defenseRequest->thesis_title }}</div>

                <div class="label">Adviser</div>
                <div class="value">{{ $adviserName }}</div>

                <div class="label">Defense Type</div>
                <div class="value">{{ $defenseRequest->defense_type }}</div>

                <div class="label">Submitted On</div>
                <div class="value"><i class="fas fa-calendar-alt"></i> {{ $defenseRequest->created_at->format('F d, Y \a\t g:i A') }}</div>
            </div>

            <div class="next-steps-box">
                <h3><i class="fas fa-list-check"></i> Next Steps</h3>
                <ul>
                    <li>Review the defense request details carefully</li>
                    <li>Verify that all required information is complete</li>
                    <li>Approve the request to proceed with panel assignment</li>
                    <li>Reject if any issues need to be addressed</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <a href="{{ url('/dashboard') }}" class="cta-button"> Click to Review Defense Request</a>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
                <em>This request was automatically assigned to you based on the student's program ({{ $defenseRequest->program }}). If you believe this was assigned in error, please contact the system administrator.</em>
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
