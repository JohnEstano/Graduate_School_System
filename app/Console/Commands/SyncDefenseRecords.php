<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\DefenseRequest;
use App\Models\AaPaymentVerification;
use App\Services\StudentRecordSyncService;
use App\Models\StudentRecord;
use App\Models\PanelistRecord;

class SyncDefenseRecords extends Command
{
    protected $signature = 'defense:sync {defense_id?}';
    protected $description = 'Manually sync defense records to student records and honorarium';

    public function handle()
    {
        $defenseId = $this->argument('defense_id');
        
        if ($defenseId) {
            $this->syncSingleDefense($defenseId);
        } else {
            $this->syncAllReadyForFinance();
        }
    }
    
    private function syncSingleDefense($defenseId)
    {
        $defense = DefenseRequest::find($defenseId);
        
        if (!$defense) {
            $this->error("Defense request {$defenseId} not found!");
            return;
        }
        
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("Defense Request ID: {$defense->id}");
        $this->info("Student: {$defense->first_name} {$defense->last_name}");
        $this->info("Program: {$defense->program}");
        $this->info("Defense Type: {$defense->defense_type}");
        
        try {
            $syncService = new StudentRecordSyncService();
            $syncService->syncDefenseToStudentRecord($defense);
            
            $this->info("✅ Sync completed successfully!");
            $this->showResults($defense);
            
        } catch (\Exception $e) {
            $this->error("❌ Sync failed: {$e->getMessage()}");
            $this->error($e->getTraceAsString());
        }
    }
    
    private function syncAllReadyForFinance()
    {
        $verifications = AaPaymentVerification::where('status', 'ready_for_finance')
            ->with('defenseRequest')
            ->get();
            
        $this->info("Found {$verifications->count()} defense requests with ready_for_finance status");
        $this->newLine();
        
        foreach ($verifications as $verification) {
            $defense = $verification->defenseRequest;
            
            if (!$defense) {
                $this->warn("⏭️  Skipping verification ID {$verification->id} - no defense request");
                continue;
            }
            
            // Check if already synced
            $existing = StudentRecord::where('defense_request_id', $defense->id)->first();
            if ($existing) {
                $this->warn("⏭️  Skipping defense {$defense->id} - already synced (Student Record ID: {$existing->id})");
                continue;
            }
            
            $this->syncSingleDefense($defense->id);
            $this->newLine();
        }
        
        $this->info("✅ All syncs complete!");
    }
    
    private function showResults($defense)
    {
        $this->newLine();
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("VERIFICATION:");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        $studentRecord = StudentRecord::where('defense_request_id', $defense->id)->first();
        
        if ($studentRecord) {
            $this->info("✅ Student Record (ID: {$studentRecord->id})");
            $this->info("   Program Record ID: {$studentRecord->program_record_id}");
            
            $paymentCount = \App\Models\PaymentRecord::where('student_record_id', $studentRecord->id)->count();
            $this->info("   Payment Records: {$paymentCount}");
            
            $pivotCount = \DB::table('panelist_student_records')
                ->where('student_id', $studentRecord->id)
                ->count();
            $this->info("   Pivot Links: {$pivotCount}");
            
            // Show program info
            $program = \App\Models\ProgramRecord::find($studentRecord->program_record_id);
            if ($program) {
                $panelistCount = PanelistRecord::where('program_record_id', $program->id)->count();
                $this->info("✅ Program: {$program->name}");
                $this->info("   Category: {$program->category}");
                $this->info("   Panelists in Program: {$panelistCount}");
                
                $this->newLine();
                $this->info("🎉 Check these URLs:");
                $this->info("   /honorarium/individual-record/{$program->id}");
                $this->info("   /student-records/program/{$program->id}");
            }
        } else {
            $this->error("❌ Student Record NOT created!");
        }
    }
}
