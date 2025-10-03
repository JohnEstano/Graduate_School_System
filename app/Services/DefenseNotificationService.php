<?php

namespace App\Services;

use App\Models\DefenseRequest;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class DefenseNotificationService
{
    /**
     * Send defense scheduling notifications to relevant parties
     */
    public function sendSchedulingNotifications(DefenseRequest $defenseRequest, array $parties)
    {
        $notifications = [];

        foreach ($parties as $party) {
            try {
                switch ($party) {
                    case 'adviser':
                        $this->notifyAdviser($defenseRequest);
                        $notifications[] = 'adviser';
                        break;
                    
                    case 'student':
                        $this->notifyStudent($defenseRequest);
                        $notifications[] = 'student';
                        break;
                    
                    case 'panels':
                        $this->notifyPanels($defenseRequest);
                        $notifications[] = 'panels';
                        break;
                }
            } catch (\Exception $e) {
                Log::error("Failed to notify {$party}", [
                    'defense_request_id' => $defenseRequest->id,
                    'party' => $party,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $notifications;
    }

    /**
     * Notify the adviser about defense scheduling
     */
    protected function notifyAdviser(DefenseRequest $defenseRequest)
    {
        // Find adviser user by name (if user system is linked)
        $adviser = User::where('role', 'Faculty')
            ->where(function ($query) use ($defenseRequest) {
                $adviserName = trim($defenseRequest->defense_adviser);
                $nameParts = explode(' ', $adviserName);
                
                if (count($nameParts) >= 2) {
                    $query->where('first_name', 'LIKE', '%' . $nameParts[0] . '%')
                          ->where('last_name', 'LIKE', '%' . end($nameParts) . '%');
                } else {
                    $query->where('first_name', 'LIKE', '%' . $adviserName . '%')
                          ->orWhere('last_name', 'LIKE', '%' . $adviserName . '%');
                }
            })
            ->first();

        if ($adviser && $adviser->email) {
            $this->sendEmail($adviser->email, 'Defense Scheduled - ' . $defenseRequest->student_name, 
                $this->getAdviserEmailContent($defenseRequest));
        }

        Log::info('Adviser notification sent', [
            'defense_request_id' => $defenseRequest->id,
            'adviser_name' => $defenseRequest->defense_adviser,
            'adviser_found' => $adviser ? true : false,
        ]);
    }

    /**
     * Notify the student about defense scheduling
     */
    protected function notifyStudent(DefenseRequest $defenseRequest)
    {
        // Find student by school_id
        $student = User::where('school_id', $defenseRequest->school_id)
            ->orWhere(function ($query) use ($defenseRequest) {
                $query->where('first_name', $defenseRequest->first_name)
                      ->where('last_name', $defenseRequest->last_name);
            })
            ->first();

        if ($student && $student->email) {
            $this->sendEmail($student->email, 'Your Defense Has Been Scheduled', 
                $this->getStudentEmailContent($defenseRequest));
        }

        Log::info('Student notification sent', [
            'defense_request_id' => $defenseRequest->id,
            'student_name' => $defenseRequest->first_name . ' ' . $defenseRequest->last_name,
            'student_found' => $student ? true : false,
        ]);
    }

    /**
     * Notify panel members about defense scheduling
     */
    protected function notifyPanels(DefenseRequest $defenseRequest)
    {
        $panelMembers = [
            'Chairperson' => $defenseRequest->defense_chairperson,
            'Panelist 1' => $defenseRequest->defense_panelist1,
            'Panelist 2' => $defenseRequest->defense_panelist2,
            'Panelist 3' => $defenseRequest->defense_panelist3,
            'Panelist 4' => $defenseRequest->defense_panelist4,
        ];

        foreach ($panelMembers as $role => $name) {
            if (!$name) continue;

            $panelist = User::where('role', 'Faculty')
                ->where(function ($query) use ($name) {
                    $nameParts = explode(' ', trim($name));
                    
                    if (count($nameParts) >= 2) {
                        $query->where('first_name', 'LIKE', '%' . $nameParts[0] . '%')
                              ->where('last_name', 'LIKE', '%' . end($nameParts) . '%');
                    } else {
                        $query->where('first_name', 'LIKE', '%' . $name . '%')
                              ->orWhere('last_name', 'LIKE', '%' . $name . '%');
                    }
                })
                ->first();

            if ($panelist && $panelist->email) {
                $this->sendEmail($panelist->email, 'Defense Panel Assignment - ' . $defenseRequest->student_name, 
                    $this->getPanelistEmailContent($defenseRequest, $role));
            }

            Log::info('Panel member notification sent', [
                'defense_request_id' => $defenseRequest->id,
                'panel_role' => $role,
                'panel_name' => $name,
                'panelist_found' => $panelist ? true : false,
            ]);
        }
    }

    /**
     * Send email (placeholder - integrate with your mail system)
     */
    protected function sendEmail(string $email, string $subject, string $content)
    {
        // For now, just log the email content
        // In production, integrate with Laravel's Mail system
        Log::info('Email notification', [
            'to' => $email,
            'subject' => $subject,
            'content' => $content,
        ]);

        // Example Laravel Mail integration:
        // Mail::raw($content, function ($message) use ($email, $subject) {
        //     $message->to($email)->subject($subject);
        // });
    }

    /**
     * Get adviser email content
     */
    protected function getAdviserEmailContent(DefenseRequest $defenseRequest): string
    {
        $schedule = $defenseRequest->scheduled_date ? 
            $defenseRequest->scheduled_date->format('M d, Y') . ' at ' . 
            $defenseRequest->scheduled_time->format('g:i A') : 'Not scheduled';

        return "
Dear {$defenseRequest->defense_adviser},

The defense for your advisee has been scheduled:

Student: {$defenseRequest->first_name} {$defenseRequest->last_name} ({$defenseRequest->school_id})
Program: {$defenseRequest->program}
Defense Type: {$defenseRequest->defense_type}
Thesis Title: {$defenseRequest->thesis_title}

Defense Schedule:
Date & Time: {$schedule}
Mode: " . ucfirst($defenseRequest->defense_mode) . "
Venue: {$defenseRequest->defense_venue}

Panel Members:
Chairperson: {$defenseRequest->defense_chairperson}
Panelist 1: {$defenseRequest->defense_panelist1}" . 
($defenseRequest->defense_panelist2 ? "\nPanelist 2: {$defenseRequest->defense_panelist2}" : '') .
($defenseRequest->defense_panelist3 ? "\nPanelist 3: {$defenseRequest->defense_panelist3}" : '') .
($defenseRequest->defense_panelist4 ? "\nPanelist 4: {$defenseRequest->defense_panelist4}" : '') . "

" . ($defenseRequest->scheduling_notes ? "Notes: {$defenseRequest->scheduling_notes}\n\n" : '') . "
Please coordinate with your advisee and the panel members for the defense preparation.

Best regards,
Graduate School Coordinator
        ";
    }

    /**
     * Get student email content
     */
    protected function getStudentEmailContent(DefenseRequest $defenseRequest): string
    {
        $schedule = $defenseRequest->scheduled_date ? 
            $defenseRequest->scheduled_date->format('M d, Y') . ' at ' . 
            $defenseRequest->scheduled_time->format('g:i A') : 'Not scheduled';

        return "
Dear {$defenseRequest->first_name} {$defenseRequest->last_name},

Your defense has been officially scheduled:

Defense Schedule:
Date & Time: {$schedule}
Mode: " . ucfirst($defenseRequest->defense_mode) . "
Venue: {$defenseRequest->defense_venue}

Defense Details:
Program: {$defenseRequest->program}
Defense Type: {$defenseRequest->defense_type}
Thesis Title: {$defenseRequest->thesis_title}
Adviser: {$defenseRequest->defense_adviser}

Panel Members:
Chairperson: {$defenseRequest->defense_chairperson}
Panelist 1: {$defenseRequest->defense_panelist1}" . 
($defenseRequest->defense_panelist2 ? "\nPanelist 2: {$defenseRequest->defense_panelist2}" : '') .
($defenseRequest->defense_panelist3 ? "\nPanelist 3: {$defenseRequest->defense_panelist3}" : '') .
($defenseRequest->defense_panelist4 ? "\nPanelist 4: {$defenseRequest->defense_panelist4}" : '') . "

" . ($defenseRequest->scheduling_notes ? "Important Notes: {$defenseRequest->scheduling_notes}\n\n" : '') . "
Please prepare accordingly and coordinate with your adviser for the final preparations.

Good luck with your defense!

Best regards,
Graduate School Office
        ";
    }

    /**
     * Get panelist email content
     */
    protected function getPanelistEmailContent(DefenseRequest $defenseRequest, string $role): string
    {
        $schedule = $defenseRequest->scheduled_date ? 
            $defenseRequest->scheduled_date->format('M d, Y') . ' at ' . 
            $defenseRequest->scheduled_time->format('g:i A') : 'Not scheduled';

        return "
Dear Faculty Member,

You have been assigned as {$role} for the following defense:

Student: {$defenseRequest->first_name} {$defenseRequest->last_name} ({$defenseRequest->school_id})
Program: {$defenseRequest->program}
Defense Type: {$defenseRequest->defense_type}
Thesis Title: {$defenseRequest->thesis_title}
Adviser: {$defenseRequest->defense_adviser}

Defense Schedule:
Date & Time: {$schedule}
Mode: " . ucfirst($defenseRequest->defense_mode) . "
Venue: {$defenseRequest->defense_venue}

Your Role: {$role}

Complete Panel:
Chairperson: {$defenseRequest->defense_chairperson}
Panelist 1: {$defenseRequest->defense_panelist1}" . 
($defenseRequest->defense_panelist2 ? "\nPanelist 2: {$defenseRequest->defense_panelist2}" : '') .
($defenseRequest->defense_panelist3 ? "\nPanelist 3: {$defenseRequest->defense_panelist3}" : '') .
($defenseRequest->defense_panelist4 ? "\nPanelist 4: {$defenseRequest->defense_panelist4}" : '') . "

" . ($defenseRequest->scheduling_notes ? "Special Instructions: {$defenseRequest->scheduling_notes}\n\n" : '') . "
Please mark your calendar and prepare for the defense evaluation.

Thank you for your service to the graduate program.

Best regards,
Graduate School Office
        ";
    }
}
