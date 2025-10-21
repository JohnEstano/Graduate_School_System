<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class StudentAssignedToAdviser extends Mailable
{
    use Queueable, SerializesModels;

    public $adviserName;
    public $studentName;
    public $coordinatorName;
    public $studentEmail;
    public $studentProgram;

    /**
     * Create a new message instance.
     */
    public function __construct(User $adviser, User $student, User $coordinator)
    {
        // Get adviser full name
        $this->adviserName = trim(($adviser->first_name ?? '') . ' ' . 
                                   ($adviser->middle_name ?? '') . ' ' . 
                                   ($adviser->last_name ?? ''));

        // Get student full name
        $this->studentName = trim(($student->first_name ?? '') . ' ' . 
                                   ($student->middle_name ?? '') . ' ' . 
                                   ($student->last_name ?? ''));

        // Get coordinator full name
        $this->coordinatorName = trim(($coordinator->first_name ?? '') . ' ' . 
                                       ($coordinator->middle_name ?? '') . ' ' . 
                                       ($coordinator->last_name ?? ''));

        // Additional student info
        $this->studentEmail = $student->email ?? 'N/A';
        $this->studentProgram = $student->program ?? 'N/A';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Student Assignment - ' . $this->studentName,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.student-assigned-to-adviser',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
