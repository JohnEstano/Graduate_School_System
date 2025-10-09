<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Request Assigned for Review</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #3b82f6;
            margin-bottom: 15px;
        }
        .message {
            margin-bottom: 25px;
            color: #475569;
            line-height: 1.7;
        }
        .assignment-badge {
            background: #dbeafe;
            border: 2px solid #3b82f6;
            color: #1e40af;
            padding: 15px 20px;
            border-radius: 8px;
            text-align: center;
            font-size: 18px;
            font-weight: 600;
            margin: 20px 0;
        }
        .info-box {
            background: #f0f9ff;
            border-left: 4px solid #60a5fa;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box .label {
            font-weight: 600;
            color: #3b82f6;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .info-box .value {
            color: #1e293b;
            font-size: 16px;
            margin-bottom: 15px;
        }
        .info-box .value:last-child {
            margin-bottom: 0;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
        }
        .button:hover {
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
        }
        .next-steps {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .next-steps h3 {
            color: #1e293b;
            font-size: 16px;
            margin: 0 0 15px 0;
        }
        .next-steps ul {
            margin: 0;
            padding-left: 20px;
            color: #475569;
        }
        .next-steps li {
            margin-bottom: 8px;
        }
        .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
        }
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Defense Request Assigned</h1>
            <p>Action Required - Coordinator Review</p>
        </div>

        <div class="content">
            <div class="greeting">Hello, {{ $coordinatorName }}!</div>

            <div class="message">
                A new thesis defense request has been assigned to you for review. The request has been approved by the adviser and is now awaiting your evaluation.
            </div>

            <div class="assignment-badge">
                ✓ Assigned for Coordinator Review
            </div>

            <div class="info-box">
                <div class="label">Student Information</div>
                <div class="value"><strong>{{ $studentName }}</strong></div>
                
                <div class="label">School ID</div>
                <div class="value">{{ $defenseRequest->school_id }}</div>

                <div class="label">Program</div>
                <div class="value">{{ $defenseRequest->program }}</div>

                <div class="label">Thesis Title</div>
                <div class="value">{{ $defenseRequest->thesis_title }}</div>

                <div class="label">Adviser</div>
                <div class="value">{{ $adviserName }}</div>

                <div class="label">Defense Type</div>
                <div class="value">{{ $defenseRequest->defense_type }}</div>

                <div class="label">Submitted On</div>
                <div class="value">{{ $defenseRequest->created_at->format('F d, Y \a\t g:i A') }}</div>
            </div>

            <div class="next-steps">
                <h3>Next Steps:</h3>
                <ul>
                    <li>Review the defense request details carefully</li>
                    <li>Verify that all required information is complete</li>
                    <li>Approve the request to proceed with panel assignment</li>
                    <li>Reject if any issues need to be addressed</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <a href="{{ url('/dashboard') }}" class="button">Review Defense Request</a>
            </div>

            <div class="message" style="margin-top: 30px; font-size: 14px; color: #64748b;">
                This request was automatically assigned to you based on the student's program ({{ $defenseRequest->program }}). If you believe this was assigned in error, please contact the system administrator.
            </div>
        </div>

        <div class="footer">
            <p>
                <strong>Graduate School Management System</strong><br>
                University of the Immaculate Conception<br>
                <a href="{{ url('/') }}">{{ url('/') }}</a>
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #94a3b8;">
                This is an automated notification. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
