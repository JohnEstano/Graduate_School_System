<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\DefenseRequest;
use App\Models\User;

class DefensePanelInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public $panelistName;
    public $role;
    public $studentName;
    public $defenseTitle;
    public $defenseDate;
    public $defenseTime;
    public $defenseEndTime;
    public $defenseMode;
    public $defenseVenue;
    public $adviserName;
    public $otherPanels;

    /**
     * Create a new message instance.
     */
    public function __construct(DefenseRequest $defenseRequest, User $panelist, string $role)
    {
        // Get panelist information
        $this->panelistName = trim(($panelist->first_name ?? '') . ' ' . 
                                    ($panelist->middle_name ?? '') . ' ' . 
                                    ($panelist->last_name ?? ''));
        $this->role = $role;

        // Get student information
        $student = $defenseRequest->user;
        $this->studentName = trim(($student->first_name ?? '') . ' ' . 
                                   ($student->middle_name ?? '') . ' ' . 
                                   ($student->last_name ?? ''));

        // Get defense details
        $this->defenseTitle = $defenseRequest->thesis_title;
        $this->defenseDate = $defenseRequest->scheduled_date;
        $this->defenseTime = $defenseRequest->scheduled_time;
        $this->defenseEndTime = $defenseRequest->scheduled_end_time;
        $this->defenseMode = $defenseRequest->defense_mode;
        $this->defenseVenue = $defenseRequest->defense_venue;

        // Get adviser information
        $adviser = $defenseRequest->adviserUser;
        if ($adviser) {
            $this->adviserName = trim(($adviser->first_name ?? '') . ' ' . 
                                       ($adviser->middle_name ?? '') . ' ' . 
                                       ($adviser->last_name ?? ''));
        } else {
            $this->adviserName = 'N/A';
        }

        // Get other panel members (excluding current panelist)
        $this->otherPanels = $defenseRequest->panelists()
            ->where('users.id', '!=', $panelist->id)
            ->get()
            ->map(function ($p) {
                return [
                    'name' => trim(($p->first_name ?? '') . ' ' . 
                                  ($p->middle_name ?? '') . ' ' . 
                                  ($p->last_name ?? '')),
                    'role' => $p->pivot->role ?? 'Panel Member'
                ];
            });
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Invitation to Serve on Defense Panel - UIC Graduate School',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.defense-panel-invitation',
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
