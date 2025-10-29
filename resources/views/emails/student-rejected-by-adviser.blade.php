<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Adviser Assignment Update</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif,
                'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }

        .email-wrapper {
            width: 100%;
            background-color: #f4f4f4;
            padding: 20px 0;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 30px;
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

        .message { font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333; }

        .status-badge {
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

        .important-notice {
            background-color: #FEE2E2;
            border: 1px solid #DC2626;
            padding: 20px;
            margin: 20px 0;
        }

        .important-notice .title {
            font-weight: bold;
            color: #991B1B;
            margin-bottom: 10px;
            font-size: 15px;
        }

        .important-notice .content {
            color: #7F1D1D;
            font-size: 14px;
        }

        .coordinator-box {
            background-color: #FFFBEB;
            border: 1px solid #F59E0B;
            padding: 20px;
            margin: 20px 0;
        }

        .coordinator-box .title {
            font-weight: bold;
            color: #92400E;
            margin-bottom: 10px;
            font-size: 14px;
        }

        .coordinator-box .details {
            color: #78350F;
            font-size: 14px;
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
    
        @media (max-width: 600px) {
            .email-container { padding: 20px !important; }
            h1 { font-size: 24px !important; }
            .message { font-size: 14px !important; }
            .info-box, .notice-box, .schedule-box { padding: 15px !important; }
            .cta-button { display: block !important; width: 100% !important; text-align: center; padding: 12px 20px !important; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px;">
                        <tr>
                            <td style="padding: 30px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td width="50">
                                            <img src="{{ asset('gss-uic-logo-v2.png') }}" alt="UIC Graduate School Logo" style="max-width: 50px; height: auto;">
                                        </td>
                                        <td align="right">
                                            <span style="color: #FF4B64; font-size: 14px; font-weight: bold;">Graduate School System</span>
                                        </td>
                                    </tr>
                                </table>
        {{-- Testing Disclaimer --}}
        @include('emails.partials.testing-disclaimer')

        <h1>Adviser Assignment Update</h1>

        
            <p class="message">
                <strong>Dear {{ $studentFullName }},</strong>
            </p>
            <p class="message">
                We regret to inform you that <strong>{{ $adviserFullName }}</strong> was unable to accept the adviser assignment for your graduate program at this time.
            </p>

            <div style="text-align: center;">
                <span class="status-badge"><i class="fas fa-exclamation-triangle"></i> Assignment Not Accepted</span>
            </div>

            <p class="message">
                This decision does not reflect on your academic qualifications or potential. Faculty members may decline assignments due to current workload capacity, scheduling conflicts, research focus alignment, or other professional commitments.
            </p>

            <div class="info-box">
                <h2>Assignment Details</h2>
                
                <div class="label"><i class="fas fa-user"></i> Adviser</div>
                <div class="value">{{ $adviserFullName }}</div>
                
                <div class="label"><i class="fas fa-envelope"></i> Email</div>
                <div class="value">{{ $adviserEmail }}</div>
                
                <div class="label"><i class="fas fa-info-circle"></i> Status</div>
                <div class="value">Assignment Not Accepted</div>
            </div>

            <div class="next-steps-box">
                <h3><i class="fas fa-list-check"></i> What Happens Next?</h3>
                <ul>
                    <li><strong>Contact Your Coordinator:</strong> Reach out to {{ $coordinatorName }} who will assist you in finding an alternative adviser.</li>
                    <li><strong>Reassignment Process:</strong> Your coordinator will work with you to identify another suitable adviser who can guide your academic work.</li>
                    <li><strong>No Delay in Progress:</strong> The reassignment process will be expedited to ensure minimal impact on your academic timeline.</li>
                    <li><strong>Stay Positive:</strong> Finding the right adviser-student match is important for your success, and we're committed to helping you find the best fit.</li>
                </ul>
            </div>

            <div class="important-notice">
                <div class="title"><i class="fas fa-circle-exclamation"></i> Important: Action Required</div>
                
                    Please contact your coordinator <strong>{{ $coordinatorName }}</strong> as soon as possible to discuss alternative adviser options. Having an assigned adviser is essential for progressing with your thesis/dissertation work.
                </div>
            </div>

            <div class="coordinator-box">
                <div class="title"><i class="fas fa-address-card"></i> Contact Your Coordinator</div>
                <div class="details">
                    <strong>Name:</strong> {{ $coordinatorName }}<br>
                    <strong>Email:</strong> {{ $coordinatorEmail }}<br>
                    <strong>Role:</strong> Graduate Program Coordinator<br>
                    <br>
                    Please reach out to your coordinator to discuss reassignment options. They will help you find an adviser who is the best match for your academic interests and research goals.
                </div>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                If you have any questions or concerns about this process, please don't hesitate to contact the Graduate School Office or your program coordinator.
            </p>
            
            <p class="message" style="font-size: 14px; color: #6b7280;">
                We appreciate your understanding and are committed to supporting your academic success.
            </p>
        </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb;">
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
