<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to the Advisery</title>
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
        .welcome-badge {
            background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            font-size: 20px;
            font-weight: 600;
            margin: 25px 0;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
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
        .contact-box {
            background: #FFFBEB;
            border: 1px solid #F59E0B;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .contact-box .title {
            color: #92400E;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
        }
        .contact-box .title::before {
            content: "📧";
            margin-right: 8px;
            font-size: 18px;
        }
        .contact-box .details {
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
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <img src="{{ asset('grad_logo.png') }}" alt="UIC Graduate School Logo" class="logo">
            <h1>🎓 Welcome to Your Academic Journey!</h1>
            <p>Graduate School System</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Dear <strong>{{ $studentFullName }}</strong>,
            </div>

            <div class="welcome-badge">
                ✅ Your Adviser Assignment Has Been Confirmed!
            </div>

            <div class="message">
                <p>Congratulations! We are pleased to inform you that <strong>{{ $adviserFullName }}</strong> has accepted your advisery assignment and will be guiding you through your academic journey in the Graduate School.</p>
                
                <p>This is an important milestone in your graduate education. Your adviser will be your primary academic mentor, providing guidance on your coursework, research, thesis/dissertation, and overall academic progress.</p>
            </div>

            <div class="divider"></div>

            <!-- Adviser Information -->
            <div class="adviser-info-box">
                <div class="label">Your Assigned Adviser</div>
                <div class="value">
                    <strong>👤 Name:</strong> {{ $adviserFullName }}
                </div>
                <div class="value">
                    <strong>📧 Email:</strong> {{ $adviserEmail }}
                </div>
                <div class="value">
                    <strong>🎓 Program:</strong> {{ $adviserProgram }}
                </div>
            </div>

            <!-- Next Steps -->
            <div class="next-steps">
                <h3>📋 Next Steps</h3>
                <ul>
                    <li><strong>Introduce Yourself:</strong> Send a professional email to your adviser introducing yourself and expressing your enthusiasm to work together.</li>
                    <li><strong>Schedule a Meeting:</strong> Request an initial meeting to discuss your academic goals, research interests, and program requirements.</li>
                    <li><strong>Prepare Questions:</strong> Come prepared with questions about your program, coursework selection, and research opportunities.</li>
                    <li><strong>Stay Connected:</strong> Maintain regular communication with your adviser throughout your academic journey.</li>
                    <li><strong>Use the System:</strong> Access the Graduate School System to track your defense requests, submissions, and academic progress.</li>
                </ul>
            </div>

            <!-- Contact Box -->
            <div class="contact-box">
                <div class="title">
                    Need to Contact Your Adviser?
                </div>
                <div class="details">
                    You can reach <strong>{{ $adviserFullName }}</strong> at <strong>{{ $adviserEmail }}</strong>. Please allow 24-48 hours for a response. For urgent academic matters, you may also contact the Graduate School Office.
                </div>
            </div>

            <div class="divider"></div>

            <!-- Action Button -->
            <div style="text-align: center;">
                <a href="{{ url('/student/dashboard') }}" class="action-button">
                    Go to Your Dashboard
                </a>
            </div>

            <div class="message" style="margin-top: 30px;">
                <p><strong>Important Reminders:</strong></p>
                <ul style="color: #6B7280; padding-left: 20px; margin: 10px 0;">
                    <li>Keep track of all important deadlines and requirements</li>
                    <li>Attend all scheduled meetings with your adviser</li>
                    <li>Follow university policies and academic integrity guidelines</li>
                    <li>Utilize available resources at the Graduate School Office</li>
                </ul>
            </div>

            <div class="divider"></div>

            <div class="message" style="text-align: center; color: #059669; font-weight: 600;">
                Best wishes on your academic journey!<br>
                <span style="color: #6B7280; font-weight: normal; font-size: 14px;">We look forward to your success in the program.</span>
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
