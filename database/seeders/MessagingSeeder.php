<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Seeder;

class MessagingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing users
        $users = User::all();
        
        if ($users->count() < 2) {
            $this->command->info('Need at least 2 users to create conversations. Creating sample users...');
            
            // Create sample users if not exist
            $coordinator = User::firstOrCreate(
                ['email' => 'coordinator@example.com'],
                [
                    'first_name' => 'John',
                    'middle_name' => 'M',
                    'last_name' => 'Coordinator',
                    'school_id' => 'COORD001',
                    'program' => 'Administration',
                    'role' => 'Coordinator',
                    'password' => bcrypt('password'),
                    'email_verified_at' => now(),
                ]
            );

            $student = User::firstOrCreate(
                ['email' => 'student@example.com'],
                [
                    'first_name' => 'Jane',
                    'middle_name' => 'S',
                    'last_name' => 'Student',
                    'school_id' => 'STU001',
                    'program' => 'Computer Science',
                    'role' => 'Student',
                    'password' => bcrypt('password'),
                    'email_verified_at' => now(),
                ]
            );

            $dean = User::firstOrCreate(
                ['email' => 'dean@example.com'],
                [
                    'first_name' => 'Robert',
                    'middle_name' => 'D',
                    'last_name' => 'Dean',
                    'school_id' => 'DEAN001',
                    'program' => 'Administration',
                    'role' => 'Dean',
                    'password' => bcrypt('password'),
                    'email_verified_at' => now(),
                ]
            );

            $users = collect([$coordinator, $student, $dean]);
        }

        // Create sample conversations
        $this->createPrivateConversation($users);
        $this->createGroupConversation($users);
    }

    private function createPrivateConversation($users)
    {
        $user1 = $users->first();
        $user2 = $users->skip(1)->first();

        if (!$user1 || !$user2) return;

        $conversation = Conversation::create([
            'type' => 'private',
            'participants' => [$user1->id, $user2->id],
            'last_message_at' => now(),
        ]);

        // Add participants
        $conversation->users()->attach($user1->id, [
            'is_admin' => true,
            'joined_at' => now(),
        ]);
        
        $conversation->users()->attach($user2->id, [
            'is_admin' => false,
            'joined_at' => now(),
        ]);

        // Create sample messages
        Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user1->id,
            'content' => 'Hello! I hope you\'re doing well. I wanted to discuss your upcoming defense request.',
            'type' => 'text',
        ]);

        sleep(1); // Ensure different timestamps

        Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user2->id,
            'content' => 'Hi! Thank you for reaching out. I have a few questions about the defense process.',
            'type' => 'text',
        ]);

        sleep(1);

        Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user1->id,
            'content' => 'Of course! I\'m here to help. What specific questions do you have?',
            'type' => 'text',
        ]);

        $conversation->update(['last_message_at' => now()]);

        $this->command->info('Created private conversation between ' . $user1->name . ' and ' . $user2->name);
    }

    private function createGroupConversation($users)
    {
        if ($users->count() < 3) return;

        $participantIds = $users->take(3)->pluck('id')->toArray();

        $conversation = Conversation::create([
            'type' => 'group',
            'title' => 'Graduate Committee Discussion',
            'participants' => $participantIds,
            'last_message_at' => now(),
        ]);

        // Add participants
        foreach ($participantIds as $index => $userId) {
            $conversation->users()->attach($userId, [
                'is_admin' => $index === 0, // First user is admin
                'joined_at' => now(),
            ]);
        }

        // Create sample group messages
        $firstUser = $users->first();
        $secondUser = $users->skip(1)->first();
        $thirdUser = $users->skip(2)->first();

        Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $firstUser->id,
            'content' => 'Welcome to the Graduate Committee discussion group. We\'ll use this space to coordinate on student matters.',
            'type' => 'text',
        ]);

        sleep(1);

        Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $secondUser->id,
            'content' => 'Great idea! This will make communication much more efficient.',
            'type' => 'text',
        ]);

        sleep(1);

        Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $thirdUser->id,
            'content' => 'Agreed. Looking forward to working together through this platform.',
            'type' => 'text',
        ]);

        $conversation->update(['last_message_at' => now()]);

        $this->command->info('Created group conversation: ' . $conversation->title);
    }
}
