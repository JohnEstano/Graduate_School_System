<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Exam Application Approved</title>
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
        
        @media (max-width: 600px) {
            .email-container { padding: 20px !important; }
            h1 { font-size: 24px !important; }
            .message { font-size: 14px !important; }
            .info-box { padding: 15px !important; }
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
                                <h1 style="font-size: 32px; font-weight: bold; margin: 20px 0; color: #333;">Comprehensive Exam Application Approved!</h1>
                                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333;">
                                    <strong>Dear <?php echo e($student->first_name); ?> <?php echo e($student->last_name); ?>,</strong>
                                </p>
                                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333;">
                                    Congratulations! Your comprehensive exam application has been <strong>approved by the <?php echo e($approvedBy); ?></strong>.
                                </p>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h2 style="font-size: 18px; font-weight: bold; margin-top: 0; margin-bottom: 15px;">Application Details</h2>
                                            <div style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Student ID</div>
                                            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;"><?php echo e($examApplication->student_id); ?></div>
                                            <div style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Program</div>
                                            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;"><?php echo e($examApplication->program); ?></div>
                                            <div style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">School Year</div>
                                            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;"><?php echo e($examApplication->school_year); ?></div>
                                            <div style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Approved By</div>
                                            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;"><?php echo e(ucfirst($approvedBy)); ?><?php echo e($approverName ? ' - ' . $approverName : ''); ?></div>
                                            <div style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Approved On</div>
                                            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;"><?php echo e(now()->format('F j, Y g:i A')); ?></div>
                                        </td>
                                    </tr>
                                </table>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h2 style="font-size: 18px; font-weight: bold; margin-top: 0; margin-bottom: 15px;">Next Steps</h2>
                                            <?php if($approvedBy === 'registrar'): ?>
                                                <ul style="margin: 10px 0; padding-left: 20px;">
                                                    <li style="margin-bottom: 8px; color: #4b5563;">Your application will now be forwarded to the Dean for final approval.</li>
                                                    <li style="margin-bottom: 8px; color: #4b5563;">You will receive another notification once the Dean reviews your application.</li>
                                                    <li style="margin-bottom: 8px; color: #4b5563;">Continue monitoring your dashboard for updates.</li>
                                                </ul>
                                            <?php else: ?>
                                                <ul style="margin: 10px 0; padding-left: 20px;">
                                                    <li style="margin-bottom: 8px; color: #4b5563;">Your comprehensive exam application has been fully approved!</li>
                                                    <li style="margin-bottom: 8px; color: #4b5563;">Check the exam schedule for your subject offerings.</li>
                                                    <li style="margin-bottom: 8px; color: #4b5563;">Prepare for your comprehensive examination.</li>
                                                    <li style="margin-bottom: 8px; color: #4b5563;">Review all course materials and study guides.</li>
                                                    <li style="margin-bottom: 8px; color: #4b5563;">If you have questions, contact the Graduate School Office.</li>
                                                </ul>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                </table>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td align="center" style="padding: 20px 0;">
                                            <a href="<?php echo e(url('/comprehensive-exam')); ?>" style="display: inline-block; background-color: #FF4B64; color: #ffffff; padding: 15px 35px; text-decoration: none; font-weight: bold; font-size: 16px;">View Application Status</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                                <?php echo $__env->make('emails.partials.footer', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
<?php /**PATH C:\GSURS\Graduate_School_System-1\resources\views/emails/comprehensive-exam-approved.blade.php ENDPATH**/ ?>