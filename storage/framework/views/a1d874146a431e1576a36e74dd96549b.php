<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Defense Panel Invitation</title>
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

        .role-badge {
            display: inline-block;
            background-color: #FF4B64;
            color: #ffffff;
            padding: 10px 20px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 20px 0;
            margin-bottom: 5px;
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

        .panel-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }

        .panel-section h3 {
            font-size: 16px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
        }

        .panel-member {
            background-color: #f9fafb;
            padding: 12px 15px;
            margin-bottom: 8px;
            border-left: 3px solid #FF4B64;
        }

        .panel-member-name {
            font-weight: 600;
            color: #333;
            font-size: 15px;
        }

        .panel-member-role {
            color: #FF4B64;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
        }

        .responsibilities-box {
            background-color: #f3f4f6;
            padding: 20px;
            margin: 20px 0;
        }

        .responsibilities-box h3 {
            font-size: 16px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
        }

        .responsibilities-box ul {
            margin: 0;
            padding-left: 20px;
        }

        .responsibilities-box li {
            margin-bottom: 8px;
            color: #333;
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

        <h1>Defense Panel Invitation!</h1>

        
            <p class="message">
                <strong>Dear Prof. <?php echo e($panelistName); ?>,</strong>
            </p>
            <p class="message">
                You are cordially invited to serve on the defense panel for a graduate student at the University of the Immaculate Conception Graduate School. Your expertise and insights would be invaluable to this academic evaluation.
            </p>

            <div style="text-align: center;">
                <span class="role-badge"> <i class="fa-solid fa-user"></i> <?php echo e(strtoupper($role)); ?></span>
            </div>

            <div class="info-box">
                <h2>Defense Details</h2>
                
                <div class="label">Student</div>
                <div class="value"><?php echo e($studentName); ?></div>
                
                <div class="label">Defense Title</div>
                <div class="value" style="font-style: italic;"><?php echo e($defenseTitle); ?></div>
                
                <div class="label">Adviser</div>
                <div class="value"><?php echo e($adviserName); ?></div>
                
                <div class="label">Date</div>
                <div class="value"><i class="fas fa-calendar-alt"></i> <?php echo e(\Carbon\Carbon::parse($defenseDate)->format('l, F j, Y')); ?></div>
                
                <div class="label">Time</div>
                <div class="value"><i class="fas fa-clock"></i> <?php echo e(\Carbon\Carbon::parse($defenseTime)->format('g:i A')); ?> - <?php echo e(\Carbon\Carbon::parse($defenseEndTime)->format('g:i A')); ?></div>
                
                <div class="label">Mode</div>
                <div class="value"><?php echo e(ucfirst($defenseMode)); ?></div>
                
                <div class="label">Venue</div>
                <div class="value"><i class="fas fa-map-marker-alt"></i> <?php echo e($defenseVenue); ?></div>

                <?php if(count($otherPanels) > 0): ?>
                <div class="panel-section">
                    <h3>Other Panel Members</h3>
                    <?php $__currentLoopData = $otherPanels; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $panel): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <div class="panel-member">
                            <div class="panel-member-name"><?php echo e($panel->name); ?></div>
                            <div class="panel-member-role"><?php echo e($panel->role); ?></div>
                        </div>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </div>
                <?php endif; ?>
            </div>

            <div class="responsibilities-box">
                <h3><i class="fa-regular fa-user"></i> Your Role as <?php echo e(ucfirst($role)); ?></h3>
                <ul>
                    <?php if($role === 'chair'): ?>
                        <li>Preside over the defense proceedings</li>
                        <li>Ensure the defense follows proper academic protocols</li>
                        <li>Facilitate questions and discussions among panel members</li>
                        <li>Lead the panel in deliberations and final evaluation</li>
                    <?php else: ?>
                        <li>Review the student's thesis/dissertation manuscript</li>
                        <li>Prepare questions and comments for the defense</li>
                        <li>Evaluate the quality and rigor of the research</li>
                        <li>Participate in panel deliberations and provide feedback</li>
                    <?php endif; ?>
                    <li>Arrive at least 15 minutes before the scheduled time</li>
                    <li>Submit evaluation forms after the defense</li>
                </ul>
            </div>

            <p class="message" style="font-size: 14px; color: #6b7280;">
                Please confirm your availability for this defense at your earliest convenience. If you are unable to attend or have any concerns, kindly inform the Graduate School office immediately.
            </p>
            <p class="message" style="font-size: 14px; color: #6b7280;">
                Thank you for your service to the academic community and your contribution to maintaining the quality of graduate education at UIC.
            </p>
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
<?php /**PATH C:\xampp\htdocs\Graduate_School_System\resources\views/emails/defense-panel-invitation.blade.php ENDPATH**/ ?>