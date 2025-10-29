<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class StudentInvitation extends Mailable
{
    use Queueable, SerializesModels;

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
