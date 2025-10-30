<?php

namespace App\Mail;

use App\Models\DefenseRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DefenseScheduled extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     * ISSUE #7: Updated to accept any user (student, adviser, or panel member)
     * Note: $recipient can be a User model OR an object with email properties (for external panelists)
     */
    public function __construct(
        public DefenseRequest $defenseRequest,
        public object $recipient,  // Changed from User to object to support panelists table
        public ?array $changes = null  // Track what changed: ['schedule' => bool, 'panels' => bool]
    ) {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = "Defense Scheduled - {$this->defenseRequest->defense_type} Defense on {$this->defenseRequest->scheduled_date?->format('M j, Y')}";
        
        if ($this->changes) {
            if ($this->changes['schedule'] && $this->changes['panels']) {
                $subject = "Defense Rescheduled & Panel Updated - {$this->defenseRequest->defense_type} Defense";
            } elseif ($this->changes['schedule']) {
                $subject = "Defense Rescheduled - {$this->defenseRequest->defense_type} Defense";
            } elseif ($this->changes['panels']) {
                $subject = "Defense Panel Updated - {$this->defenseRequest->defense_type} Defense";
            }
        }
        
        return new Envelope(subject: $subject);
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.defense-scheduled',
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
