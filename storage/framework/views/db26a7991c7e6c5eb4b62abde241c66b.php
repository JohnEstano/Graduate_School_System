<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Request Approved</title>
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
            margin-bottom: 35px;
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

        .comment-box {
            background-color: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #FF4B64;
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
            margin-top: 20px;
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

        <h1>Defense Request Approved!</h1>

        
            <p class="message">
                <strong>Dear <?php echo e($student->first_name); ?> <?php echo e($student->last_name); ?>,</strong>
            </p>
            <p class="message">
                Great news! Your defense request has been <strong>approved by your <?php echo e($approvedBy); ?></strong>.
            </p>

            <div class="info-box">
                <h2>Request Details</h2>
                <div class="label">Defense Type</div>
                <div class="value"><?php echo e($defenseRequest->defense_type); ?> Defense</div>

                <div class="label">Thesis Title</div>
                <div class="value" style="font-style: italic;"><?php echo e($defenseRequest->thesis_title); ?></div>

                <div class="label">Approved By</div>
                <div class="value"><?php echo e(ucfirst($approvedBy)); ?></div>

                <div class="label">Approved On</div>
                <div class="value"><?php echo e(now()->format('F j, Y g:i A')); ?></div>
            </div>

            <?php if($comment): ?>
                <div class="comment-box">
                    <p><strong> <i class="fa-solid fa-comment"></i> <?php echo e(ucfirst($approvedBy)); ?>'s Comments:</strong></p>
                    <p style="margin: 0; font-style: italic;"><?php echo e($comment); ?></p>
                </div>
            <?php endif; ?>

            <div class="info-box">
                <h2>Next Steps</h2>
                <?php if($approvedBy === 'adviser'): ?>
                    <ul>
                        <li>Your request will now be forwarded to the Coordinator for final approval.</li>
                        <li>You will receive another notification once the Coordinator reviews your request.</li>
                        <li>Continue monitoring your dashboard for updates.</li>
                    </ul>
                <?php else: ?>
                    <ul>
                        <li>Wait for panel assignment from the Coordinator.</li>
                        <li>You will receive a notification once your defense is scheduled.</li>
                        <li>Begin preparing your defense presentation.</li>
                        <li>Review all required documents and ensure they are complete.</li>
                    </ul>
                <?php endif; ?>
            </div>

            <div class="button-container">
                <a href="<?php echo e(url('/defense-request/' . $defenseRequest->id)); ?>" class="cta-button">
                    View Request Details
                </a>
            </div>
        </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb;">
        <div class="footer" style="text-align: center; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #6b7280;">
            <img src="<?php echo e(asset('gss-uic-logo-v2.png')); ?>" alt="UIC Graduate School Logo" class="logo" style="max-width: 60px; margin-bottom: 10px;">
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
    </div>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\Graduate_School_System\resources\views/emails/defense-approved.blade.php ENDPATH**/ ?>