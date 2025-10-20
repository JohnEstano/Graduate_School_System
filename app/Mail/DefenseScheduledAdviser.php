<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\DefenseRequest;

class DefenseScheduledAdviser extends Mailable
{
    use Queueable, SerializesModels;

    public $adviserName;
    public $studentName;
    public $defenseTitle;
    public $defenseDate;
    public $defenseTime;
    public $defenseEndTime;
    public $defenseMode;
    public $defenseVenue;
    public $panels;

    /**
     * Create a new message instance.
     */
    public function __construct(DefenseRequest $defenseRequest)
    {
        // Get adviser information
        $adviser = $defenseRequest->adviserUser;
        if ($adviser) {
            $this->adviserName = trim(($adviser->first_name ?? '') . ' ' . 
                                       ($adviser->middle_name ?? '') . ' ' . 
                                       ($adviser->last_name ?? ''));
        } else {
            $this->adviserName = 'N/A';
        }

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

        // Get panel members
        $this->panels = $defenseRequest->panelists()->get()->map(function ($panelist) {
            return [
                'name' => trim(($panelist->first_name ?? '') . ' ' . 
                              ($panelist->middle_name ?? '') . ' ' . 
                              ($panelist->last_name ?? '')),
                'role' => $panelist->pivot->role ?? 'Panel Member'
            ];
        });
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Defense Scheduled - Adviser Notification - UIC Graduate School',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.defense-scheduled-adviser',
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
