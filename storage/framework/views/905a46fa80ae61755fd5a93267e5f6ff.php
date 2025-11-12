<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Exam Payment Issue</title>
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

        .warning-box {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 20px;
            margin: 20px 0;
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
            .info-box, .warning-box { padding: 15px !important; }
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
                                <h1 style="font-size: 32px; font-weight: bold; margin: 20px 0; color: #333;">Payment Requires Attention</h1>
                                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333;">
                                    <strong>Dear <?php echo e($student->first_name); ?> <?php echo e($student->last_name); ?>,</strong>
                                </p>
                                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #333;">
                                    We have reviewed your comprehensive examination payment and identified an issue that requires your attention.
                                </p>
                                <div class="warning-box" style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 18px; color: #991b1b;"><strong>⚠ Payment Issue Identified</strong></p>
                                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #b91c1c;">
                                        Your payment could not be verified at this time. Please review the reason below and take appropriate action.
                                    </p>
                                </div>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h2 style="font-size: 18px; font-weight: bold; margin-top: 0; margin-bottom: 15px;">Rejection Details</h2>
                                            <div style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Application ID</div>
                                            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;"><?php echo e($examApplication->id); ?></div>
                                            <div style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Student ID</div>
                                            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;"><?php echo e($examApplication->student_id); ?></div>
                                            <div style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Reason</div>
                                            <div style="color: #991b1b; font-size: 14px; margin-bottom: 10px; padding: 10px; background-color: #fef2f2;">
                                                <?php echo e($rejectionReason ?? 'Payment verification failed. Please contact the Registrar\'s office for details.'); ?>

                                            </div>
                                            <div style="font-weight: bold; color: #374151; font-size: 14px; margin-top: 10px;">Reviewed On</div>
                                            <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;"><?php echo e(now()->format('F j, Y g:i A')); ?></div>
                                        </td>
                                    </tr>
                                </table>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e5e7eb; margin: 20px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h2 style="font-size: 18px; font-weight: bold; margin-top: 0; margin-bottom: 15px;">Action Required</h2>
                                            <ol style="margin: 0; padding-left: 20px; color: #374151;">
                                                <li style="margin-bottom: 10px;">Review the rejection reason carefully</li>
                                                <li style="margin-bottom: 10px;">Contact the Registrar's office for clarification if needed</li>
                                                <li style="margin-bottom: 10px;">Gather the necessary documentation or payment proof</li>
                                                <li style="margin-bottom: 10px;">Resubmit your payment information through the system</li>
                                                <li style="margin-bottom: 10px;">Wait for verification confirmation</li>
                                            </ol>
                                        </td>
                                    </tr>
                                </table>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td align="center" style="padding: 20px 0;">
                                            <a href="<?php echo e(url('/comprehensive-exam')); ?>" style="display: inline-block; background-color: #FF4B64; color: #ffffff; padding: 15px 35px; text-decoration: none; font-weight: bold; font-size: 16px;">Resubmit Payment Information</a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="font-size: 14px; line-height: 1.8; color: #6b7280; margin-top: 20px;">
                                    <strong>Need Help?</strong> If you have questions or believe this is an error, please contact:<br>
                                    • Registrar's Office: registrar@uic.edu.ph<br>
                                    • Graduate School Office: graduateschool@uic.edu.ph<br>
                                    • Phone: (082) 227-8192
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
                                        <td align="center" style="font-size: 12px; color: #6b7280; line-height: 1.6;">
                                            <strong>University of the Immaculate Conception</strong><br>
                                            Graduate School Office<br>
                                            Father Selga St., Davao City, Philippines 8000
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style="font-size: 12px; color: #6b7280; padding-top: 15px;">
                                            This is an automated message from the Graduate School System. Please do not reply to this email.
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
<?php /**PATH C:\xampp\htdocs\Graduate_School_System\resources\views/emails/comprehensive-exam-payment-rejected.blade.php ENDPATH**/ ?>