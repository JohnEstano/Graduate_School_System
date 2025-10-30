<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class StudentRegisteredNotification extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 5;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public $backoff = 3;

    public $adviser;
    public $student;
    public $coordinator;
    public $studentEmailFromAssignment;

    /**
     * Create a new message instance.
     * 
     * @param mixed $adviser The adviser receiving the notification
     * @param mixed $student The student who just registered
     * @param mixed $coordinator The coordinator who made the assignment
     * @param string $studentEmailFromAssignment The original email from PendingStudentAssignment
     */
    public function __construct($adviser, $student, $coordinator, $studentEmailFromAssignment)
    {
        $this->adviser = $adviser;
        $this->student = $student;
        $this->coordinator = $coordinator;
        $this->studentEmailFromAssignment = $studentEmailFromAssignment;
        
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
     */
    public function build()
    {
        $adviserName = trim($this->adviser->first_name . ' ' . $this->adviser->last_name);
        $studentName = trim($this->student->first_name . ' ' . $this->student->last_name);
        $coordinatorName = trim($this->coordinator->first_name . ' ' . $this->coordinator->last_name);
        
        // Use the original email from PendingStudentAssignment (more reliable and complete)
        $studentEmail = $this->studentEmailFromAssignment;
        
        // Use student number from student model or extract from email
        $studentNumber = $this->student->student_number;
        if (!$studentNumber && preg_match('/(\d{10,})/', $studentEmail, $matches)) {
            $studentNumber = $matches[1];
        }
        
        // Get program from student model if available, otherwise use generic
        $studentProgram = $this->student->program ?? 'Graduate Program';

        return $this->subject('Student Registration Complete - Action Required')
                    ->view('emails.student-registered-notification')
                    ->with([
                        'adviserName' => $adviserName,
                        'studentName' => $studentName,
                        'studentEmail' => $studentEmail,
                        'studentNumber' => $studentNumber ?: 'N/A',
                        'studentProgram' => $studentProgram,
                        'coordinatorName' => $coordinatorName,
                        'actionUrl' => url('/adviser/pending-students'),
                    ]);
    }
}
