<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Scheduled</title>
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
            font-size: 32px;
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

        .schedule-box {
            background-color: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0px;
            text-align: center;
        }

        .schedule-box .date {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .schedule-box .time {
            font-size: 18px;
            color: #374151;
            margin-bottom: 10px;
        }

        .schedule-box .venue {
            font-size: 14px;
            color: #6b7280;
            margin-top: 10px;
        }

        .notice-box {
            background-color: #fef3c7;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
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

        .mode-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 600;
            margin-top: 10px;
            background-color: #e5e7eb;
            color: #374151;
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

        @if($changes)
            <h1>Defense Schedule Updated!</h1>
        @else
            <h1>Defense Has Been Scheduled!</h1>
        @endif

        <div class="content">
            <p class="message">
                <strong>Dear {{ $recipient->first_name }} {{ $recipient->last_name }},</strong>
            </p>

            @if($changes)
                <div class="notice-box">
                    <p style="margin: 0;">
                        <strong>⚠️ Important Update:</strong> Your defense details have been modified. Please review the updated information below.
                    </p>
                    @if($changes['schedule'])
                        <p style="margin: 10px 0 0 0;">• Schedule changed: New date, time, or venue</p>
                    @endif
                    @if($changes['panels'])
                        <p style="margin: 5px 0 0 0;">• Panel updated: Defense panel members have been changed or added</p>
                    @endif
                </div>
            @else
                <p class="message">
                    This is to inform you that your {{ $defenseRequest->defense_type }} defense schedule has been finalized. Please review the details below and mark your calendar.
                </p>
            @endif

            <div class="schedule-box">
                <div class="date">
                    <i class="fa-regular fa-calendar-days"></i> {{ $defenseRequest->scheduled_date?->format('l, F j, Y') ?? 'To be announced' }}
                </div>
                <div class="time">
                    <i class="fa-regular fa-clock"></i> {{ $defenseRequest->scheduled_time ?? 'To be announced' }}
                    @if($defenseRequest->scheduled_end_time)
                        - {{ $defenseRequest->scheduled_end_time }}
                    @endif
                </div>
                @if($defenseRequest->defense_mode)
                    <span class="mode-badge">
                        {{ $defenseRequest->defense_mode }}
                    </span>
                @endif
                @if($defenseRequest->defense_venue)
                    <div class="venue">
                        <strong><i class="fas fa-map-marker-alt"></i> Venue:</strong> {{ $defenseRequest->defense_venue }}
                    </div>
                @endif
            </div>

            <div class="info-box">
                <h2>Defense Details</h2>
                
                <div class="label">Student</div>
                <div class="value">{{ $defenseRequest->first_name }} {{ $defenseRequest->last_name }} ({{ $defenseRequest->school_id }})</div>

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
                <div class="info-box">
                    <h2>Defense Panel Members</h2>
                    @if($defenseRequest->defense_chairperson)
                        <div class="label">Chairperson</div>
                        <div class="value">{{ $defenseRequest->defense_chairperson }}</div>
                    @endif
                    @foreach([$defenseRequest->defense_panelist1, $defenseRequest->defense_panelist2, $defenseRequest->defense_panelist3, $defenseRequest->defense_panelist4] as $index => $panelist)
                        @if($panelist)
                            <div class="label">Panelist {{ $index + 1 }}</div>
                            <div class="value">{{ $panelist }}</div>
                        @endif
                    @endforeach
                </div>
            @endif

            <div class="info-box">
                <h2>Pre-Defense Checklist</h2>
                <ul>
                    <li>Prepare your defense presentation (PPT/PDF)</li>
                    <li>Print required copies of your manuscript</li>
                    <li>Review all panel feedback and revisions</li>
                    <li>Practice your presentation (20-30 minutes)</li>
                    <li>Arrive 15 minutes early @if($defenseRequest->defense_mode === 'Online') / Join meeting link on time @endif</li>
                    <li>Dress appropriately (business attire)</li>
                </ul>
            </div>

            <div class="button-container">
                <a href="{{ url('/defense-request/' . $defenseRequest->id) }}" class="cta-button">
                    View Full Defense Details
                </a>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                If you need to reschedule or have any concerns, please contact the Graduate School office immediately.
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
