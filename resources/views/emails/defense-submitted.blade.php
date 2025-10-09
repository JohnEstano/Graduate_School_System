<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Defense Request</title>
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
            background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
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
            color: #7c3aed;
            margin-bottom: 15px;
        }
        .message {
            margin-bottom: 25px;
        }
        .info-box {
            background: #faf5ff;
            border-left: 4px solid #a78bfa;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box .label {
            font-weight: 600;
            color: #7c3aed;
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
        .thesis-title {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 3px solid #7c3aed;
        }
        .thesis-title .label {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .thesis-title .title-text {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            font-style: italic;
        }
        .button {
            display: inline-block;
            background: #7c3aed;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: background 0.3s ease;
        }
        .button:hover {
            background: #6d28d9;
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
        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge-proposal { background: #dbeafe; color: #1e40af; }
        .badge-prefinal { background: #fef3c7; color: #92400e; }
        .badge-final { background: #dcfce7; color: #166534; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 New Defense Request Submitted</h1>
            <p>Graduate School System</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear {{ $adviser->first_name }} {{ $adviser->last_name }},
            </div>
            
            <div class="message">
                <p>A student has submitted a new <strong>{{ $defenseRequest->defense_type }} Defense</strong> request for your review and approval.</p>
            </div>
            
            <div class="info-box">
                <div class="label">Student Information</div>
                <div class="value">
                    <strong>{{ $defenseRequest->first_name }} {{ $defenseRequest->middle_name }} {{ $defenseRequest->last_name }}</strong>
                </div>
                
                <div class="label">Student ID</div>
                <div class="value">{{ $defenseRequest->school_id }}</div>
                
                <div class="label">Program</div>
                <div class="value">{{ $defenseRequest->program }}</div>
                
                <div class="label">Defense Type</div>
                <div class="value">
                    <span class="badge badge-{{ strtolower($defenseRequest->defense_type) }}">
                        {{ $defenseRequest->defense_type }}
                    </span>
                </div>
                
                <div class="label">Submitted On</div>
                <div class="value">{{ $defenseRequest->submitted_at?->format('F j, Y g:i A') ?? now()->format('F j, Y g:i A') }}</div>
            </div>
            
            <div class="thesis-title">
                <div class="label">Thesis Title</div>
                <div class="title-text">{{ $defenseRequest->thesis_title }}</div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ url('/defense-request/' . $defenseRequest->id) }}" class="button">
                    📋 Review Defense Request
                </a>
            </div>
            
            <div class="message" style="margin-top: 30px;">
                <p><strong>Action Required:</strong></p>
                <ul style="color: #475569; margin: 10px 0;">
                    <li>Review the submitted documents and requirements</li>
                    <li>Verify the student's eligibility for defense</li>
                    <li>Approve or request revisions as needed</li>
                </ul>
                <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
                    <em>Please review this request at your earliest convenience. The student is waiting for your approval to proceed.</em>
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
