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

        .prepare-box {
            background-color: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
        }

        .prepare-box h3 {
            font-size: 16px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
        }

        .prepare-box ul {
            margin: 0;
            padding-left: 20px;
        }

        .prepare-box li {
            margin-bottom: 8px;
            color: #333;
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

        <h1>Your Defense Has Been Scheduled!</h1>

        <div class="content">
            <p class="message">
                <strong>Dear {{ $defenseRequest->first_name }} {{ $defenseRequest->last_name }},</strong>
            </p>
            <p class="message">
                We are pleased to inform you that your thesis/dissertation defense has been officially approved and scheduled. This is an important milestone in your academic journey at the University of the Immaculate Conception Graduate School.
            </p>

            <div class="schedule-box">
                <div class="date">
                    <i class="fas fa-calendar-alt"></i> {{ $defenseRequest->scheduled_date->format('l, F j, Y') }}
                </div>
                <div class="time">
                    <i class="fa-regular fa-clock"></i> {{ $defenseRequest->scheduled_time }} - {{ $defenseRequest->scheduled_end_time }}
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
                
                <div class="label">Defense Title</div>
                <div class="value" style="font-style: italic;">{{ $defenseRequest->thesis_title }}</div>

                <div class="label">Defense Type</div>
                <div class="value">{{ $defenseRequest->defense_type }} Defense</div>

                <div class="label">Adviser</div>
                <div class="value">{{ $defenseRequest->defense_adviser }}</div>
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

            <div class="prepare-box">
                <h3>What to Expect & How to Prepare</h3>
                <ul>
                    <li>Review your thesis/dissertation thoroughly, especially methodology and findings</li>
                    <li>Prepare a brief presentation (typically 15-20 minutes) summarizing your work</li>
                    <li>Anticipate questions from the panel about your research</li>
                    <li>Arrive 15 minutes early to set up and test any equipment</li>
                    <li>@if($defenseRequest->defense_mode === 'Online')Ensure you have a stable internet connection and test your audio/video beforehand@else Dress professionally and bring extra copies of your manuscript @endif</li>
                    <li>Bring required documents (manuscript copies, forms, etc.) as per Graduate School guidelines</li>
                </ul>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                If you have any questions or concerns about your defense, please contact the Graduate School office or your adviser immediately. We wish you the best of luck with your defense presentation!
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
