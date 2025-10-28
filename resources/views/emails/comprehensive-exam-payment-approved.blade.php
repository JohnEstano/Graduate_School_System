<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Exam Payment Approved</title>
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
            margin-bottom: 35px;
            color: #10b981;
        }

        .content {
            margin-bottom: 30px;
        }

        .message {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 20px;
        }

        .success-badge {
            display: inline-block;
            background-color: #d1fae5;
            color: #065f46;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 20px;
        }

        .info-box {
            border: 1px solid #e5e7eb;
            padding: 20px;
            margin-top: 20px;
            border-radius: 8px;
        }

        .info-box h2 {
            font-size: 18px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 15px;
        }

        .info-box .label {
            font-weight: bold;
            color: #374151;
            font-size: 14px;
            margin-top: 10px;
        }

        .info-box .value {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .info-box ul {
            margin: 10px 0;
            padding-left: 20px;
        }

        .info-box ul li {
            margin-bottom: 8px;
            color: #4b5563;
        }

        .highlight-box {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 20px 0;
        }

        .highlight-box p {
            margin: 0;
            color: #065f46;
            font-weight: bold;
        }

        .button-container {
            text-align: center;
            margin: 30px 0;
        }

        .cta-button {
            display: inline-block;
            background-color: #FF4B64;
            color: #ffffff;
            padding: 15px 35px;
            text-decoration: none;
            border-radius: 0px;
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

        <h1><i class="fa-solid fa-circle-check"></i> Payment Approved!</h1>

        <div class="content">
            <span class="success-badge">
                <i class="fa-solid fa-check"></i> READY FOR EXAMINATION
            </span>

            <p class="message">
                <strong>Dear {{ $student->first_name }} {{ $student->last_name }},</strong>
            </p>
            <p class="message">
                Congratulations! Your comprehensive exam payment has been <strong>approved by the Coordinator</strong>. You are now officially cleared to take your comprehensive examination!
            </p>

            <div class="highlight-box">
                <p><i class="fa-solid fa-clipboard-check"></i> All requirements completed! You may now proceed with your comprehensive examination.</p>
            </div>

            <div class="info-box">
                <h2>Payment Details</h2>
                <div class="label">OR Number</div>
                <div class="value">{{ $paymentSubmission->or_number }}</div>

                <div class="label">Amount Paid</div>
                <div class="value">₱{{ number_format($paymentSubmission->amount_paid, 2) }}</div>

                <div class="label">Payment Date</div>
                <div class="value">{{ $paymentSubmission->payment_date->format('F j, Y') }}</div>

                <div class="label">Approved By</div>
                <div class="value">Coordinator{{ $coordinatorName ? ' - ' . $coordinatorName : '' }}</div>

                <div class="label">Approved On</div>
                <div class="value">{{ now()->format('F j, Y g:i A') }}</div>
            </div>

            <div class="info-box">
                <h2>Application Details</h2>
                <div class="label">Student ID</div>
                <div class="value">{{ $examApplication->student_id }}</div>

                <div class="label">Program</div>
                <div class="value">{{ $examApplication->program }}</div>

                <div class="label">School Year</div>
                <div class="value">{{ $examApplication->school_year }}</div>
            </div>

            <div class="info-box">
                <h2>Next Steps</h2>
                <ul>
                    <li><strong>Check your exam schedule</strong> - Review the posted exam schedule for your subjects.</li>
                    <li><strong>Prepare thoroughly</strong> - Review all course materials and study guides.</li>
                    <li><strong>Bring valid ID</strong> - Ensure you have your valid identification on exam day.</li>
                    <li><strong>Arrive early</strong> - Come at least 30 minutes before your scheduled exam time.</li>
                    <li><strong>Follow exam protocols</strong> - Adhere to all examination rules and guidelines.</li>
                </ul>
            </div>

            <div class="button-container">
                <a href="{{ url('/comprehensive-exam') }}" class="cta-button">
                    View Exam Schedule
                </a>
            </div>
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
        <p style="margin-top: 10px;">
            <strong>Good luck on your comprehensive examination!</strong>
        </p>
    </div>
</body>
</html>
