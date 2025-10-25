<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Defense Request</title>
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

        .badge {
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

        .action-required-box {
            background-color: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
        }

        .action-required-box h3 {
            font-size: 16px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
        }

        .action-required-box ul {
            margin: 0;
            padding-left: 20px;
        }

        .action-required-box li {
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

        <h1>New Defense Request Submitted!</h1>

        <div class="content">
            <p class="message">
                <strong>Dear {{ $adviser->first_name }} {{ $adviser->last_name }},</strong>
            </p>
            <p class="message">
                A student has submitted a new <strong>{{ $defenseRequest->defense_type }} Defense</strong> request for your review and approval.
            </p>

            <div style="text-align: center;">
                <span class="badge"><i class="fas fa-file-alt"></i> {{ strtoupper($defenseRequest->defense_type) }}</span>
            </div>

            <div class="info-box">
                <h2>Student Information</h2>
                
                <div class="label">Student Name</div>
                <div class="value">{{ $defenseRequest->first_name }} {{ $defenseRequest->middle_name }} {{ $defenseRequest->last_name }}</div>
                
                <div class="label">Student ID</div>
                <div class="value">{{ $defenseRequest->school_id }}</div>
                
                <div class="label">Program</div>
                <div class="value">{{ $defenseRequest->program }}</div>
                
                <div class="label">Thesis Title</div>
                <div class="value" style="font-style: italic;">{{ $defenseRequest->thesis_title }}</div>
                
                <div class="label">Submitted On</div>
                <div class="value"><i class="fas fa-calendar-alt"></i> {{ $defenseRequest->submitted_at?->format('F j, Y g:i A') ?? now()->format('F j, Y g:i A') }}</div>
            </div>

            <div class="action-required-box">
                <h3><i class="fas fa-tasks"></i> Action Required</h3>
                <ul>
                    <li>Review the submitted documents and requirements</li>
                    <li>Verify the student's eligibility for defense</li>
                    <li>Approve or request revisions as needed</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <a href="{{ url('/defense-request/' . $defenseRequest->id) }}" class="cta-button">
                    </i> Click to Review Defense Request
                </a>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 30px;">
                <em>Please review this request at your earliest convenience. The student is waiting for your approval to proceed.</em>
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
