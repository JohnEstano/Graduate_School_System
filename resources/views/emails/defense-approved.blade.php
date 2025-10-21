<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Request Approved</title>
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
        .success-badge {
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
        .comment-box {
            background: #F0F9FF;
            border-left: 3px solid #3B82F6;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .comment-box .label {
            font-size: 12px;
            color: #1E40AF;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .comment-box .text {
            color: #374151;
            font-style: italic;
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
            <h1>✅ Defense Request Approved</h1>
            <p>Graduate School System</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Dear <strong>{{ $student->first_name }} {{ $student->last_name }}</strong>,
            </div>
            
            <div class="success-badge">
                🎉 Your {{ $defenseRequest->defense_type }} Defense Request Has Been Approved!
            </div>
            
            <div class="message">
                <p>Great news! Your defense request has been <strong>approved by your {{ $approvedBy }}</strong>.</p>
            </div>
            
            <div class="divider"></div>
            
            <div class="info-box">
                <div class="label">Defense Type</div>
                <div class="value">{{ $defenseRequest->defense_type }} Defense</div>
                
                <div class="label">Thesis Title</div>
                <div class="value" style="font-style: italic;">{{ $defenseRequest->thesis_title }}</div>
                
                <div class="label">Approved By</div>
                <div class="value">{{ ucfirst($approvedBy) }}</div>
                
                <div class="label">Approved On</div>
                <div class="value">{{ now()->format('F j, Y g:i A') }}</div>
            </div>
            
            @if($comment)
            <div class="comment-box">
                <div class="label">{{ ucfirst($approvedBy) }}'s Comments</div>
                <div class="text">{{ $comment }}</div>
            </div>
            @endif
            
            @if($approvedBy === 'adviser')
            <div class="next-steps">
                <h3>📌 Next Steps:</h3>
                <ul>
                    <li>Your request will now be forwarded to the Coordinator for final approval</li>
                    <li>You will receive another notification once the Coordinator reviews your request</li>
                    <li>Continue monitoring your dashboard for updates</li>
                </ul>
            </div>
            @else
            <div class="next-steps">
                <h3>📌 Next Steps:</h3>
                <ul>
                    <li>Wait for panel assignment from the Coordinator</li>
                    <li>You will receive a notification once your defense is scheduled</li>
                    <li>Begin preparing your defense presentation</li>
                    <li>Review all required documents and ensure they are complete</li>
                </ul>
            </div>
            @endif
            
            <div class="divider"></div>
            
            <!-- Action Button -->
            <div style="text-align: center;">
                <a href="{{ url('/defense-request/' . $defenseRequest->id) }}" class="action-button">
                    📋 View Request Details
                </a>
            </div>
            
            <div class="message" style="margin-top: 30px; text-align: center;">
                <p style="font-size: 14px;">
                    <em>You can track the status of your defense request anytime through your dashboard.</em>
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
