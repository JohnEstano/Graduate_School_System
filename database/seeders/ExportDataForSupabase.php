<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\DefenseRequest;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;

class ExportDataForSupabase extends Seeder
{
    /**
     * Export all current data to JSON files for Supabase migration.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting data export for Supabase migration...');

        // Create export directory
        $exportPath = storage_path('app/supabase_export');
        if (!File::exists($exportPath)) {
            File::makeDirectory($exportPath, 0755, true);
        }

        // Export users
        $this->exportUsers($exportPath);
        
        // Export defense requests
        $this->exportDefenseRequests($exportPath);
        
        // Export defense request status logs
        $this->exportDefenseRequestStatusLogs($exportPath);
        
        // Export conversations (if any)
        $this->exportConversations($exportPath);
        
        // Export messages (if any)
        $this->exportMessages($exportPath);
        
        // Export message participants (if any)
        $this->exportMessageParticipants($exportPath);
        
        // Generate migration summary
        $this->generateMigrationSummary($exportPath);

        $this->command->info('✅ Data export completed successfully!');
        $this->command->info("📁 Files exported to: {$exportPath}");
    }

    private function exportUsers(string $exportPath): void
    {
        $this->command->info('📊 Exporting users...');
        
        $users = User::all()->map(function ($user) {
            return [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'password' => $user->password, // Keep hashed password
                'role' => $user->role,
                'program' => $user->program,
                'school_id' => $user->school_id,
                'avatar' => $user->avatar ?? null,
                'remember_token' => $user->remember_token,
                'created_at' => $user->created_at->toISOString(),
                'updated_at' => $user->updated_at->toISOString(),
            ];
        });

        File::put($exportPath . '/users.json', $users->toJson(JSON_PRETTY_PRINT));
        $this->command->info("   ✓ Exported {$users->count()} users");
    }

    private function exportDefenseRequests(string $exportPath): void
    {
        $this->command->info('📊 Exporting defense requests...');
        
        $requests = DB::table('defense_requests')->get()->map(function ($request) {
            return [
                'id' => $request->id,
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'school_id' => $request->school_id,
                'program' => $request->program,
                'thesis_title' => $request->thesis_title,
                'date_of_defense' => $request->date_of_defense,
                'mode_defense' => $request->mode_defense,
                'defense_type' => $request->defense_type,
                'advisers_endorsement' => $request->advisers_endorsement,
                'rec_endorsement' => $request->rec_endorsement,
                'proof_of_payment' => $request->proof_of_payment,
                'reference_no' => $request->reference_no,
                'defense_adviser' => $request->defense_adviser,
                'defense_chairperson' => $request->defense_chairperson,
                'defense_panelist1' => $request->defense_panelist1,
                'defense_panelist2' => $request->defense_panelist2,
                'defense_panelist3' => $request->defense_panelist3,
                'defense_panelist4' => $request->defense_panelist4,
                'status' => $request->status ?? 'Pending',
                'priority' => $request->priority ?? 'Medium',
                'last_status_updated_at' => $request->last_status_updated_at,
                'last_status_updated_by' => $request->last_status_updated_by,
                'updated_by' => $request->updated_by,
                'created_at' => $request->created_at,
                'updated_at' => $request->updated_at,
            ];
        });

        File::put($exportPath . '/defense_requests.json', $requests->toJson(JSON_PRETTY_PRINT));
        $this->command->info("   ✓ Exported {$requests->count()} defense requests");
    }

    private function exportDefenseRequestStatusLogs(string $exportPath): void
    {
        $this->command->info('📊 Exporting defense request status logs...');
        
        if (!DB::getSchemaBuilder()->hasTable('defense_request_status_logs')) {
            $this->command->info("   ⚠ Table 'defense_request_status_logs' does not exist, skipping...");
            File::put($exportPath . '/defense_request_status_logs.json', json_encode([], JSON_PRETTY_PRINT));
            return;
        }

        $logs = DB::table('defense_request_status_logs')->get()->map(function ($log) {
            return [
                'id' => $log->id,
                'defense_request_id' => $log->defense_request_id,
                'status' => $log->status,
                'priority' => $log->priority,
                'updated_by' => $log->updated_by,
                'updated_at' => $log->updated_at,
                'remarks' => $log->remarks,
            ];
        });

        File::put($exportPath . '/defense_request_status_logs.json', $logs->toJson(JSON_PRETTY_PRINT));
        $this->command->info("   ✓ Exported {$logs->count()} status logs");
    }

    private function exportConversations(string $exportPath): void
    {
        $this->command->info('📊 Exporting conversations...');
        
        if (!DB::getSchemaBuilder()->hasTable('conversations')) {
            $this->command->info("   ⚠ Table 'conversations' does not exist, skipping...");
            File::put($exportPath . '/conversations.json', json_encode([], JSON_PRETTY_PRINT));
            return;
        }

        $conversations = Conversation::all()->map(function ($conversation) {
            return [
                'id' => $conversation->id,
                'type' => $conversation->type,
                'title' => $conversation->title,
                'participants' => $conversation->participants,
                'last_message_at' => $conversation->last_message_at?->toISOString(),
                'created_at' => $conversation->created_at->toISOString(),
                'updated_at' => $conversation->updated_at->toISOString(),
            ];
        });

        File::put($exportPath . '/conversations.json', $conversations->toJson(JSON_PRETTY_PRINT));
        $this->command->info("   ✓ Exported {$conversations->count()} conversations");
    }

    private function exportMessages(string $exportPath): void
    {
        $this->command->info('📊 Exporting messages...');
        
        if (!DB::getSchemaBuilder()->hasTable('messages')) {
            $this->command->info("   ⚠ Table 'messages' does not exist, skipping...");
            File::put($exportPath . '/messages.json', json_encode([], JSON_PRETTY_PRINT));
            return;
        }

        $messages = Message::all()->map(function ($message) {
            return [
                'id' => $message->id,
                'conversation_id' => $message->conversation_id,
                'user_id' => $message->user_id,
                'content' => $message->content,
                'type' => $message->type,
                'metadata' => $message->metadata,
                'read_at' => $message->read_at?->toISOString(),
                'created_at' => $message->created_at->toISOString(),
                'updated_at' => $message->updated_at->toISOString(),
            ];
        });

        File::put($exportPath . '/messages.json', $messages->toJson(JSON_PRETTY_PRINT));
        $this->command->info("   ✓ Exported {$messages->count()} messages");
    }

    private function exportMessageParticipants(string $exportPath): void
    {
        $this->command->info('📊 Exporting message participants...');
        
        if (!DB::getSchemaBuilder()->hasTable('message_participants')) {
            $this->command->info("   ⚠ Table 'message_participants' does not exist, skipping...");
            File::put($exportPath . '/message_participants.json', json_encode([], JSON_PRETTY_PRINT));
            return;
        }

        $participants = DB::table('message_participants')->get()->map(function ($participant) {
            return [
                'id' => $participant->id,
                'conversation_id' => $participant->conversation_id,
                'user_id' => $participant->user_id,
                'joined_at' => $participant->joined_at,
                'last_read_at' => $participant->last_read_at,
                'is_admin' => $participant->is_admin,
                'created_at' => $participant->created_at,
                'updated_at' => $participant->updated_at,
            ];
        });

        File::put($exportPath . '/message_participants.json', $participants->toJson(JSON_PRETTY_PRINT));
        $this->command->info("   ✓ Exported {$participants->count()} message participants");
    }

    private function generateMigrationSummary(string $exportPath): void
    {
        $this->command->info('📋 Generating migration summary...');

        $userCount = User::count();
        $defenseRequestCount = DB::table('defense_requests')->count();
        $conversationCount = DB::getSchemaBuilder()->hasTable('conversations') ? 
            DB::table('conversations')->count() : 0;
        $messageCount = DB::getSchemaBuilder()->hasTable('messages') ? 
            DB::table('messages')->count() : 0;

        $summary = [
            'export_date' => now()->toISOString(),
            'database_info' => [
                'connection' => config('database.default'),
                'driver' => DB::getDriverName(),
                'database' => DB::getDatabaseName(),
            ],
            'table_counts' => [
                'users' => $userCount,
                'defense_requests' => $defenseRequestCount,
                'conversations' => $conversationCount,
                'messages' => $messageCount,
                'total_records' => $userCount + $defenseRequestCount + $conversationCount + $messageCount,
            ],
            'user_roles' => User::select('role', DB::raw('count(*) as count'))
                ->groupBy('role')
                ->pluck('count', 'role')
                ->toArray(),
            'user_programs' => User::select('program', DB::raw('count(*) as count'))
                ->whereNotNull('program')
                ->groupBy('program')
                ->pluck('count', 'program')
                ->toArray(),
            'defense_request_statuses' => DB::table('defense_requests')
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'files_exported' => [
                'users.json',
                'defense_requests.json',
                'defense_request_status_logs.json',
                'conversations.json',
                'messages.json',
                'message_participants.json',
                'migration_summary.json'
            ],
            'migration_notes' => [
                'All timestamps are in ISO 8601 format',
                'Passwords are kept hashed for security',
                'JSON fields are preserved as arrays/objects',
                'NULL values are explicitly included',
                'Foreign key relationships are maintained via IDs'
            ],
            'next_steps' => [
                '1. Review exported JSON files for data integrity',
                '2. Set up Supabase project and get credentials',
                '3. Run supabase_migration.sql in Supabase SQL editor',
                '4. Import data using the provided import scripts',
                '5. Update Laravel configuration for Supabase',
                '6. Test application functionality',
                '7. Update frontend to use Supabase client if needed'
            ]
        ];

        File::put($exportPath . '/migration_summary.json', json_encode($summary, JSON_PRETTY_PRINT));
        
        $this->command->info('📊 Migration Summary:');
        $this->command->info("   • Users: {$userCount}");
        $this->command->info("   • Defense Requests: {$defenseRequestCount}");
        $this->command->info("   • Conversations: {$conversationCount}");
        $this->command->info("   • Messages: {$messageCount}");
        $this->command->info("   • Total Records: " . ($userCount + $defenseRequestCount + $conversationCount + $messageCount));
    }
}
