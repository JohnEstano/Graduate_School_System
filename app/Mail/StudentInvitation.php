<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class StudentInvitation extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 5;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public $backoff = 3;

    public $studentName;
    public $adviserName;
    public $coordinatorName;

    /**
     * Create a new message instance.
     *
     * @param string $studentName
     * @param string $adviserName
     * @param string $coordinatorName
     */
    public function __construct($studentName, $adviserName, $coordinatorName)
    {
        $this->studentName = $studentName;
        $this->adviserName = $adviserName;
        $this->coordinatorName = $coordinatorName;
        
        // Queue on dedicated 'emails' queue with rate limiting middleware
        $this->onQueue('emails');
    }

    /**
     * Get the middleware the job should pass through.
     *
     * @return array
     */
    public function middleware()
    {
        return [new \App\Jobs\Middleware\RateLimitEmails];
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Invitation to UIC Graduate School System - Activate your account')
                    ->view('emails.student-invitation');
    }
}
