<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Scheduled - Adviser Notification</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif,
                'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }

        .email-wrapper {
            width: 100%;
            background-color: #f4f4f4;
            padding: 20px 0;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 30px;
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

        .message { font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333; }

        .info-box { border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0;
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
    
        @media (max-width: 600px) {
            .email-container { padding: 20px !important; }
            h1 { font-size: 24px !important; }
            .message { font-size: 14px !important; }
            .info-box, .notice-box, .schedule-box { padding: 15px !important; }
            .cta-button { display: block !important; width: 100% !important; text-align: center; padding: 12px 20px !important; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px;">
                        <tr>
                            <td style="padding: 30px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td width="50">
                                            <img src="{{ asset('gss-uic-logo-v2.png') }}" alt="UIC Graduate School Logo" style="max-width: 50px; height: auto;">
                                        </td>
                                        <td align="right">
                                            <span style="color: #FF4B64; font-size: 14px; font-weight: bold;">Graduate School System</span>
                                        </td>
                                    </tr>
                                </table>
        {{-- Testing Disclaimer --}}
        @include('emails.partials.testing-disclaimer')

        <h1>Defense Scheduled - Adviser Notification</h1>

        
            <p class="message">
                <strong>Dear Prof. {{ $defenseRequest->defense_adviser }},</strong>
            </p>
            <p class="message">
                This is to inform you that the thesis/dissertation defense for your advisee has been officially approved and scheduled by the Graduate School coordinator.
            </p>

            <div class="schedule-box">
                <div class="date">
                    <i class="fas fa-calendar-alt"></i> {{ $defenseRequest->scheduled_date->format('l, F j, Y') }}
                </div>
                <div class="time">
                    <i class="fa-regular fa-clock"></i>  {{ $defenseRequest->scheduled_time }} - {{ $defenseRequest->scheduled_end_time }}
                </div>
                @if($defenseRequest->defense_mode)
                    <span class="mode-badge">
                        {{ ucfirst($defenseRequest->defense_mode) }}
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
                <div class="value">{{ $defenseRequest->first_name }} {{ $defenseRequest->middle_name }} {{ $defenseRequest->last_name }}</div>

                <div class="label">Defense Title</div>
                <div class="value" style="font-style: italic;">{{ $defenseRequest->thesis_title }}</div>
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
                    <h2>Defense Panel Composition</h2>
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

            <p class="message" style="font-size: 14px; color: #6b7280;">
                As the adviser, your presence and guidance during the defense are greatly appreciated. Please ensure your advisee is well-prepared for this important academic milestone.
            </p>
            <p class="message" style="font-size: 14px; color: #6b7280;">
                If you have any concerns or need to request any changes to the schedule, please contact the Graduate School office as soon as possible.
            </p>
        </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb;">
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
