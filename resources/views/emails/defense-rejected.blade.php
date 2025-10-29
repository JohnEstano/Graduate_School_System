<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Request Requires Revision</title>
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
            font-size: 34px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 20px;
        }

        .content {
            margin-bottom: 30px;
        }

        .message {
            font-size: 16px;
            line-height: 1.8;
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

        .notice-box {
            background-color: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #FF4B64;
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
        {{-- Testing Disclaimer --}}
        @include('emails.partials.testing-disclaimer')

        <h1>Defense Request Requires Revision!</h1>

        <div class="content">
            <p class="message">
                <strong>Dear {{ $student->first_name }} {{ $student->last_name }},</strong>
            </p>
            <p class="message">
                Your {{ $defenseRequest->defense_type }} Defense request has been reviewed by your <strong>{{ $rejectedBy }}</strong> and requires some revisions before it can be approved.
            </p>
            <p class="message">
                <strong>Don't worry!</strong> This is a normal part of the process. Please review the feedback below and make the necessary adjustments.
            </p>

            <div class="info-box">
                <h2>Request Details</h2>
                
                <div class="label">Defense Type</div>
                <div class="value">{{ $defenseRequest->defense_type }} Defense</div>

                <div class="label">Thesis Title</div>
                <div class="value" style="font-style: italic;">{{ $defenseRequest->thesis_title }}</div>

                <div class="label">Reviewed By</div>
                <div class="value">{{ ucfirst($rejectedBy) }}</div>

                <div class="label">Reviewed On</div>
                <div class="value">{{ now()->format('F j, Y g:i A') }}</div>
            </div>

            @if($rejectionReason)
                <div class="notice-box">
                    <p style="margin: 0;">
                        <i class="fas fa-solid fa-comment"> </i> <strong>Feedback from {{ ucfirst($rejectedBy) }}:</strong>
                    </p>
                    <p style="margin: 10px 0 0 0; font-style: italic;">{{ $rejectionReason }}</p>
                </div>
            @endif

            <div class="info-box">
                <h2>What to Do Next</h2>
                <ul>
                    <li>Carefully review the feedback provided above</li>
                    <li>Make the necessary corrections to your documents</li>
                    <li>Update your requirements as needed</li>
                    <li>Resubmit your defense request once ready</li>
                    <li>Contact your {{ $rejectedBy }} if you need clarification</li>
                </ul>
            </div>

            <div class="button-container">
                <a href="{{ url('/defense-request/' . $defenseRequest->id) }}" class="cta-button">
                    View Request & Resubmit
                </a>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                If you have questions about the feedback, please reach out to your {{ $rejectedBy }} for clarification. They are here to help you succeed!
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
