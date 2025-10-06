<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\DefenseRequest;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\DefenseRequestSubmitted;

class ResendDefenseEmail extends Command
{
    protected $signature = 'defense:resend-email {defense_request_id}';
    protected $description = 'Resend email notification for a defense request';

    public function handle()
    {
        $id = $this->argument('defense_request_id');
        
        $defenseRequest = DefenseRequest::find($id);
        
        if (!$defenseRequest) {
            $this->error("❌ Defense request #{$id} not found!");
            return 1;
        }
        
        $this->info("📧 Processing defense request #{$id}...");
        $this->line("   Student: {$defenseRequest->first_name} {$defenseRequest->last_name}");
        $this->line("   Defense Adviser: {$defenseRequest->defense_adviser}");
        $this->newLine();
        
        // Find adviser user
        $adviserUser = User::where('role', 'Faculty')
            ->where(function($query) use ($defenseRequest) {
                $query->whereRaw('LOWER(CONCAT(first_name," ",COALESCE(middle_name,"")," ",last_name)) = ?', [strtolower($defenseRequest->defense_adviser)])
                    ->orWhereRaw('LOWER(CONCAT(first_name," ",last_name)) = ?', [strtolower($defenseRequest->defense_adviser)])
                    ->orWhereRaw('LOWER(TRIM(CONCAT(first_name," ",COALESCE(middle_name,"")," ",last_name))) = ?', [strtolower($defenseRequest->defense_adviser)]);
            })
            ->first();
        
        if (!$adviserUser) {
            $this->error("❌ Adviser not found!");
            $this->line("   Looking for: {$defenseRequest->defense_adviser}");
            $this->newLine();
            $this->warn("Available Faculty users:");
            $faculty = User::where('role', 'Faculty')->get();
            foreach ($faculty as $f) {
                $fullName = trim("{$f->first_name} " . ($f->middle_name ? $f->middle_name . " " : "") . "{$f->last_name}");
                $this->line("   - {$fullName} ({$f->email})");
            }
            return 1;
        }
        
        $this->info("✅ Adviser found: {$adviserUser->first_name} {$adviserUser->last_name}");
        $this->line("   Email: {$adviserUser->email}");
        $this->newLine();
        
        if (!$adviserUser->email) {
            $this->error("❌ Adviser has no email address!");
            return 1;
        }
        
        // Update defense request if needed
        if (!$defenseRequest->adviser_user_id) {
            $defenseRequest->adviser_user_id = $adviserUser->id;
            $defenseRequest->assigned_to_user_id = $adviserUser->id;
            $defenseRequest->save();
            $this->info("✅ Updated defense request with adviser_user_id: {$adviserUser->id}");
        }
        
        // Queue the email
        $this->info("📤 Queuing email to: {$adviserUser->email}");
        Mail::to($adviserUser->email)
            ->queue(new DefenseRequestSubmitted($defenseRequest, $adviserUser));
        
        $this->newLine();
        $this->info("✅ Email queued successfully!");
        $this->line("   The queue worker will send it shortly.");
        $this->newLine();
        $this->comment("💡 Check queue status: php artisan queue:work");
        $this->comment("💡 Or run diagnostic: php diagnose_email.php");
        
        return 0;
    }
}
