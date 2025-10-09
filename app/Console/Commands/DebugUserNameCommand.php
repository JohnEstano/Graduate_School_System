<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

class DebugUserNameCommand extends Command
{
    protected $signature = 'debug:user-name {school_id}';
    protected $description = 'Debug all name attributes for a user';

    public function handle()
    {
        $schoolId = $this->argument('school_id');
        $user = User::where('school_id', $schoolId)->first();
        
        if (!$user) {
            $this->error("User with school_id {$schoolId} not found");
            return 1;
        }
        
        $this->info("User debugging for school_id: {$schoolId}");
        $this->line("=================================");
        $this->line("Raw attributes:");
        $this->line("  first_name: " . ($user->first_name ?? 'NULL'));
        $this->line("  middle_name: " . ($user->middle_name ?? 'NULL'));
        $this->line("  last_name: " . ($user->last_name ?? 'NULL'));
        $this->line("  name (from DB): " . ($user->getAttributes()['name'] ?? 'NULL'));
        $this->line("  name (via accessor): " . ($user->name ?? 'NULL'));
        $this->line("");
        $this->line("Computed attributes:");
        $this->line("  display_name: " . ($user->display_name ?? 'NULL'));
        $this->line("");
        
        // Check if there's a database 'name' column
        $this->line("Database structure check:");
        $hasNameColumn = Schema::hasColumn('users', 'name');
        $this->line("  Has 'name' column: " . ($hasNameColumn ? 'YES' : 'NO'));
        
        return 0;
    }
}