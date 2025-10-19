<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Submitted</title>
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
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
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
            color: #1e40af;
            margin-bottom: 15px;
        }
        .message {
            margin-bottom: 25px;
        }
        .info-box {
            background: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box .label {
            font-weight: 600;
            color: #64748b;
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
        .button {
            display: inline-block;
            background: #1e40af;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: background 0.3s ease;
        }
        .button:hover {
            background: #1e3a8a;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 New Document Submitted</h1>
            <p>Graduate School System</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear {{ $teacher->first_name }} {{ $teacher->last_name }},
            </div>
            
            <div class="message">
                <p>A student has submitted a new document for your review.</p>
            </div>
            
            <div class="info-box">
                <div class="label">Student Information</div>
                <div class="value">
                    <strong>{{ $student->first_name }} {{ $student->middle_name }} {{ $student->last_name }}</strong>
                </div>
                
                <div class="label">Student ID</div>
                <div class="value">{{ $student->school_id }}</div>
                
                <div class="label">Program</div>
                <div class="value">{{ $student->program ?? 'Not specified' }}</div>
                
                <div class="label">Document Type</div>
                <div class="value">{{ $documentType }}</div>
                
                <div class="label">Submitted On</div>
                <div class="value">{{ now()->format('F j, Y g:i A') }}</div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ $documentUrl }}" class="button">
                    📋 View Document
                </a>
            </div>
            
            <div class="message" style="margin-top: 30px;">
                <p>Please review the document at your earliest convenience.</p>
                <p style="color: #64748b; font-size: 14px;">
                    <em>You can access all pending documents in your dashboard.</em>
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
