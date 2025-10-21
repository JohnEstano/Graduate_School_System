<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Panel Invitation</title>
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
        .role-badge {
            display: inline-block;
            background: linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%);
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 10px 0 20px 0;
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
            background-color: #EFF6FF;
            border-left: 4px solid #3B82F6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box h3 {
            color: #1E40AF;
            margin: 0 0 10px 0;
            font-size: 16px;
            font-weight: 600;
        }
        .info-box ul {
            margin: 0;
            padding-left: 20px;
            color: #1E3A8A;
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
            <h1>Panel Invitation</h1>
            <p>Thesis/Dissertation Defense</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Dear Prof. {{ $panelistName }},
            </div>

            <div class="message">
                <p>You are cordially invited to serve on the defense panel for a graduate student at the University of the Immaculate Conception Graduate School. Your expertise and insights would be invaluable to this academic evaluation.</p>
            </div>

            <div style="text-align: center;">
                <span class="role-badge">{{ strtoupper($role) }}</span>
            </div>

            <!-- Defense Details -->
            <div class="defense-details">
                <h2>Defense Details</h2>
                
                <div class="detail-row">
                    <div class="detail-label">Student:</div>
                    <div class="detail-value"><strong>{{ $studentName }}</strong></div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">Defense Title:</div>
                    <div class="detail-value"><strong>{{ $defenseTitle }}</strong></div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">Adviser:</div>
                    <div class="detail-value"><strong>{{ $adviserName }}</strong></div>
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

                <!-- Panel Section -->
                @if(count($otherPanels) > 0)
                <div class="panel-section">
                    <h3>Other Panel Members</h3>
                    @foreach($otherPanels as $panel)
                        <div class="panel-member">
                            <div class="panel-member-name">{{ $panel->name }}</div>
                            <div class="panel-member-role">{{ $panel->role }}</div>
                        </div>
                    @endforeach
                </div>
                @endif
            </div>

            <!-- Role Description -->
            <div class="info-box">
                <h3>📌 Your Role as {{ ucfirst($role) }}</h3>
                <ul>
                    @if($role === 'chair')
                        <li>Preside over the defense proceedings</li>
                        <li>Ensure the defense follows proper academic protocols</li>
                        <li>Facilitate questions and discussions among panel members</li>
                        <li>Lead the panel in deliberations and final evaluation</li>
                    @else
                        <li>Review the student's thesis/dissertation manuscript</li>
                        <li>Prepare questions and comments for the defense</li>
                        <li>Evaluate the quality and rigor of the research</li>
                        <li>Participate in panel deliberations and provide feedback</li>
                    @endif
                    <li>Arrive at least 15 minutes before the scheduled time</li>
                    <li>Submit evaluation forms after the defense</li>
                </ul>
            </div>

            <div class="message">
                <p>Please confirm your availability for this defense at your earliest convenience. If you are unable to attend or have any concerns, kindly inform the Graduate School office immediately.</p>
                <p>Thank you for your service to the academic community and your contribution to maintaining the quality of graduate education at UIC.</p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>University of the Immaculate Conception</strong></p>
            <p>Graduate School</p>
            <hr class="footer-divider">
            <p>This is an automated invitation. Please do not reply to this email.</p>
            <p>For assistance or to confirm attendance, contact the Graduate School office.</p>
        </div>
    </div>
</body>
</html>
