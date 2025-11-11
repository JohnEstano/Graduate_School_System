<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Exam Results Posted</title>
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
        
        .success-box {
            background-color: #ecfdf5;
            border: 1px solid #10b981;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 20px 0;
        }

        .success-box h2 {
            color: #047857;
            font-size: 18px;
            margin: 0 0 10px 0;
        }

        .success-box p {
            color: #065f46;
            margin: 0;
            font-size: 14px;
        }

        .warning-box {
            background-color: #fef2f2;
            border: 1px solid #ef4444;
            border-left: 4px solid #ef4444;
            padding: 20px;
            margin: 20px 0;
        }

        .warning-box h2 {
            color: #991b1b;
            font-size: 18px;
            margin: 0 0 10px 0;
        }

        .warning-box p {
            color: #7f1d1d;
            margin: 0;
            font-size: 14px;
        }

        .info-box {
            background-color: #eff6ff;
            border: 1px solid #3b82f6;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
        }

        .info-box h3 {
            color: #1e40af;
            font-size: 16px;
            margin: 0 0 10px 0;
        }

        .info-box p {
            color: #1e3a8a;
            margin: 5px 0;
            font-size: 14px;
        }
        
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        .details-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }

        .details-table td:first-child {
            font-weight: bold;
            color: #374151;
            width: 40%;
        }

        .details-table td:last-child {
            color: #6b7280;
        }

        .subjects-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
        }

        .subjects-table th {
            background-color: #f9fafb;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
            font-size: 14px;
        }

        .subjects-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }

        .subjects-table tr:last-child td {
            border-bottom: none;
        }

        .score-passed {
            color: #047857;
            font-weight: bold;
        }

        .score-failed {
            color: #991b1b;
            font-weight: bold;
        }

        .average-row {
            background-color: #f9fafb;
            font-weight: bold;
        }

        .average-row td {
            color: #374151;
            border-top: 2px solid #e5e7eb;
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
            text-align: center;
        }
        
        .footer-text {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            line-height: 1.6;
            margin-top: 30px;
        }
        
        .footer-logo {
            max-width: 60px;
            margin-bottom: 10px;
        }
        
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
            .details-table td:first-child {
                width: 50%;
            }
        }
    </style>
</head>
<body>
    <table class="email-wrapper" role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table class="email-container" role="presentation" width="600" cellpadding="0" cellspacing="0">
                    <tr>
                        <td>
                            <!-- Header -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="50">
                                        <img src="<?php echo e(asset('gss-uic-logo-v2.png')); ?>" alt="UIC Graduate School Logo" class="logo" style="max-width: 50px; height: auto;" />
                                    </td>
                                    <td align="right">
                                        <span class="header-title" style="color: #FF4B64; font-size: 14px; font-weight: bold;">Graduate School System</span>
                                    </td>
                                </tr>
                            </table>

                            <!-- Main Content -->
                            <h1>Comprehensive Exam Results</h1>

                            <div class="message">
                                <strong>Dear <?php echo e($student->first_name); ?> <?php echo e($student->last_name); ?>,</strong>
                            </div>

                            <div class="message">
                                Your comprehensive examination results have been posted and are now available for review. 
                                Below is a summary of your performance.
                            </div>

                            <!-- Result Status Box -->
                            <?php if($resultStatus === 'passed'): ?>
                                <div class="success-box">
                                    <h2>Congratulations - You Passed</h2>
                                    <p>You have successfully passed the comprehensive examination with an average score of <?php echo e($averageScore); ?>.</p>
                                </div>
                            <?php else: ?>
                                <div class="warning-box">
                                    <h2>Results Notification</h2>
                                    <p>Your comprehensive examination results show an average score of <?php echo e($averageScore); ?>. Unfortunately, this does not meet the passing requirement.</p>
                                </div>
                            <?php endif; ?>

                            <!-- Application Details -->
                            <table class="details-table" role="presentation">
                                <tr>
                                    <td>Application ID</td>
                                    <td><?php echo e($examApplication->application_id); ?></td>
                                </tr>
                                <tr>
                                    <td>Student ID</td>
                                    <td><?php echo e($examApplication->student_id); ?></td>
                                </tr>
                                <tr>
                                    <td>Program</td>
                                    <td><?php echo e($examApplication->program); ?></td>
                                </tr>
                                <tr>
                                    <td>School Year</td>
                                    <td><?php echo e($examApplication->school_year); ?></td>
                                </tr>
                            </table>

                            <!-- Subject Scores -->
                            <div class="info-box">
                                <h3>Individual Subject Scores</h3>
                            </div>

                            <table class="subjects-table" role="presentation">
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th style="text-align: center;">Score</th>
                                        <th style="text-align: center;">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php $__currentLoopData = $subjects; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $subject): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                        <tr>
                                            <td><?php echo e($subject['subject_name']); ?></td>
                                            <td style="text-align: center;" class="<?php echo e($subject['score'] > 74 ? 'score-passed' : 'score-failed'); ?>">
                                                <?php echo e($subject['score']); ?>

                                            </td>
                                            <td style="text-align: center;" class="<?php echo e($subject['score'] > 74 ? 'score-passed' : 'score-failed'); ?>">
                                                <?php echo e($subject['score'] > 74 ? 'Passed' : 'Failed'); ?>

                                            </td>
                                        </tr>
                                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                    <tr class="average-row">
                                        <td>Overall Average</td>
                                        <td style="text-align: center;"><?php echo e($averageScore); ?></td>
                                        <td style="text-align: center;"><?php echo e($resultStatus === 'passed' ? 'Passed' : 'Failed'); ?></td>
                                    </tr>
                                </tbody>
                            </table>

                            <!-- Next Steps -->
                            <div class="info-box">
                                <h3>Next Steps</h3>
                                <?php if($resultStatus === 'passed'): ?>
                                    <p>1. Your results will be forwarded to the Registrar's Office for processing</p>
                                    <p>2. You will receive further instructions regarding completion requirements</p>
                                    <p>3. Please wait for official communication regarding your next steps</p>
                                    <p>4. Contact the Graduate School Office if you have any questions</p>
                                <?php else: ?>
                                    <p>1. Review your performance in each subject area</p>
                                    <p>2. Consult with your adviser regarding retake procedures</p>
                                    <p>3. Contact the Graduate School Office for guidance on next steps</p>
                                    <p>4. A passing score of 75 or higher is required (average must be above 74)</p>
                                <?php endif; ?>
                            </div>

                            <!-- CTA Button -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="<?php echo e(url('/comprehensive-exam')); ?>" class="cta-button">
                                            View Full Details
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Important Note -->
                            <div class="message" style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                                <strong>Important:</strong> This is an official notification from the Graduate School System. 
                                If you believe there is an error in your results, please contact the Graduate School Office 
                                within 5 working days of receiving this notification.
                            </div>

                            <?php echo $__env->make('emails.partials.testing-disclaimer', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                            <?php echo $__env->make('emails.partials.footer', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\Graduate_School_System\resources\views/emails/comprehensive-exam-results-posted.blade.php ENDPATH**/ ?>