<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\DefenseRequest;
use App\Models\User;

class DefenseRequestAssignedToCoordinator extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public DefenseRequest $defenseRequest;
    public User $coordinator;
    public User $student;
    public ?User $adviser;

    /**
     * Create a new message instance.
     */
    public function __construct(DefenseRequest $defenseRequest)
    {
        $this->defenseRequest = $defenseRequest;
        
        // Load coordinator relationship or fetch directly
        $this->coordinator = $defenseRequest->coordinator_user_id 
            ? User::find($defenseRequest->coordinator_user_id) 
            : null;
            
        $this->student = User::find($defenseRequest->submitted_by);
        $this->adviser = $defenseRequest->adviserUser ?? User::find($defenseRequest->adviser_user_id);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $studentName = trim(($this->student->first_name ?? '') . ' ' . ($this->student->last_name ?? ''));
        
        return new Envelope(
            subject: 'New Defense Request Assigned - ' . $studentName,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.defense-assigned-coordinator',
            with: [
                'defenseRequest' => $this->defenseRequest,
                'coordinator' => $this->coordinator,
                'student' => $this->student,
                'adviser' => $this->adviser,
                'studentName' => trim(($this->student->first_name ?? '') . ' ' . ($this->student->last_name ?? '')),
                'adviserName' => $this->adviser ? trim(($this->adviser->first_name ?? '') . ' ' . ($this->adviser->last_name ?? '')) : 'N/A',
                'coordinatorName' => trim(($this->coordinator->first_name ?? '') . ' ' . ($this->coordinator->last_name ?? '')),
            ]
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
