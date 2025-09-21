<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\DefenseRequest;
use Carbon\Carbon;

class AutoCompleteDefenses extends Command
{
    protected $signature = 'defenses:auto-complete {--dry-run : Only show which would complete}';
    protected $description = 'Automatically mark scheduled defenses as completed after their end time passes';

    public function handle(): int
    {
        $now = now();
        $candidates = DefenseRequest::where('workflow_state','scheduled')->get();

        $count = 0;
        foreach ($candidates as $req) {
            $end = $req->scheduledEndAt();
            if ($end && $end->isPast()) {
                if ($this->option('dry-run')) {
                    $this->line("Would complete #{$req->id} (ends {$end})");
                } else {
                    $req->attemptAutoComplete(); // system user id null
                    $this->info("Completed #{$req->id}");
                }
                $count++;
            }
        }

        $this->info($this->option('dry-run')
            ? "Dry-run: {$count} would be completed."
            : "Completed {$count} defense request(s).");

        return Command::SUCCESS;
    }
}