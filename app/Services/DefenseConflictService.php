<?php

namespace App\Services;

use App\Models\DefenseRequest;
use Carbon\Carbon;

class DefenseConflictService
{
    /**
     * Validate panel assignment for basic conflicts.
     * - Ensure minimum panel requirements are met
     * - Check for obvious conflicts (person cannot be multiple panelists, but can be chair + panelist)
     *
     * @return array<string, string> field => error
     */
    public function validateAssignmentBasic(DefenseRequest $defenseRequest, array $panels): array
    {
        $errors = [];

        // Normalize names (trim)
        $chairperson = trim((string)($panels['defense_chairperson'] ?? ''));
        $panelist1 = trim((string)($panels['defense_panelist1'] ?? ''));
        $panelist2 = trim((string)($panels['defense_panelist2'] ?? ''));
        $panelist3 = trim((string)($panels['defense_panelist3'] ?? ''));
        $panelist4 = trim((string)($panels['defense_panelist4'] ?? ''));

        // Basic required fields check
        if (empty($chairperson)) {
            $errors['defense_chairperson'] = 'A chairperson is required.';
        }
        if (empty($panelist1)) {
            $errors['defense_panelist1'] = 'At least one panelist is required.';
        }

        // Check for duplicate panelist assignments (same person cannot be multiple panelists)
        // Note: Chairperson can also serve as a panelist if needed
        $panelists = array_filter([$panelist1, $panelist2, $panelist3, $panelist4]);
        $panelistsWithoutEmpty = array_filter($panelists, fn($p) => !empty($p));
        
        if (count($panelistsWithoutEmpty) !== count(array_unique($panelistsWithoutEmpty))) {
            $errors['defense_panelist2'] = 'The same person cannot be assigned to multiple panelist positions.';
        }

        // Note: We allow chairperson to also be a panelist if needed for flexibility

        return $errors;
    }

    /**
     * Validate scheduling conflicts using time ranges:
     * - Any selected panelist already assigned to another defense with overlapping time range
     * - Chair or panel roles are stored as names in DefenseRequest; compare by exact name
     *
     * @return array<int, array{person:string, current_role:string, conflicting_role:string, defense_id:int, time_range:string, student_name:string}>
     */
    public function findPanelSchedulingConflicts(DefenseRequest $current, array $panels, ?string $date, ?string $startTime, ?string $endTime): array
    {
        $conflicts = [];
        if (!$date || !$startTime || !$endTime) {
            return $conflicts; // Cannot check without complete schedule
        }

        // Map selected panel members with their roles
        $selectedWithRoles = [];
        $roleMapping = [
            'defense_chairperson' => 'Chairperson',
            'defense_panelist1' => 'Panelist 1',
            'defense_panelist2' => 'Panelist 2', 
            'defense_panelist3' => 'Panelist 3',
            'defense_panelist4' => 'Panelist 4'
        ];
        
        foreach ($roleMapping as $field => $roleTitle) {
            $person = trim((string)($panels[$field] ?? ''));
            if (!empty($person)) {
                $selectedWithRoles[$person] = $roleTitle;
            }
        }

        if (empty($selectedWithRoles)) return $conflicts;

        // Calculate current defense time range
        $currentStart = Carbon::parse($date . ' ' . $startTime);
        $currentEnd = Carbon::parse($date . ' ' . $endTime);

        // Query other defense requests at the same date with any scheduled time
        $others = DefenseRequest::query()
            ->where('id', '<>', $current->id)
            ->whereDate('scheduled_date', $date)
            ->whereNotNull('scheduled_time')
            ->whereNotNull('scheduled_end_time')
            ->whereIn('workflow_state', ['adviser-approved', 'coordinator-approved', 'scheduled'])
            ->with('student:id,first_name,last_name')
            ->get(['id', 'submitted_by', 'scheduled_time', 'scheduled_end_time', 'formatted_time_range',
                   'defense_chairperson', 'defense_panelist1', 'defense_panelist2', 'defense_panelist3', 'defense_panelist4']);

        foreach ($others as $other) {
            // Calculate other defense time range
            $otherStart = Carbon::parse($date . ' ' . $other->scheduled_time);
            $otherEnd = Carbon::parse($date . ' ' . $other->scheduled_end_time);
            
            // Check if time ranges overlap
            $hasTimeOverlap = $currentStart->lt($otherEnd) && $currentEnd->gt($otherStart);
            
            if ($hasTimeOverlap) {
                // Map other defense panel members with their roles
                $otherPanelWithRoles = [];
                $otherPanelMapping = [
                    'defense_chairperson' => 'Chairperson',
                    'defense_panelist1' => 'Panelist 1',
                    'defense_panelist2' => 'Panelist 2',
                    'defense_panelist3' => 'Panelist 3', 
                    'defense_panelist4' => 'Panelist 4'
                ];
                
                foreach ($otherPanelMapping as $field => $roleTitle) {
                    $person = trim((string)($other->{$field} ?? ''));
                    if (!empty($person)) {
                        $otherPanelWithRoles[$person] = $roleTitle;
                    }
                }

                foreach ($selectedWithRoles as $person => $currentRole) {
                    if (isset($otherPanelWithRoles[$person])) {
                        // Get student name from relationship if exists
                        $studentName = 'Unknown Student';
                        if ($other->student) {
                            $studentName = trim($other->student->first_name . ' ' . $other->student->last_name);
                        }
                        $conflicts[] = [
                            'person' => $person,
                            'current_role' => $currentRole,
                            'conflicting_role' => $otherPanelWithRoles[$person],
                            'defense_id' => $other->id,
                            'time_range' => $other->formatted_time_range ?? $otherStart->format('g:i A') . ' - ' . $otherEnd->format('g:i A'),
                            'student_name' => $studentName
                        ];
                    }
                }
            }
        }

        return $conflicts;
    }

    /**
     * Venue conflict: same venue, date, and overlapping time range.
     */
    public function hasVenueConflict(DefenseRequest $current, ?string $venue, ?string $date, ?string $startTime, ?string $endTime): bool
    {
        if (!$venue || !$date || !$startTime || !$endTime) return false;

        // Calculate current defense time range
        $currentStart = Carbon::parse($date . ' ' . $startTime);
        $currentEnd = Carbon::parse($date . ' ' . $endTime);

        // Check for venue conflicts with overlapping time ranges
        $others = DefenseRequest::query()
            ->where('id', '<>', $current->id)
            ->where('defense_venue', $venue)
            ->whereDate('scheduled_date', $date)
            ->whereNotNull('scheduled_time')
            ->whereNotNull('scheduled_end_time')
            ->get(['scheduled_time', 'scheduled_end_time']);

        foreach ($others as $other) {
            $otherStart = Carbon::parse($date . ' ' . $other->scheduled_time);
            $otherEnd = Carbon::parse($date . ' ' . $other->scheduled_end_time);
            
            // Check if time ranges overlap
            if ($currentStart->lt($otherEnd) && $currentEnd->gt($otherStart)) {
                return true;
            }
        }

        return false;
    }
}
