<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Scheduled</title>
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
            margin: 0 auto 10px auto;
            display: block;
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
                                            <img src="<?php echo e(asset('gss-uic-logo-v2.png')); ?>" alt="UIC Graduate School Logo" style="max-width: 50px; height: auto;">
                                        </td>
                                        <td align="right">
                                            <span style="color: #FF4B64; font-size: 14px; font-weight: bold;">Graduate School System</span>
                                        </td>
                                    </tr>
                                </table>
        
        <?php echo $__env->make('emails.partials.testing-disclaimer', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>

        <h1>Your Defense Has Been Scheduled!</h1>

        
            <p class="message">
                <strong>Dear <?php echo e($defenseRequest->first_name); ?> <?php echo e($defenseRequest->last_name); ?>,</strong>
            </p>
            <p class="message">
                We are pleased to inform you that your thesis/dissertation defense has been officially approved and scheduled. This is an important milestone in your academic journey at the University of the Immaculate Conception Graduate School.
            </p>

            <div class="schedule-box">
                <div class="date">
                    <i class="fas fa-calendar-alt"></i> <?php echo e($defenseRequest->scheduled_date->format('l, F j, Y')); ?>

                </div>
                <div class="time">
                    <i class="fa-regular fa-clock"></i> <?php echo e($defenseRequest->scheduled_time); ?> - <?php echo e($defenseRequest->scheduled_end_time); ?>

                </div>
                <?php if($defenseRequest->defense_mode): ?>
                    <span class="mode-badge">
                        <?php echo e($defenseRequest->defense_mode); ?>

                    </span>
                <?php endif; ?>
                <?php if($defenseRequest->defense_venue): ?>
                    <div class="venue">
                        <strong><i class="fas fa-map-marker-alt"></i> Venue:</strong> <?php echo e($defenseRequest->defense_venue); ?>

                    </div>
                <?php endif; ?>
            </div>

            <div class="info-box">
                <h2>Defense Details</h2>
                
                <div class="label">Defense Title</div>
                <div class="value" style="font-style: italic;"><?php echo e($defenseRequest->thesis_title); ?></div>

                <div class="label">Defense Type</div>
                <div class="value"><?php echo e($defenseRequest->defense_type); ?> Defense</div>

                <div class="label">Adviser</div>
                <div class="value"><?php echo e($defenseRequest->defense_adviser); ?></div>
            </div>

            <?php
                $panelists = collect([
                    $defenseRequest->defense_chairperson,
                    $defenseRequest->defense_panelist1,
                    $defenseRequest->defense_panelist2,
                    $defenseRequest->defense_panelist3,
                    $defenseRequest->defense_panelist4,
                ])->filter()->values();
            ?>

            <?php if($panelists->count() > 0): ?>
                <div class="info-box">
                    <h2>Defense Panel Members</h2>
                    <?php if($defenseRequest->defense_chairperson): ?>
                        <div class="label">Chairperson</div>
                        <div class="value"><?php echo e($defenseRequest->defense_chairperson); ?></div>
                    <?php endif; ?>
                    <?php $__currentLoopData = [$defenseRequest->defense_panelist1, $defenseRequest->defense_panelist2, $defenseRequest->defense_panelist3, $defenseRequest->defense_panelist4]; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $index => $panelist): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <?php if($panelist): ?>
                            <div class="label">Panelist <?php echo e($index + 1); ?></div>
                            <div class="value"><?php echo e($panelist); ?></div>
                        <?php endif; ?>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </div>
            <?php endif; ?>

            <div class="prepare-box">
                <h3>What to Expect & How to Prepare</h3>
                <ul>
                    <li>Review your thesis/dissertation thoroughly, especially methodology and findings</li>
                    <li>Prepare a brief presentation (typically 15-20 minutes) summarizing your work</li>
                    <li>Anticipate questions from the panel about your research</li>
                    <li>Arrive 15 minutes early to set up and test any equipment</li>
                    <li><?php if($defenseRequest->defense_mode === 'Online'): ?>Ensure you have a stable internet connection and test your audio/video beforehand@else Dress professionally and bring extra copies of your manuscript <?php endif; ?></li>
                    <li>Bring required documents (manuscript copies, forms, etc.) as per Graduate School guidelines</li>
                </ul>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                If you have any questions or concerns about your defense, please contact the Graduate School office or your adviser immediately. We wish you the best of luck with your defense presentation!
            </p>
        </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td align="center">
                                            <img src="<?php echo e(asset('gss-uic-logo-v2.png')); ?>" alt="UIC Graduate School Logo" style="max-width: 60px; margin-bottom: 10px;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="font-size: 14px; color: #333; line-height: 1.6;">
                                            <strong>University of the Immaculate Conception</strong><br>
                                            Graduate School Office<br>
                                            Father Selga St., Davao City, Philippines 8000
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="font-size: 12px; color: #333; padding-top: 15px;">
                                            This is an automated message from the Graduate School System.<br>
                                            Please do not reply to this email.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\Graduate_School_System\resources\views/emails/defense-scheduled-student.blade.php ENDPATH**/ ?>