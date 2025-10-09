<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Scheduled</title>
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
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
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
            color: #3b82f6;
            margin-bottom: 15px;
        }
        .message {
            margin-bottom: 25px;
        }
        .success-badge {
            background: #dbeafe;
            border: 2px solid #3b82f6;
            color: #1e40af;
            padding: 15px 20px;
            border-radius: 8px;
            text-align: center;
            font-size: 18px;
            font-weight: 600;
            margin: 20px 0;
        }
        .schedule-box {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 2px solid #3b82f6;
            padding: 25px;
            margin: 20px 0;
            border-radius: 8px;
            text-align: center;
        }
        .schedule-box .date {
            font-size: 28px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .schedule-box .time {
            font-size: 20px;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        .schedule-box .venue {
            font-size: 16px;
            color: #475569;
            margin-top: 15px;
        }
        .info-box {
            background: #f8fafc;
            border-left: 4px solid #60a5fa;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box .label {
            font-weight: 600;
            color: #3b82f6;
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
        .panelists-box {
            background: #fefce8;
            border: 1px solid #fde047;
            padding: 15px;
            margin: 20px 0;
            border-radius: 6px;
        }
        .panelists-box h3 {
            color: #854d0e;
            font-size: 14px;
            margin: 0 0 10px 0;
        }
        .panelists-box ul {
            margin: 0;
            padding-left: 20px;
            color: #713f12;
        }
        .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: background 0.3s ease;
        }
        .button:hover {
            background: #2563eb;
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
        .checklist {
            background: #f0fdf4;
            border: 1px solid #86efac;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .checklist h3 {
            color: #166534;
            font-size: 14px;
            margin: 0 0 10px 0;
        }
        .checklist ul {
            margin: 0;
            padding-left: 20px;
            color: #14532d;
        }
        .mode-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 600;
            margin-top: 10px;
        }
        .mode-online { background: #dbeafe; color: #1e40af; }
        .mode-hybrid { background: #fef3c7; color: #92400e; }
        .mode-face-to-face { background: #dcfce7; color: #166534; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Your Defense Has Been Scheduled!</h1>
            <p>Graduate School System</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear {{ $student->first_name }} {{ $student->last_name }},
            </div>
            
            <div class="success-badge">
                🎉 Your {{ $defenseRequest->defense_type }} Defense is Now Scheduled!
            </div>
            
            <div class="message">
                <p>Great news! Your defense schedule has been finalized. Please review the details below and mark your calendar.</p>
            </div>
            
            <div class="schedule-box">
                <div class="date">
                    📆 {{ $defenseRequest->scheduled_date?->format('l, F j, Y') ?? 'To be announced' }}
                </div>
                <div class="time">
                    🕐 {{ $defenseRequest->scheduled_time ?? 'To be announced' }}
                    @if($defenseRequest->scheduled_end_time)
                        - {{ $defenseRequest->scheduled_end_time }}
                    @endif
                </div>
                @if($defenseRequest->defense_mode)
                <div class="venue">
                    <span class="mode-badge mode-{{ strtolower(str_replace(' ', '-', $defenseRequest->defense_mode)) }}">
                        {{ $defenseRequest->defense_mode }}
                    </span>
                </div>
                @endif
                @if($defenseRequest->defense_venue)
                <div class="venue">
                    <strong>📍 Venue:</strong> {{ $defenseRequest->defense_venue }}
                </div>
                @endif
            </div>
            
            <div class="info-box">
                <div class="label">Defense Type</div>
                <div class="value">{{ $defenseRequest->defense_type }} Defense</div>
                
                <div class="label">Thesis Title</div>
                <div class="value" style="font-style: italic;">{{ $defenseRequest->thesis_title }}</div>
                
                @if($defenseRequest->defense_adviser)
                <div class="label">Adviser</div>
                <div class="value">{{ $defenseRequest->defense_adviser }}</div>
                @endif
            </div>
            
            @php
                $panelists = collect([
                    $defenseRequest->defense_chairperson,
                    $defenseRequest->defense_panelist1,
                    $defenseRequest->defense_panelist2,
                    $defenseRequest->defense_panelist3,
                    $defenseRequest->defense_panelist4,
                ])->filter()->values();
            @endphp
            
            @if($panelists->count() > 0)
            <div class="panelists-box">
                <h3>👥 Defense Panel Members:</h3>
                <ul>
                    @if($defenseRequest->defense_chairperson)
                    <li><strong>Chairperson:</strong> {{ $defenseRequest->defense_chairperson }}</li>
                    @endif
                    @foreach([$defenseRequest->defense_panelist1, $defenseRequest->defense_panelist2, $defenseRequest->defense_panelist3, $defenseRequest->defense_panelist4] as $panelist)
                        @if($panelist)
                        <li>{{ $panelist }}</li>
                        @endif
                    @endforeach
                </ul>
            </div>
            @endif
            
            <div class="checklist">
                <h3>✅ Pre-Defense Checklist:</h3>
                <ul>
                    <li>Prepare your defense presentation (PPT/PDF)</li>
                    <li>Print required copies of your manuscript</li>
                    <li>Review all panel feedback and revisions</li>
                    <li>Practice your presentation (20-30 minutes)</li>
                    <li>Arrive 15 minutes early @if($defenseRequest->defense_mode === 'Online') / Join meeting link on time @endif</li>
                    <li>Dress appropriately (business attire)</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ url('/defense-request/' . $defenseRequest->id) }}" class="button">
                    📋 View Full Defense Details
                </a>
            </div>
            
            <div class="message" style="margin-top: 30px; padding: 15px; background: #fef2f2; border-radius: 6px;">
                <p style="color: #991b1b; margin: 0; font-weight: 600;">
                    ⚠️ <strong>Important:</strong> If you need to reschedule or have any concerns, please contact the Graduate School office immediately.
                </p>
            </div>
            
            <div class="message" style="margin-top: 20px;">
                <p style="color: #64748b; font-size: 14px;">
                    <em>Good luck with your defense! We wish you all the best.</em>
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
