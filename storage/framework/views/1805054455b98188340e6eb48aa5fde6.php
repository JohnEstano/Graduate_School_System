<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Exam Application Approved</title>
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
            margin-bottom: 35px;
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

        .info-box ul {
            margin: 10px 0;
            padding-left: 20px;
        }

        .info-box ul li {
            margin-bottom: 8px;
            color: #4b5563;
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
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <img src="<?php echo e(asset('gss-uic-logo-v2.png')); ?>" alt="UIC Graduate School Logo" class="logo">
            <span class="header-title">Graduate School System</span>
        </div>

        <h1>Comprehensive Exam Application Approved!</h1>

        <div class="content">
            <p class="message">
                <strong>Dear <?php echo e($student->first_name); ?> <?php echo e($student->last_name); ?>,</strong>
            </p>
            <p class="message">
                Congratulations! Your comprehensive exam application has been <strong>approved by the <?php echo e($approvedBy); ?></strong>.
            </p>

            <div class="info-box">
                <h2>Application Details</h2>
                <div class="label">Student ID</div>
                <div class="value"><?php echo e($examApplication->student_id); ?></div>

                <div class="label">Program</div>
                <div class="value"><?php echo e($examApplication->program); ?></div>

                <div class="label">School Year</div>
                <div class="value"><?php echo e($examApplication->school_year); ?></div>

                <div class="label">Approved By</div>
                <div class="value"><?php echo e(ucfirst($approvedBy)); ?><?php echo e($approverName ? ' - ' . $approverName : ''); ?></div>

                <div class="label">Approved On</div>
                <div class="value"><?php echo e(now()->format('F j, Y g:i A')); ?></div>
            </div>

            <div class="info-box">
                <h2>Next Steps</h2>
                <?php if($approvedBy === 'registrar'): ?>
                    <ul>
                        <li>Your application will now be forwarded to the Dean for final approval.</li>
                        <li>You will receive another notification once the Dean reviews your application.</li>
                        <li>Continue monitoring your dashboard for updates.</li>
                    </ul>
                <?php else: ?>
                    
                    <ul>
                        <li>Your comprehensive exam application has been fully approved!</li>
                        <li>Check the exam schedule for your subject offerings.</li>
                        <li>Prepare for your comprehensive examination.</li>
                        <li>Review all course materials and study guides.</li>
                        <li>If you have questions, contact the Graduate School Office.</li>
                    </ul>
                <?php endif; ?>
            </div>

            <div class="button-container">
                <a href="<?php echo e(url('/comprehensive-exam')); ?>" class="cta-button">
                    View Application Status
                </a>
            </div>
        </div>
    </div>

    <div class="footer">
        <img src="<?php echo e(asset('gss-uic-logo-v2.png')); ?>" alt="UIC Graduate School Logo" class="logo">
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
<?php /**PATH C:\GSURS\Graduate_School_System-1\resources\views/emails/comprehensive-exam-approved.blade.php ENDPATH**/ ?>