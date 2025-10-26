<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\ProgramRecord;
use App\Models\PanelistRecord;
use App\Models\StudentRecord;
use App\Models\PaymentRecord;

class HonorariumAssignedRoleTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function controller_payload_includes_assigned_role_for_each_student()
    {
        // Create program
        $program = ProgramRecord::create([
            'name' => 'Test Program X',
            'program' => 'Masters',
            'category' => 'Test'
        ]);

        // Create students
        $student1 = StudentRecord::create([
            'first_name' => 'Alice',
            'middle_name' => 'I',
            'last_name' => 'Tester',
            'program_record_id' => $program->id,
        ]);

        $student2 = StudentRecord::create([
            'first_name' => 'Bob',
            'middle_name' => 'J',
            'last_name' => 'Example',
            'program_record_id' => $program->id,
        ]);

        // Create panelist
        $panelist = PanelistRecord::create([
            'program_record_id' => $program->id,
            'pfirst_name' => 'Dr.',
            'pmiddle_name' => 'K',
            'plast_name' => 'Panelist',
            'role' => 'Panel Member'
        ]);

        // Attach students with pivot role
        $panelist->students()->attach($student1->id, ['role' => 'Adviser']);
        $panelist->students()->attach($student2->id, ['role' => 'Panel Chair']);

        // Create payments linking to panelist
        PaymentRecord::create([
            'student_record_id' => $student1->id,
            'panelist_record_id' => $panelist->id,
            'school_year' => '2024-2025',
            'payment_date' => now(),
            'defense_status' => 'Completed',
            'amount' => 1000
        ]);

        PaymentRecord::create([
            'student_record_id' => $student2->id,
            'panelist_record_id' => $panelist->id,
            'school_year' => '2024-2025',
            'payment_date' => now(),
            'defense_status' => 'Completed',
            'amount' => 1200
        ]);

        // Emulate controller mapping (load relationships as controller does)
        $record = ProgramRecord::with([
            'panelists.students.payments',
            'panelists.payments'
        ])->findOrFail($program->id);

        $panelists = $record->panelists->map(function($p) {
            return [
                'id' => $p->id,
                'students' => $p->students->map(function($s) use ($p) {
                    return [
                        'id' => $s->id,
                        'assigned_role' => $s->pivot->role ?? null,
                        'payments' => $s->payments->where('panelist_record_id', $p->id)->values()
                    ];
                })->values()
            ];
        })->values();

        // Assertions: each mapped panelist's student should have assigned_role set and normalized
        $allowed = ['Adviser', 'Panel Chair', 'Panel Member'];
        foreach ($panelists as $pl) {
            foreach ($pl['students'] as $stu) {
                $this->assertArrayHasKey('assigned_role', $stu);
                $this->assertNotNull($stu['assigned_role']);
                $this->assertIsString($stu['assigned_role']);
                $this->assertContains($stu['assigned_role'], $allowed);
            }
        }
    }
}
