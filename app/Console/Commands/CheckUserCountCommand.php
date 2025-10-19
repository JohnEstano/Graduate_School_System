<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class CheckUserCountCommand extends Command
{
    protected $signature = 'debug:user-count';
    protected $description = 'Check current user count in database';

    public function handle()
    {
        $userCount = User::count();
        $this->info("Current user count: {$userCount}");
        
        // Show last 5 users
        $lastUsers = User::latest()->take(5)->get(['id', 'email', 'first_name', 'last_name', 'created_at']);
        
        if ($lastUsers->count() > 0) {
            $this->info("Last 5 users:");
            foreach ($lastUsers as $user) {
                $this->line("ID: {$user->id}, Email: {$user->email}, Name: {$user->first_name} {$user->last_name}, Created: {$user->created_at}");
            }
        }
        
        return 0;
    }
}