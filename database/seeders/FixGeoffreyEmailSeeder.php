<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class FixGeoffreyEmailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Fixing Geoffrey Diapana email to UIC format...');
        
        // Find Geoffrey by school ID
        $geoffrey = User::where('school_id', '230000001047')->first();
        
        if (!$geoffrey) {
            $this->command->error('Geoffrey Diapana (230000001047) not found.');
            return;
        }
        
        $this->command->info("Found: {$geoffrey->first_name} {$geoffrey->last_name} ({$geoffrey->email})");
        
        // Generate the correct UIC email format: gdiapana_230000001047@uic.edu.ph
        $newEmail = 'gdiapana_230000001047@uic.edu.ph';
        
        // Check if this email already exists
        $existingUser = User::where('email', $newEmail)->where('id', '!=', $geoffrey->id)->first();
        
        if ($existingUser) {
            $this->command->error("Email {$newEmail} is already taken by another user.");
            return;
        }
        
        // Update Geoffrey's email
        $geoffrey->update(['email' => $newEmail]);
        
        $this->command->info("✅ Updated Geoffrey's email to: {$newEmail}");
        $this->command->info("✅ Display name: {$geoffrey->display_name}");
        $this->command->info("✅ Dashboard greeting will show: Hi, {$geoffrey->display_name}");
    }
}