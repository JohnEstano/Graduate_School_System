<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentAcceptedByAdviser extends Mailable
{
    use Queueable, SerializesModels;

    public $student;
    public $adviser;
    public $adviserFullName;
    public $studentFullName;
    public $adviserEmail;
    public $adviserProgram;

    /**
     * Create a new message instance.
     */
    public function __construct(User $student, User $adviser)
    {
        $this->student = $student;
        $this->adviser = $adviser;
        
        // Extract full names for email display
        $this->adviserFullName = trim(($adviser->first_name ?? '') . ' ' . 
                                      ($adviser->middle_name ?? '') . ' ' . 
                                      ($adviser->last_name ?? ''));
        
        $this->studentFullName = trim(($student->first_name ?? '') . ' ' . 
                                     ($student->middle_name ?? '') . ' ' . 
                                     ($student->last_name ?? ''));
        
        $this->adviserEmail = $adviser->email;
        $this->adviserProgram = $adviser->program ?? 'Graduate School';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to the Advisery of ' . $this->adviserFullName,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.student-accepted-by-adviser',
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
