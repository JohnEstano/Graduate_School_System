<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Request Requires Revision</title>
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
            background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
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
            color: #f59e0b;
            margin-bottom: 15px;
        }
        .message {
            margin-bottom: 25px;
        }
        .warning-badge {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            color: #92400e;
            padding: 15px 20px;
            border-radius: 8px;
            text-align: center;
            font-size: 18px;
            font-weight: 600;
            margin: 20px 0;
        }
        .info-box {
            background: #fffbeb;
            border-left: 4px solid #fbbf24;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box .label {
            font-weight: 600;
            color: #f59e0b;
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
            background: #fef2f2;
            border-left: 3px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .comment-box .label {
            font-size: 12px;
            color: #991b1b;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .comment-box .text {
            color: #7f1d1d;
            font-weight: 500;
        }
        .button {
            display: inline-block;
            background: #f59e0b;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: background 0.3s ease;
        }
        .button:hover {
            background: #d97706;
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
            background: #f0f9ff;
            border: 1px solid #38bdf8;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .next-steps h3 {
            color: #075985;
            font-size: 14px;
            margin: 0 0 10px 0;
        }
        .next-steps ul {
            margin: 0;
            padding-left: 20px;
            color: #0c4a6e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Defense Request Requires Revision</h1>
            <p>Graduate School System</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear {{ $student->first_name }} {{ $student->last_name }},
            </div>
            
            <div class="warning-badge">
                ⚠️ Your Defense Request Needs Revision
            </div>
            
            <div class="message">
                <p>Your {{ $defenseRequest->defense_type }} Defense request has been reviewed by your <strong>{{ $rejectedBy }}</strong> and requires some revisions before it can be approved.</p>
                <p><strong>Don't worry!</strong> This is a normal part of the process. Please review the feedback below and make the necessary adjustments.</p>
            </div>
            
            <div class="info-box">
                <div class="label">Defense Type</div>
                <div class="value">{{ $defenseRequest->defense_type }} Defense</div>
                
                <div class="label">Thesis Title</div>
                <div class="value" style="font-style: italic;">{{ $defenseRequest->thesis_title }}</div>
                
                <div class="label">Reviewed By</div>
                <div class="value">{{ ucfirst($rejectedBy) }}</div>
                
                <div class="label">Reviewed On</div>
                <div class="value">{{ now()->format('F j, Y g:i A') }}</div>
            </div>
            
            @if($comment)
            <div class="comment-box">
                <div class="label">⚠️ Feedback from {{ ucfirst($rejectedBy) }}</div>
                <div class="text">{{ $comment }}</div>
            </div>
            @endif
            
            <div class="next-steps">
                <h3>📌 What to Do Next:</h3>
                <ul>
                    <li>Carefully review the feedback provided above</li>
                    <li>Make the necessary corrections to your documents</li>
                    <li>Update your requirements as needed</li>
                    <li>Resubmit your defense request once ready</li>
                    <li>Contact your {{ $rejectedBy }} if you need clarification</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ url('/defense-request/' . $defenseRequest->id) }}" class="button">
                    📋 View Request & Resubmit
                </a>
            </div>
            
            <div class="message" style="margin-top: 30px;">
                <p style="color: #64748b; font-size: 14px;">
                    <em>If you have questions about the feedback, please reach out to your {{ $rejectedBy }} for clarification. They are here to help you succeed!</em>
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
