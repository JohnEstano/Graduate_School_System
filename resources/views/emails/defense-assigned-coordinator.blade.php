<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Request Assigned for Review</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            color: #FEE2E2;
            margin: 10px 0 0 0;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 20px;
        }
        .message {
            color: #6B7280;
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 25px;
        }
        .assignment-badge {
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            font-size: 20px;
            font-weight: 600;
            margin: 25px 0;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .info-box {
            background: #FEF2F2;
            border-left: 4px solid #991B1B;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .info-box .label {
            font-weight: 600;
            color: #991B1B;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .info-box .value {
            color: #1F2937;
            font-size: 16px;
            margin-bottom: 12px;
            font-weight: 500;
        }
        .info-box .value:last-child {
            margin-bottom: 0;
        }
        .action-button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 25px 0;
            text-align: center;
            box-shadow: 0 4px 12px rgba(153, 27, 27, 0.3);
            transition: transform 0.2s;
        }
        .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(153, 27, 27, 0.4);
        }
        .next-steps {
            background: #F0F9FF;
            border: 2px solid #3B82F6;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
        }
        .next-steps h3 {
            color: #1E40AF;
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 600;
        }
        .next-steps ul {
            margin: 0;
            padding-left: 20px;
            color: #374151;
        }
        .next-steps li {
            margin-bottom: 10px;
            line-height: 1.6;
        }
        .next-steps li:last-child {
            margin-bottom: 0;
        }
        .footer {
            background: #F9FAFB;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
        }
        .footer p {
            color: #6B7280;
            font-size: 13px;
            margin: 5px 0;
        }
        .footer .uic-brand {
            color: #991B1B;
            font-weight: 600;
            font-size: 14px;
            margin-top: 10px;
        }
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #E5E7EB, transparent);
            margin: 25px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <img src="{{ asset('grad_logo.png') }}" alt="UIC Graduate School Logo" class="logo">
            <h1>New Defense Request Assigned</h1>
            <p>Action Required - Coordinator Review</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Hello, <strong>{{ $coordinatorName }}</strong>!
            </div>

            <div class="message">
                A new thesis defense request has been assigned to you for review. The request has been approved by the adviser and is now awaiting your evaluation.
            </div>

            <div class="assignment-badge">
                ✓ Assigned for Coordinator Review
            </div>
            
            <div class="divider"></div>

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

            <div class="divider"></div>
            
            <!-- Action Button -->
            <div style="text-align: center;">
                <a href="{{ url('/dashboard') }}" class="action-button">Review Defense Request</a>
            </div>

            <div class="message" style="margin-top: 30px; text-align: center;">
                <p style="font-size: 14px;">
                    <em>This request was automatically assigned to you based on the student's program ({{ $defenseRequest->program }}). If you believe this was assigned in error, please contact the system administrator.</em>
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p class="uic-brand">University of the Immaculate Conception</p>
            <p>Graduate School System</p>
            <p style="margin-top: 15px; font-size: 12px;">
                This is an automated notification from the UIC Graduate School System.<br>
                Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
