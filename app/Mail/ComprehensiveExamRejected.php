<?php

namespace App\Mail;

use App\Models\ExamApplication;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ComprehensiveExamRejected extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public ExamApplication $examApplication,
        public User $student,
        public string $rejectedBy, // 'registrar' or 'dean'
        public ?string $rejectionReason = null,
        public ?string $rejectorName = null
    ) {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $rejectorTitle = ucfirst($this->rejectedBy);
        return new Envelope(
            subject: "Comprehensive Exam Application {$rejectorTitle} Rejection - {$this->examApplication->program}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.comprehensive-exam-rejected',
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
