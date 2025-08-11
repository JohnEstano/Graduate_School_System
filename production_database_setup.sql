-- Complete Production-Ready Database Setup for Supabase
-- This script adds the missing notifications table and optimizes performance
-- Safe to run multiple times - handles existing objects gracefully

-- Add missing notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications (Performance Optimization)
-- Drop existing indexes first to avoid conflicts
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_user_read;
DROP INDEX IF EXISTS idx_notifications_user_read_created;

-- Create optimized indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read);

-- Composite index for common queries
CREATE INDEX idx_notifications_user_read_created ON public.notifications(user_id, read, created_at DESC);

-- Add trigger for updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON public.notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Performance optimization indexes for existing tables
-- Users table optimization
CREATE INDEX IF NOT EXISTS idx_users_email_active ON public.users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_active ON public.users(role) WHERE role IS NOT NULL;

-- Defense requests optimization
CREATE INDEX IF NOT EXISTS idx_defense_requests_status_date ON public.defense_requests(status, date_of_defense DESC);
CREATE INDEX IF NOT EXISTS idx_defense_requests_priority_status ON public.defense_requests(priority, status);

-- Messages optimization for better messaging performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_user ON public.messages(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_created ON public.messages(user_id, created_at DESC);

-- Message participants optimization
CREATE INDEX IF NOT EXISTS idx_participants_user_conversation ON public.message_participants(user_id, conversation_id);

-- Add some sample notifications for testing (only if none exist)
DO $$
BEGIN
    -- Only insert welcome notifications if the notifications table is empty
    IF (SELECT COUNT(*) FROM public.notifications) = 0 THEN
        INSERT INTO public.notifications (user_id, type, title, message, link, read, created_at) 
        SELECT 
            u.id,
            'welcome',
            'Welcome to Graduate School System',
            'Welcome to the Graduate School Management System! You can now submit defense requests, communicate with coordinators, and track your academic progress.',
            '/dashboard',
            false,
            NOW()
        FROM public.users u
        WHERE NOT EXISTS (
            SELECT 1 FROM public.notifications n WHERE n.user_id = u.id AND n.type = 'welcome'
        )
        LIMIT 10;
        
        RAISE NOTICE 'Added welcome notifications for existing users.';
    ELSE
        RAISE NOTICE 'Notifications table already has data, skipping sample data insertion.';
    END IF;
END $$;

-- Update table statistics for performance (ANALYZE is safe in transactions)
ANALYZE public.users;
ANALYZE public.defense_requests;
ANALYZE public.conversations;
ANALYZE public.messages;
ANALYZE public.message_participants;
ANALYZE public.notifications;

-- IMPORTANT: Run these VACUUM commands separately in Supabase SQL Editor
-- (Copy and paste these commands one by one after running the above script)
/*
VACUUM public.users;
VACUUM public.defense_requests;
VACUUM public.conversations;
VACUUM public.messages;
VACUUM public.message_participants;
VACUUM public.notifications;
*/
