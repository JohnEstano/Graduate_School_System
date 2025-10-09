<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class TestDisplayNameCommand extends Command
{
    protected $signature = 'debug:display-name {school_id}';
    protected $description = 'Test display name for a user';

    public function handle()
    {
        $schoolId = $this->argument('school_id');
        $user = User::where('school_id', $schoolId)->first();
        
        if (!$user) {
            $this->error("User with school_id {$schoolId} not found");
            return 1;
        }
        
        $this->info("User found:");
        $this->line("Raw name: {$user->first_name} {$user->last_name}");
        $this->line("Display name: {$user->display_name}");
        $this->line("Email: {$user->email}");
        $this->line("Role: {$user->role}");
        
        return 0;
    }
}