<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Adviser Assignment Update</title>
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
        .status-badge {
            background: linear-gradient(135deg, #F59E0B 0%, #F59E0B 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            font-size: 20px;
            font-weight: 600;
            margin: 25px 0;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }
        .message {
            color: #6B7280;
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 25px;
        }
        .adviser-info-box {
            background: #FEF2F2;
            border-left: 4px solid #991B1B;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .adviser-info-box .label {
            font-weight: 600;
            color: #991B1B;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .adviser-info-box .value {
            color: #1F2937;
            font-size: 16px;
            margin-bottom: 12px;
            font-weight: 500;
        }
        .adviser-info-box .value:last-child {
            margin-bottom: 0;
        }
        .next-steps {
            background: #FEF3C7;
            border: 2px solid #F59E0B;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
        }
        .next-steps h3 {
            color: #92400E;
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
        .coordinator-box {
            background: #FFFBEB;
            border: 1px solid #F59E0B;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .coordinator-box .title {
            color: #92400E;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
        }
        .coordinator-box .title::before {
            content: "📧";
            margin-right: 8px;
            font-size: 18px;
        }
        .coordinator-box .details {
            color: #78350F;
            font-size: 14px;
            line-height: 1.6;
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
        .important-notice {
            background: #FEE2E2;
            border-left: 4px solid #DC2626;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .important-notice .title {
            color: #991B1B;
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 10px;
        }
        .important-notice .content {
            color: #7F1D1D;
            font-size: 14px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <img src="{{ asset('grad_logo.png') }}" alt="UIC Graduate School Logo" class="logo">
            <h1>Adviser Assignment Update</h1>
            <p>Graduate School System</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Dear <strong>{{ $studentFullName }}</strong>,
            </div>

            <div class="status-badge">
                ⚠️ Adviser Assignment Not Accepted
            </div>

            <div class="message">
                <p>We regret to inform you that <strong>{{ $adviserFullName }}</strong> was unable to accept the adviser assignment for your graduate program at this time.</p>
                
                <p>This decision does not reflect on your academic qualifications or potential. Faculty members may decline assignments due to current workload capacity, scheduling conflicts, research focus alignment, or other professional commitments.</p>
            </div>

            <div class="divider"></div>

            <!-- Rejected Adviser Information -->
            <div class="adviser-info-box">
                <div class="label">Assignment Details</div>
                <div class="value">
                    <strong>👤 Adviser:</strong> {{ $adviserFullName }}
                </div>
                <div class="value">
                    <strong>📧 Email:</strong> {{ $adviserEmail }}
                </div>
                <div class="value">
                    <strong>📅 Status:</strong> Assignment Not Accepted
                </div>
            </div>

            <!-- Next Steps -->
            <div class="next-steps">
                <h3>📋 What Happens Next?</h3>
                <ul>
                    <li><strong>Contact Your Coordinator:</strong> Reach out to {{ $coordinatorName }} who will assist you in finding an alternative adviser.</li>
                    <li><strong>Reassignment Process:</strong> Your coordinator will work with you to identify another suitable adviser who can guide your academic work.</li>
                    <li><strong>No Delay in Progress:</strong> The reassignment process will be expedited to ensure minimal impact on your academic timeline.</li>
                    <li><strong>Stay Positive:</strong> Finding the right adviser-student match is important for your success, and we're committed to helping you find the best fit.</li>
                </ul>
            </div>

            <!-- Important Notice -->
            <div class="important-notice">
                <div class="title">
                    Important: Action Required
                </div>
                <div class="content">
                    Please contact your coordinator <strong>{{ $coordinatorName }}</strong> as soon as possible to discuss alternative adviser options. Having an assigned adviser is essential for progressing with your thesis/dissertation work.
                </div>
            </div>

            <!-- Coordinator Contact Box -->
            <div class="coordinator-box">
                <div class="title">
                    Contact Your Coordinator
                </div>
                <div class="details">
                    <strong>Name:</strong> {{ $coordinatorName }}<br>
                    <strong>Email:</strong> {{ $coordinatorEmail }}<br>
                    <strong>Role:</strong> Graduate Program Coordinator<br>
                    <br>
                    Please reach out to your coordinator to discuss reassignment options. They will help you find an adviser who is the best match for your academic interests and research goals.
                </div>
            </div>

            <div class="divider"></div>

            <div class="message">
                <p>If you have any questions or concerns about this process, please don't hesitate to contact the Graduate School Office or your program coordinator.</p>
                
                <p>We appreciate your understanding and are committed to supporting your academic success.</p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p class="uic-brand">University of the Immaculate Conception</p>
            <p>Graduate School</p>
            <p>Father Selga St., Davao City, Philippines 8000</p>
            <p style="margin-top: 15px; color: #9CA3AF;">
                This is an automated message from the UIC Graduate School System.<br>
                Please do not reply directly to this email.
            </p>
        </div>
    </div>
</body>
</html>
