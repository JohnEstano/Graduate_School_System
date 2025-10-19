<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProgramRecord;
use App\Models\DefenseRequest;
use App\Models\Panelist;
use App\Models\HonorariumPayment;
use Illuminate\Support\Facades\DB;

class HonorariumFullDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        ProgramRecord::truncate();
        DefenseRequest::truncate();
        Panelist::truncate();
        HonorariumPayment::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Create a Program
        $program = ProgramRecord::create([
            'name' => 'Doctor in Business Management',
            'program' => 'DBM',
            'category' => 'Doctorate',
            'date_edited' => '2025-08-08',
            'recently_updated' => now(),
            'time_last_opened' => now()->format('H:i:s'),
        ]);

        // 2. Create Panelists
        $panelist1 = Panelist::create([
            'name' => 'Dr. Alice Panelist',
            'email' => 'alice@example.com',
            'role' => 'Panel Member', // <-- use exact ENUM value
            'status' => 'Assigned',   // <-- use exact ENUM value
        ]);
        $panelist2 = Panelist::create([
            'name' => 'Dr. Bob Panelist',
            'email' => 'bob@example.com',
            'role' => 'Chairperson',  // <-- use exact ENUM value
            'status' => 'Assigned',   // <-- use exact ENUM value
        ]);

        // 3. Create a Defense Request for that Program
        $defenseRequest = DefenseRequest::create([
            'submitted_by' => 1, // Make sure user with ID 1 exists, or use a valid user ID
            'first_name' => 'Juan',
            'middle_name' => 'Santos',
            'last_name' => 'Dela Cruz',
            'school_id' => '2023123456',
            'program' => $program->program,
            'thesis_title' => 'A Study on Honorarium Automation',
            'scheduled_date' => now(),
            'scheduled_time' => now()->format('H:i:s'),
            'scheduled_end_time' => now()->addHour()->format('H:i:s'),
            'date_of_defense' => now()->toDateString(),
            'submitted_at' => now(),
            'defense_duration_minutes' => 60,
            'formatted_time_range' => '8:00 AM - 9:00 AM',
            'defense_mode' => 'Face-to-Face',   
            'defense_venue' => 'Room 101',
            'scheduling_status' => 'pending-panels',
            'defense_type' => 'Final',
            'defense_adviser' => 'Prof. Adviser',
            'workflow_state' => 'completed',
            'status' => 'Approved',
            'priority' => 'Medium',
            'adviser_status' => 'Pending',
            'coordinator_status' => 'Pending',
            // All other NOT NULL fields with defaults are omitted (they'll use the default)
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 4. Assign panelists to the defense request (by ID)
        $defenseRequest->defense_chairperson = $panelist2->name; // If your schema expects name, not ID
        $defenseRequest->defense_panelist1 = $panelist1->name;   // If your schema expects name, not ID
        $defenseRequest->save();

        // 5. Create Honorarium Payments for the Defense Request and Panelists
        HonorariumPayment::create([
            'defense_request_id' => $defenseRequest->id,
            'panelist_id' => $panelist1->id,
            'panelist_type' => 'Panelist',
            'role' => 'Panelist',
            'amount' => 1500,
            'status' => 'Unpaid',
            'payment_date' => now(),
        ]);
        HonorariumPayment::create([
            'defense_request_id' => $defenseRequest->id,
            'panelist_id' => $panelist2->id,
            'panelist_type' => 'Panelist',
            'role' => 'Chairperson',
            'amount' => 2000,
            'status' => 'Unpaid',
            'payment_date' => now(),
        ]);
    }
}
