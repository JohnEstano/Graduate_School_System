<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Student Assignment</title>
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
            margin-bottom: 30px;
            font-size: 16px;
        }
        .student-details {
            background-color: #FEF2F2;
            border-left: 4px solid #991B1B;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
        }
        .student-details h2 {
            color: #991B1B;
            margin: 0 0 15px 0;
            font-size: 20px;
            font-weight: 600;
        }
        .detail-row {
            display: flex;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid #FEE2E2;
        }
        .detail-row:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #991B1B;
            min-width: 140px;
            font-size: 14px;
        }
        .detail-value {
            color: #374151;
            font-size: 14px;
        }
        .action-box {
            background-color: #EFF6FF;
            border-left: 4px solid #3B82F6;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
        }
        .action-box h3 {
            color: #1E40AF;
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 600;
        }
        .action-box p {
            color: #1E3A8A;
            margin: 0 0 10px 0;
            font-size: 15px;
        }
        .action-box ul {
            margin: 10px 0;
            padding-left: 20px;
            color: #1E3A8A;
        }
        .action-box li {
            margin-bottom: 8px;
        }
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%);
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 15px;
            font-size: 16px;
            text-align: center;
        }
        .action-button:hover {
            background: linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%);
        }
        .contact-box {
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .contact-box p {
            color: #78350F;
            margin: 0;
            font-size: 14px;
        }
        .contact-box strong {
            color: #92400E;
        }
        .footer {
            background-color: #F9FAFB;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
        }
        .footer p {
            color: #6B7280;
            margin: 5px 0;
            font-size: 14px;
        }
        .footer-divider {
            border: none;
            border-top: 1px solid #E5E7EB;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="#ffffff" opacity="0.2"/>
                    <path d="M30 40 L30 70 L40 70 L40 40 Z M50 40 L50 70 L70 70 L70 60 L60 60 L60 55 L70 55 L70 45 L60 45 L60 40 Z" fill="#ffffff"/>
                </svg>
            </div>
            <h1>New Student Assignment</h1>
            <p>Graduate School System</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Dear Prof. {{ $adviserName }},
            </div>

            <div class="message">
                <p>The coordinator <strong>{{ $coordinatorName }}</strong> has assigned you to be the adviser of the following student in the University of the Immaculate Conception Graduate School system.</p>
            </div>

            <!-- Student Details -->
            <div class="student-details">
                <h2>Student Information</h2>
                
                <div class="detail-row">
                    <div class="detail-label">Student Name:</div>
                    <div class="detail-value"><strong>{{ $studentName }}</strong></div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">{{ $studentEmail }}</div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">Program:</div>
                    <div class="detail-value">{{ $studentProgram }}</div>
                </div>
            </div>

            <!-- Action Required -->
            <div class="action-box">
                <h3>📋 Action Required</h3>
                <p>Please log in to the Graduate School System to:</p>
                <ul>
                    <li><strong>Confirm</strong> this student assignment if you accept to be their adviser</li>
                    <li><strong>Review</strong> the student's profile and academic information</li>
                    <li><strong>Contact</strong> the coordinator if you have any concerns or questions about this assignment</li>
                </ul>
                
                <div style="text-align: center;">
                    <a href="{{ config('app.url') }}/adviser/students" class="action-button">
                        View Student Assignments
                    </a>
                </div>
            </div>

            <!-- Contact Information -->
            <div class="contact-box">
                <p><strong>Important:</strong> If you are unable to accept this student or have any concerns about this assignment, please contact <strong>{{ $coordinatorName }}</strong> (Coordinator) as soon as possible to discuss alternative arrangements.</p>
            </div>

            <div class="message">
                <p>Your confirmation helps ensure smooth communication and academic support for our graduate students. We appreciate your dedication to mentoring and guiding our students through their academic journey.</p>
                <p>Thank you for your service to the Graduate School.</p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>University of the Immaculate Conception</strong></p>
            <p>Graduate School</p>
            <hr class="footer-divider">
            <p>This is an automated notification. Please log in to the system to take action.</p>
            <p>For assistance, contact the Graduate School office or your coordinator.</p>
        </div>
    </div>
</body>
</html>
