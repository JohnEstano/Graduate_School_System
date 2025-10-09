<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Models\DefenseRequest;
use App\Mail\DefenseRequestSubmitted;
use App\Mail\DefenseRequestApproved;
use App\Mail\DefenseRequestRejected;
use App\Mail\DefenseScheduled;

class TestEmailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test {email} {--type=simple}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test email sending functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $type = $this->option('type');

        $this->info("Testing email to: {$email}");
        $this->info("Email type: {$type}");
        $this->newLine();

        try {
            switch ($type) {
                case 'simple':
                    Mail::raw('Test email from Graduate School System - Email is working! 🎉', function ($message) use ($email) {
                        $message->to($email)
                                ->subject('Test Email - Graduate School System');
                    });
                    $this->info('✅ Simple test email sent!');
                    break;

                case 'submitted':
                    $student = User::where('role', 'Student')->first();
                    $adviser = User::where('role', 'Faculty')->first();
                    $defenseRequest = DefenseRequest::first();

                    if (!$student || !$adviser || !$defenseRequest) {
                        $this->error('Missing required data (student, adviser, or defense request)');
                        return 1;
                    }

                    Mail::to($email)->send(new DefenseRequestSubmitted($defenseRequest, $adviser));
                    $this->info('✅ Defense Request Submitted email sent!');
                    break;

                case 'approved':
                    $student = User::where('role', 'Student')->first();
                    $defenseRequest = DefenseRequest::first();

                    if (!$student || !$defenseRequest) {
                        $this->error('Missing required data (student or defense request)');
                        return 1;
                    }

                    Mail::to($email)->send(new DefenseRequestApproved(
                        $defenseRequest,
                        $student,
                        'adviser',
                        'Great work! Your proposal is well-structured and ready for review.'
                    ));
                    $this->info('✅ Defense Request Approved email sent!');
                    break;

                case 'rejected':
                    $student = User::where('role', 'Student')->first();
                    $defenseRequest = DefenseRequest::first();

                    if (!$student || !$defenseRequest) {
                        $this->error('Missing required data (student or defense request)');
                        return 1;
                    }

                    Mail::to($email)->send(new DefenseRequestRejected(
                        $defenseRequest,
                        $student,
                        'adviser',
                        'Please update your methodology section and revise the timeline. Resubmit once ready.'
                    ));
                    $this->info('✅ Defense Request Rejected email sent!');
                    break;

                case 'scheduled':
                    $student = User::where('role', 'Student')->first();
                    $defenseRequest = DefenseRequest::first();

                    if (!$student || !$defenseRequest) {
                        $this->error('Missing required data (student or defense request)');
                        return 1;
                    }

                    Mail::to($email)->send(new DefenseScheduled($defenseRequest, $student));
                    $this->info('✅ Defense Scheduled email sent!');
                    break;

                default:
                    $this->error("Unknown email type: {$type}");
                    $this->info('Available types: simple, submitted, approved, rejected, scheduled');
                    return 1;
            }

            $this->newLine();
            $this->info("Check your inbox at: {$email}");
            $this->info("If using queue, run: php artisan queue:work");
            
            return 0;
        } catch (\Exception $e) {
            $this->error("Error sending email: {$e->getMessage()}");
            return 1;
        }
    }
}
