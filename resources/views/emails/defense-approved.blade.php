<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Request Approved</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #10b981;
            margin-bottom: 15px;
        }
        .message {
            margin-bottom: 25px;
        }
        .success-badge {
            background: #d1fae5;
            border: 2px solid #10b981;
            color: #065f46;
            padding: 15px 20px;
            border-radius: 8px;
            text-align: center;
            font-size: 18px;
            font-weight: 600;
            margin: 20px 0;
        }
        .info-box {
            background: #f0fdf4;
            border-left: 4px solid #34d399;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box .label {
            font-weight: 600;
            color: #10b981;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .info-box .value {
            color: #1e293b;
            font-size: 16px;
            margin-bottom: 15px;
        }
        .info-box .value:last-child {
            margin-bottom: 0;
        }
        .comment-box {
            background: #f8fafc;
            border-left: 3px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .comment-box .label {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .comment-box .text {
            color: #334155;
            font-style: italic;
        }
        .button {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: background 0.3s ease;
        }
        .button:hover {
            background: #059669;
        }
        .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            color: #64748b;
            font-size: 13px;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 5px 0;
        }
        .next-steps {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .next-steps h3 {
            color: #92400e;
            font-size: 14px;
            margin: 0 0 10px 0;
        }
        .next-steps ul {
            margin: 0;
            padding-left: 20px;
            color: #78350f;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Defense Request Approved</h1>
            <p>Graduate School System</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear {{ $student->first_name }} {{ $student->last_name }},
            </div>
            
            <div class="success-badge">
                🎉 Your {{ $defenseRequest->defense_type }} Defense Request Has Been Approved!
            </div>
            
            <div class="message">
                <p>Great news! Your defense request has been <strong>approved by your {{ $approvedBy }}</strong>.</p>
            </div>
            
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
            
            <div style="text-align: center;">
                <a href="{{ url('/defense-request/' . $defenseRequest->id) }}" class="button">
                    📋 View Request Details
                </a>
            </div>
            
            <div class="message" style="margin-top: 30px;">
                <p style="color: #64748b; font-size: 14px;">
                    <em>You can track the status of your defense request anytime through your dashboard.</em>
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Graduate School System</strong></p>
            <p>University of the Immaculate Conception</p>
            <p style="margin-top: 15px;">
                <em>This is an automated notification. Please do not reply to this email.</em>
            </p>
        </div>
    </div>
</body>
</html>
