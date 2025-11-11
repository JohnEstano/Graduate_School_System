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
            margin: 20px 0;
            color: #333;
        }

        .message {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 20px;
            color: #333;
        }

        .info-box {
            border: 1px solid #e5e7eb;
            padding: 20px;
            margin: 20px 0;
        }

        .info-box h2 {
            font-size: 18px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 15px;
        }

        .label {
            font-weight: bold;
            color: #374151;
            font-size: 14px;
            margin-top: 10px;
        }

        .value {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .schedule-box {
            background-color: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }

        .schedule-date {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .schedule-time {
            font-size: 18px;
            color: #374151;
            margin-bottom: 10px;
        }

        .schedule-venue {
            font-size: 14px;
            color: #6b7280;
            margin-top: 10px;
        }

        .notice-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
        }

        .mode-badge {
            display: inline-block;
            padding: 6px 12px;
            font-size: 13px;
            font-weight: 600;
            margin-top: 10px;
            background-color: #e5e7eb;
            color: #374151;
        }

        .cta-button {
            display: inline-block;
            background-color: #FF4B64;
            color: #ffffff !important;
            padding: 15px 35px;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
        }

        .footer-text {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            line-height: 1.6;
        }

        .footer-logo {
            max-width: 60px;
            margin-bottom: 10px;
        }

        /* Mobile responsiveness */
        @media (max-width: 600px) {
            .email-container {
                padding: 20px !important;
            }

            h1 {
                font-size: 24px !important;
            }

            .message {
                font-size: 14px !important;
            }

            .schedule-date {
                font-size: 20px !important;
            }

            .schedule-time {
                font-size: 16px !important;
            }

            .info-box, .schedule-box, .notice-box {
                padding: 15px !important;
            }

            .info-box h2 {
                font-size: 16px !important;
            }

            .cta-button {
                display: block !important;
                width: 100% !important;
                text-align: center;
                padding: 12px 20px !important;
            }
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
                                <!-- Header -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td width="50">
                                            <img src="<?php echo e(asset('gss-uic-logo-v2.png')); ?>" alt="UIC Graduate School Logo" class="logo" style="max-width: 50px; height: auto;">
                                        </td>
                                        <td align="right">
                                            <span class="header-title" style="color: #FF4B64; font-size: 14px; font-weight: bold;">Graduate School System</span>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Testing Disclaimer -->
                                <?php echo $__env->make('emails.partials.testing-disclaimer', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>

                                <!-- Main Heading -->
                                <?php if($changes): ?>
                                    <h1 style="font-size: 32px; font-weight: bold; margin: 20px 0; color: #333;">Defense Schedule Updated!</h1>
                                <?php else: ?>
                                    <h1 style="font-size: 32px; font-weight: bold; margin: 20px 0; color: #333;">Defense Has Been Scheduled!</h1>
                                <?php endif; ?>

                                <!-- Content -->
                                <p class="message" style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333;">
                                    <strong>Dear <?php echo e($recipient->first_name); ?> <?php echo e($recipient->last_name); ?>,</strong>
                                </p>

                                <?php if($changes): ?>
                                    <!-- Notice Box for Updates -->
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" class="notice-box" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; margin: 20px 0;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <p style="margin: 0; font-size: 16px;">
                                                    <strong>⚠️ Important Update:</strong> Your defense details have been modified. Please review the updated information below.
                                                </p>
                                                <?php if($changes['schedule']): ?>
                                                    <p style="margin: 10px 0 0 0; font-size: 14px;">• Schedule changed: New date, time, or venue</p>
                                                <?php endif; ?>
                                                <?php if($changes['panels']): ?>
                                                    <p style="margin: 5px 0 0 0; font-size: 14px;">• Panel updated: Defense panel members have been changed or added</p>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                    </table>
                                <?php else: ?>
                                    <p class="message" style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333;">
                                        This is to inform you that your <?php echo e($defenseRequest->defense_type); ?> defense schedule has been finalized. Please review the details below and mark your calendar.
                                    </p>
                                <?php endif; ?>

                                <!-- Schedule Box -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" class="schedule-box" style="background-color: #f3f4f6; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px; text-align: center;">
                                            <div class="schedule-date" style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">
                                                📅 <?php echo e($defenseRequest->scheduled_date?->format('l, F j, Y') ?? 'To be announced'); ?>

                                            </div>
                                            <div class="schedule-time" style="font-size: 18px; color: #374151; margin-bottom: 10px;">
                                                🕐 <?php echo e($defenseRequest->scheduled_time ?? 'To be announced'); ?>

                                                <?php if($defenseRequest->scheduled_end_time): ?>
                                                    - <?php echo e($defenseRequest->scheduled_end_time); ?>

                                                <?php endif; ?>
                                            </div>
                                            <?php if($defenseRequest->defense_mode): ?>
                                                <span class="mode-badge" style="display: inline-block; padding: 6px 12px; font-size: 13px; font-weight: 600; margin-top: 10px; background-color: #e5e7eb; color: #374151;">
                                                    <?php echo e($defenseRequest->defense_mode); ?>

                                                </span>
                                            <?php endif; ?>
                                            <?php if($defenseRequest->defense_venue): ?>
                                                <div class="schedule-venue" style="font-size: 14px; color: #6b7280; margin-top: 10px;">
                                                    <strong>📍 Venue:</strong> <?php echo e($defenseRequest->defense_venue); ?>

                                                </div>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Defense Details Box -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" class="info-box" style="border: 1px solid #e5e7eb; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h2 style="font-size: 18px; font-weight: bold; margin-top: 0; margin-bottom: 15px;">Defense Details</h2>
                                            
                                            <div class="label" style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Student</div>
                                            <div class="value" style="color: #6b7280; font-size: 14px; margin-bottom: 10px;"><?php echo e($defenseRequest->first_name); ?> <?php echo e($defenseRequest->last_name); ?> (<?php echo e($defenseRequest->school_id); ?>)</div>

                                            <div class="label" style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Defense Type</div>
                                            <div class="value" style="color: #6b7280; font-size: 14px; margin-bottom: 10px;"><?php echo e($defenseRequest->defense_type); ?> Defense</div>

                                            <div class="label" style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Thesis Title</div>
                                            <div class="value" style="color: #6b7280; font-size: 14px; margin-bottom: 10px; font-style: italic;"><?php echo e($defenseRequest->thesis_title); ?></div>

                                            <?php if($defenseRequest->defense_adviser): ?>
                                                <div class="label" style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Adviser</div>
                                                <div class="value" style="color: #6b7280; font-size: 14px; margin-bottom: 10px;"><?php echo e($defenseRequest->defense_adviser); ?></div>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                </table>

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
                                    <!-- Panel Members Box -->
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" class="info-box" style="border: 1px solid #e5e7eb; margin: 20px 0;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <h2 style="font-size: 18px; font-weight: bold; margin-top: 0; margin-bottom: 15px;">Defense Panel Members</h2>
                                                <?php if($defenseRequest->defense_chairperson): ?>
                                                    <div class="label" style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Chairperson</div>
                                                    <div class="value" style="color: #6b7280; font-size: 14px; margin-bottom: 10px;"><?php echo e($defenseRequest->defense_chairperson); ?></div>
                                                <?php endif; ?>
                                                <?php $__currentLoopData = [$defenseRequest->defense_panelist1, $defenseRequest->defense_panelist2, $defenseRequest->defense_panelist3, $defenseRequest->defense_panelist4]; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $index => $panelist): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                                    <?php if($panelist): ?>
                                                        <div class="label" style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Panelist <?php echo e($index + 1); ?></div>
                                                        <div class="value" style="color: #6b7280; font-size: 14px; margin-bottom: 10px;"><?php echo e($panelist); ?></div>
                                                    <?php endif; ?>
                                                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                            </td>
                                        </tr>
                                    </table>
                                <?php endif; ?>

                                <!-- Pre-Defense Checklist Box -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" class="info-box" style="border: 1px solid #e5e7eb; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h2 style="font-size: 18px; font-weight: bold; margin-top: 0; margin-bottom: 15px;">Pre-Defense Checklist</h2>
                                            <ul style="padding-left: 20px; margin: 0; font-size: 14px; line-height: 1.8;">
                                                <li>Prepare your defense presentation (PPT/PDF)</li>
                                                <li>Print required copies of your manuscript</li>
                                                <li>Review all panel feedback and revisions</li>
                                                <li>Practice your presentation (20-30 minutes)</li>
                                                <li>Arrive 15 minutes early <?php if($defenseRequest->defense_mode === 'Online'): ?> / Join meeting link on time <?php endif; ?></li>
                                                <li>Dress appropriately (business attire)</li>
                                            </ul>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Button -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td align="center" style="padding: 20px 0;">
                                            <a href="<?php echo e(url('/defense-request/' . $defenseRequest->id)); ?>" class="cta-button" style="display: inline-block; background-color: #FF4B64; color: #ffffff; padding: 15px 35px; text-decoration: none; font-weight: bold; font-size: 16px;">
                                                View Full Defense Details
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <p class="message" style="font-size: 14px; line-height: 1.8; color: #6b7280;">
                                    If you need to reschedule or have any concerns, please contact the Graduate School office immediately.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td align="center">
                                            <img src="<?php echo e(asset('gss-uic-logo-v2.png')); ?>" alt="UIC Graduate School Logo" class="footer-logo" style="max-width: 60px; margin-bottom: 10px;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" class="footer-text" style="font-size: 12px; color: #6b7280; line-height: 1.6;">
                                            <strong>University of the Immaculate Conception</strong><br>
                                            Graduate School Office<br>
                                            Father Selga St., Davao City, Philippines 8000
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" class="footer-text" style="font-size: 12px; color: #6b7280; padding-top: 15px;">
                                            This is an automated message from the Graduate School System. Please do not
                                            reply to this email.
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
<?php /**PATH C:\xampp\htdocs\Graduate_School_System\resources\views/emails/defense-scheduled.blade.php ENDPATH**/ ?>