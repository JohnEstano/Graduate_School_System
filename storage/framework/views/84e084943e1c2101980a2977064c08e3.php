<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Student Assignment</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
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
            margin-bottom: 50px;
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
            color: #333;
        }

        .info-box .label {
            font-weight: bold;
            color: #666;
            margin-top: 12px;
            margin-bottom: 4px;
            font-size: 14px;
        }

        .info-box .value {
            color: #333;
            margin-bottom: 8px;
            font-size: 16px;
        }

        .action-box {
            background-color: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
        }

        .action-box h3 {
            font-size: 16px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
        }

        .action-box p {
            margin: 0 0 10px 0;
            font-size: 16px;
        }

        .action-box ul {
            margin: 10px 0;
            padding-left: 20px;
        }

        .action-box li {
            margin-bottom: 8px;
            color: #333;
        }

        .notice-box {
            background-color: #FFFBEB;
            border: 1px solid #F59E0B;
            padding: 20px;
            margin: 20px 0;
        }

        .notice-box .title {
            font-weight: bold;
            color: #92400E;
            margin-bottom: 10px;
            font-size: 14px;
        }

        .notice-box .details {
            color: #78350F;
            font-size: 14px;
        }

        .cta-button {
            display: inline-block;
            background-color: #FF4B64;
            color: #ffffff;
            padding: 15px 35px;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
            margin-top: 20px;
        }

        .footer {
            text-align: center;
            padding: 20px 30px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
        }

        .footer-text {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
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

        <h1>New Student Assignment!</h1>

        
            <p class="message">
                <strong>Dear Prof. <?php echo e($adviserName); ?>,</strong>
            </p>
            <p class="message">
                The coordinator <strong><?php echo e($coordinatorName); ?></strong> has assigned you to be the adviser of the following student in the University of the Immaculate Conception Graduate School system.
            </p>

            <div class="info-box">
                <h2>Student Information</h2>
                
                <div class="label"><i class="fas fa-user"></i> Student Name</div>
                <div class="value"><?php echo e($studentName); ?></div>
                
                <div class="label"><i class="fas fa-envelope"></i> Email</div>
                <div class="value"><?php echo e($studentEmail); ?></div>
                
                <div class="label"><i class="fas fa-graduation-cap"></i> Program</div>
                <div class="value"><?php echo e($studentProgram); ?></div>
            </div>

            <div class="action-box">
                <h3><i class="fas fa-clipboard-check"></i> Action Required</h3>
                <p>Please log in to the Graduate School System to:</p>
                <ul>
                    <li><strong>Confirm</strong> this student assignment if you accept to be their adviser</li>
                    <li><strong>Review</strong> the student's profile and academic information</li>
                    <li><strong>Contact</strong> the coordinator if you have any concerns or questions about this assignment</li>
                </ul>
                
                <div style="text-align: center;">
                    <a href="<?php echo e(config('app.url')); ?>/adviser/students" class="cta-button">
                        Click to View Student Assignments
                    </a>
                </div>
            </div>

            <div class="notice-box">
                <div class="title"><i class="fas fa-info-circle"></i> Important</div>
                <div class="details">
                    If you are unable to accept this student or have any concerns about this assignment, please contact <strong><?php echo e($coordinatorName); ?></strong> (Coordinator) as soon as possible to discuss alternative arrangements.
                </div>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                Your confirmation helps ensure smooth communication and academic support for our graduate students. We appreciate your dedication to mentoring and guiding our students through their academic journey.
            </p>
            <p class="message" style="font-size: 14px; color: #6b7280;">
                Thank you for your service to the Graduate School.
            </p>
        </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <img src="<?php echo e(asset('gss-uic-logo-v2.png')); ?>" alt="UIC Graduate School Logo" class="logo">
                                <p class="footer-text">
                                    <strong>University of the Immaculate Conception</strong><br>
                                    Graduate School Office<br>
                                    Father Selga St., Davao City, Philippines 8000
                                </p>
                                <p class="footer-text" style="margin-top: 15px;">
                                    This is an automated message from the Graduate School System. Please do not
                                    reply to this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\Graduate_School_System\resources\views/emails/student-assigned-to-adviser.blade.php ENDPATH**/ ?>