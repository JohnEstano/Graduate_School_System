<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentRejectedByAdviser extends Mailable
{
    use Queueable, SerializesModels;

    public $student;
    public $adviser;
    public $coordinator;
    public $adviserFullName;
    public $studentFullName;
    public $adviserEmail;
    public $coordinatorName;
    public $coordinatorEmail;

    /**
     * Create a new message instance.
     */
    public function __construct(User $student, User $adviser, User $coordinator)
    {
        $this->student = $student;
        $this->adviser = $adviser;
        $this->coordinator = $coordinator;
        
        // Extract full names for email display
        $this->adviserFullName = trim(($adviser->first_name ?? '') . ' ' . 
                                      ($adviser->middle_name ? strtoupper($adviser->middle_name[0]) . '. ' : '') . 
                                      ($adviser->last_name ?? ''));
        
        $this->studentFullName = trim(($student->first_name ?? '') . ' ' . 
                                     ($student->middle_name ? strtoupper($student->middle_name[0]) . '. ' : '') . 
                                     ($student->last_name ?? ''));
        
        $this->coordinatorName = trim(($coordinator->first_name ?? '') . ' ' . 
                                     ($coordinator->middle_name ? strtoupper($coordinator->middle_name[0]) . '. ' : '') . 
                                     ($coordinator->last_name ?? ''));
        
        $this->adviserEmail = $adviser->email;
        $this->coordinatorEmail = $coordinator->email;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Adviser Assignment Update - Action Required',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.student-rejected-by-adviser',
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
