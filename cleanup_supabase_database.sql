-- Complete Supabase Database Cleanup Script
-- Run this in Supabase SQL Editor to remove all tables and data
-- WARNING: This will permanently delete ALL data in your database

-- Disable Row Level Security temporarily
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.defense_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.defense_request_status_logs DISABLE ROW LEVEL SECURITY;

-- Drop all triggers first
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_defense_requests_updated_at ON public.defense_requests;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
DROP TRIGGER IF EXISTS update_message_participants_updated_at ON public.message_participants;
DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON public.messages;
DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
DROP TRIGGER IF EXISTS set_updated_at_defense_requests ON public.defense_requests;
DROP TRIGGER IF EXISTS set_updated_at_conversations ON public.conversations;
DROP TRIGGER IF EXISTS set_updated_at_messages ON public.messages;
DROP TRIGGER IF EXISTS set_updated_at_message_participants ON public.message_participants;

-- Drop all views first
DROP VIEW IF EXISTS public.defense_requests_with_users CASCADE;
DROP VIEW IF EXISTS public.user_profiles CASCADE;
DROP VIEW IF EXISTS public.conversation_summaries CASCADE;

-- Drop all tables in dependency order
DROP TABLE IF EXISTS public.message_participants CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.defense_request_status_logs CASCADE;
DROP TABLE IF EXISTS public.defense_requests CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop Laravel framework tables
DROP TABLE IF EXISTS public.migrations CASCADE;
DROP TABLE IF EXISTS public.cache CASCADE;
DROP TABLE IF EXISTS public.cache_locks CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.job_batches CASCADE;
DROP TABLE IF EXISTS public.failed_jobs CASCADE;
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;

-- Drop any remaining tables (in case there are others)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.panelists CASCADE;
DROP TABLE IF EXISTS public.conversation_summaries CASCADE;

-- Drop all custom functions
DROP FUNCTION IF EXISTS public.generate_ulid() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_conversation_last_message() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_conversations(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_conversation(uuid[], text, text) CASCADE;
DROP FUNCTION IF EXISTS public.send_message(uuid, text, text[]) CASCADE;
DROP FUNCTION IF EXISTS public.mark_messages_read(uuid, uuid) CASCADE;

-- Drop all policies (just in case any remain)
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view all defense requests" ON public.defense_requests;
DROP POLICY IF EXISTS "Users can create defense requests" ON public.defense_requests;
DROP POLICY IF EXISTS "Users can update their own defense requests" ON public.defense_requests;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view their conversation participations" ON public.message_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.message_participants;

-- Drop all sequences
DROP SEQUENCE IF EXISTS public.users_laravel_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.defense_requests_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.conversations_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.messages_id_seq CASCADE;

-- Verify cleanup - This should return empty results
SELECT 'Tables remaining:' as info, count(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT IN ('spatial_ref_sys'); -- PostGIS system table

SELECT 'Functions remaining:' as info, count(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND routine_name NOT LIKE 'pg_%';

SELECT 'Views remaining:' as info, count(*) as count
FROM information_schema.views 
WHERE table_schema = 'public';

-- Show what's left (should be empty or only system tables)
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT IN ('spatial_ref_sys')
ORDER BY table_name;
