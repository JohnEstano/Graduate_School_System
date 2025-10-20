<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Scheduled</title>
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
        .defense-details {
            background-color: #FEF2F2;
            border-left: 4px solid #991B1B;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
        }
        .defense-details h2 {
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
        .panel-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #FEE2E2;
        }
        .panel-section h3 {
            color: #991B1B;
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: 600;
        }
        .panel-member {
            background-color: #ffffff;
            padding: 10px 15px;
            margin-bottom: 8px;
            border-radius: 4px;
            border: 1px solid #FEE2E2;
        }
        .panel-member-name {
            font-weight: 600;
            color: #374151;
            font-size: 14px;
        }
        .panel-member-role {
            color: #991B1B;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-box {
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box h3 {
            color: #92400E;
            margin: 0 0 10px 0;
            font-size: 16px;
            font-weight: 600;
        }
        .info-box ul {
            margin: 0;
            padding-left: 20px;
            color: #78350F;
        }
        .info-box li {
            margin-bottom: 5px;
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
            <h1>Congratulations!</h1>
            <p>Your Defense Has Been Scheduled</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Dear {{ $studentName }},
            </div>

            <div class="message">
                <p>We are pleased to inform you that your thesis/dissertation defense has been officially approved and scheduled. This is an important milestone in your academic journey at the University of the Immaculate Conception Graduate School.</p>
            </div>

            <!-- Defense Details -->
            <div class="defense-details">
                <h2>Defense Schedule & Details</h2>
                
                <div class="detail-row">
                    <div class="detail-label">Defense Title:</div>
                    <div class="detail-value"><strong>{{ $defenseTitle }}</strong></div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">Date:</div>
                    <div class="detail-value"><strong>{{ \Carbon\Carbon::parse($defenseDate)->format('F j, Y (l)') }}</strong></div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">Time:</div>
                    <div class="detail-value"><strong>{{ \Carbon\Carbon::parse($defenseTime)->format('g:i A') }} - {{ \Carbon\Carbon::parse($defenseEndTime)->format('g:i A') }}</strong></div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">Mode:</div>
                    <div class="detail-value"><strong>{{ ucfirst($defenseMode) }}</strong></div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">Venue:</div>
                    <div class="detail-value"><strong>{{ $defenseVenue }}</strong></div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">Adviser:</div>
                    <div class="detail-value"><strong>{{ $adviserName }}</strong></div>
                </div>

                <!-- Panel Section -->
                <div class="panel-section">
                    <h3>Defense Panel</h3>
                    @foreach($panels as $panel)
                        <div class="panel-member">
                            <div class="panel-member-name">{{ $panel->name }}</div>
                            <div class="panel-member-role">{{ $panel->role }}</div>
                        </div>
                    @endforeach
                </div>
            </div>

            <!-- Preparation Tips -->
            <div class="info-box">
                <h3>📋 What to Expect & How to Prepare</h3>
                <ul>
                    <li>Review your thesis/dissertation thoroughly, especially methodology and findings</li>
                    <li>Prepare a brief presentation (typically 15-20 minutes) summarizing your work</li>
                    <li>Anticipate questions from the panel about your research</li>
                    <li>Arrive 15 minutes early to set up and test any equipment</li>
                    <li>@if($defenseMode === 'online')Ensure you have a stable internet connection and test your audio/video beforehand@else Dress professionally and bring extra copies of your manuscript @endif</li>
                    <li>Bring required documents (manuscript copies, forms, etc.) as per Graduate School guidelines</li>
                </ul>
            </div>

            <div class="message">
                <p>If you have any questions or concerns about your defense, please contact the Graduate School office or your adviser immediately.</p>
                <p>We wish you the best of luck with your defense presentation!</p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>University of the Immaculate Conception</strong></p>
            <p>Graduate School</p>
            <hr class="footer-divider">
            <p>This is an automated notification. Please do not reply to this email.</p>
            <p>For assistance, contact the Graduate School office.</p>
        </div>
    </div>
</body>
</html>
