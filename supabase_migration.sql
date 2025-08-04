-- ============================================================================
-- Graduate School Management System - Supabase Migration
-- Generated on: August 4, 2025
-- Description: Complete database schema migration from Laravel to Supabase
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USERS TABLE (Main user management)
-- ============================================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    laravel_id BIGINT UNIQUE, -- Keep Laravel ID for migration compatibility
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMPTZ,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL DEFAULT 'Student',
    program VARCHAR(255),
    school_id VARCHAR(255),
    avatar VARCHAR(255),
    remember_token VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_school_id ON public.users(school_id);
CREATE INDEX idx_users_program ON public.users(program);
CREATE INDEX idx_users_laravel_id ON public.users(laravel_id);

-- Row Level Security for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data and public profile info
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- 2. PASSWORD RESET TOKENS
-- ============================================================================
CREATE TABLE public.password_reset_tokens (
    email VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. SESSIONS TABLE (Laravel sessions)
-- ============================================================================
CREATE TABLE public.sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload TEXT NOT NULL,
    last_activity INTEGER NOT NULL
);

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_last_activity ON public.sessions(last_activity);

-- ============================================================================
-- 4. CACHE TABLES (Laravel caching)
-- ============================================================================
CREATE TABLE public.cache (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    expiration INTEGER NOT NULL
);

CREATE TABLE public.cache_locks (
    key VARCHAR(255) PRIMARY KEY,
    owner VARCHAR(255) NOT NULL,
    expiration INTEGER NOT NULL
);

-- ============================================================================
-- 5. JOBS TABLES (Laravel queue system)
-- ============================================================================
CREATE TABLE public.jobs (
    id BIGSERIAL PRIMARY KEY,
    queue VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    attempts SMALLINT NOT NULL,
    reserved_at INTEGER,
    available_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_jobs_queue ON public.jobs(queue);

CREATE TABLE public.job_batches (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_jobs INTEGER NOT NULL,
    pending_jobs INTEGER NOT NULL,
    failed_jobs INTEGER NOT NULL,
    failed_job_ids TEXT NOT NULL,
    options TEXT,
    cancelled_at INTEGER,
    created_at INTEGER NOT NULL,
    finished_at INTEGER
);

CREATE TABLE public.failed_jobs (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    connection TEXT NOT NULL,
    queue TEXT NOT NULL,
    payload TEXT NOT NULL,
    exception TEXT NOT NULL,
    failed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. DEFENSE REQUESTS TABLE (Core application feature)
-- ============================================================================
CREATE TABLE public.defense_requests (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    school_id VARCHAR(255) NOT NULL,
    program VARCHAR(255) NOT NULL,
    thesis_title VARCHAR(255) NOT NULL,
    date_of_defense DATE NOT NULL,
    mode_defense VARCHAR(255) NOT NULL,
    defense_type VARCHAR(255) NOT NULL,
    advisers_endorsement VARCHAR(255),
    rec_endorsement VARCHAR(255),
    proof_of_payment VARCHAR(255),
    reference_no VARCHAR(255),
    defense_adviser VARCHAR(255) NOT NULL,
    defense_chairperson VARCHAR(255) NOT NULL,
    defense_panelist1 VARCHAR(255) NOT NULL,
    defense_panelist2 VARCHAR(255),
    defense_panelist3 VARCHAR(255),
    defense_panelist4 VARCHAR(255),
    status VARCHAR(255) NOT NULL DEFAULT 'Pending',
    priority VARCHAR(255) NOT NULL DEFAULT 'Medium',
    last_status_updated_at TIMESTAMPTZ,
    last_status_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for defense_requests
CREATE INDEX idx_defense_requests_status ON public.defense_requests(status);
CREATE INDEX idx_defense_requests_priority ON public.defense_requests(priority);
CREATE INDEX idx_defense_requests_date ON public.defense_requests(date_of_defense);
CREATE INDEX idx_defense_requests_school_id ON public.defense_requests(school_id);
CREATE INDEX idx_defense_requests_program ON public.defense_requests(program);
CREATE INDEX idx_defense_requests_updated_by ON public.defense_requests(updated_by);

-- Row Level Security for defense_requests
ALTER TABLE public.defense_requests ENABLE ROW LEVEL SECURITY;

-- Students can read their own requests
CREATE POLICY "Students can read own requests" ON public.defense_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.school_id = defense_requests.school_id
            AND users.role = 'Student'
        )
    );

-- Staff can read all requests
CREATE POLICY "Staff can read all requests" ON public.defense_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('Administrative Assistant', 'Coordinator', 'Dean')
        )
    );

-- Staff can update requests
CREATE POLICY "Staff can update requests" ON public.defense_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('Administrative Assistant', 'Coordinator', 'Dean')
        )
    );

-- Students can insert their own requests
CREATE POLICY "Students can insert own requests" ON public.defense_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.school_id = defense_requests.school_id
            AND users.role = 'Student'
        )
    );

-- ============================================================================
-- 7. DEFENSE REQUEST STATUS LOGS (Audit trail)
-- ============================================================================
CREATE TABLE public.defense_request_status_logs (
    id BIGSERIAL PRIMARY KEY,
    defense_request_id BIGINT NOT NULL REFERENCES public.defense_requests(id) ON DELETE CASCADE,
    status VARCHAR(255) NOT NULL,
    priority VARCHAR(255),
    updated_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    remarks TEXT
);

-- Indexes for status logs
CREATE INDEX idx_status_logs_defense_request ON public.defense_request_status_logs(defense_request_id);
CREATE INDEX idx_status_logs_updated_by ON public.defense_request_status_logs(updated_by);
CREATE INDEX idx_status_logs_updated_at ON public.defense_request_status_logs(updated_at);

-- Row Level Security for status logs
ALTER TABLE public.defense_request_status_logs ENABLE ROW LEVEL SECURITY;

-- Users can read logs for requests they have access to
CREATE POLICY "Users can read accessible logs" ON public.defense_request_status_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.defense_requests dr
            JOIN public.users u ON u.id = auth.uid()
            WHERE dr.id = defense_request_status_logs.defense_request_id
            AND (
                (u.role = 'Student' AND u.school_id = dr.school_id) OR
                (u.role IN ('Administrative Assistant', 'Coordinator', 'Dean'))
            )
        )
    );

-- Staff can insert logs
CREATE POLICY "Staff can insert logs" ON public.defense_request_status_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('Administrative Assistant', 'Coordinator', 'Dean')
        )
    );

-- ============================================================================
-- 8. CONVERSATIONS TABLE (Messaging system)
-- ============================================================================
CREATE TABLE public.conversations (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(255) NOT NULL DEFAULT 'private',
    title VARCHAR(255),
    participants JSONB NOT NULL,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX idx_conversations_participants ON public.conversations USING GIN(participants);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at);
CREATE INDEX idx_conversations_type ON public.conversations(type);

-- Row Level Security for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see conversations they participate in
CREATE POLICY "Users can see own conversations" ON public.conversations
    FOR SELECT USING (
        participants ? auth.uid()::text
    );

-- Users can update conversations they participate in
CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (
        participants ? auth.uid()::text
    );

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (
        participants ? auth.uid()::text
    );

-- ============================================================================
-- 9. MESSAGES TABLE (Individual messages)
-- ============================================================================
CREATE TABLE public.messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(255) NOT NULL DEFAULT 'text',
    metadata JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at);
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_type ON public.messages(type);

-- Row Level Security for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages in conversations they participate in
CREATE POLICY "Users can see conversation messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id
            AND conversations.participants ? auth.uid()::text
        )
    );

-- Users can send messages to conversations they participate in
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id
            AND conversations.participants ? auth.uid()::text
        )
    );

-- ============================================================================
-- 10. MESSAGE PARTICIPANTS TABLE (Conversation membership)
-- ============================================================================
CREATE TABLE public.message_participants (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Indexes for message participants
CREATE INDEX idx_participants_conversation_id ON public.message_participants(conversation_id);
CREATE INDEX idx_participants_user_id ON public.message_participants(user_id);

-- Row Level Security for message participants
ALTER TABLE public.message_participants ENABLE ROW LEVEL SECURITY;

-- Users can see their own participation records
CREATE POLICY "Users can see own participation" ON public.message_participants
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Users can update their own participation (like read timestamps)
CREATE POLICY "Users can update own participation" ON public.message_participants
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_defense_requests_updated_at BEFORE UPDATE ON public.defense_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_participants_updated_at BEFORE UPDATE ON public.message_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update conversation last_message_at when a message is added
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message_trigger 
    AFTER INSERT ON public.messages 
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for user profile with full name
CREATE VIEW public.user_profiles AS
SELECT 
    id,
    CONCAT_WS(' ', first_name, 
        CASE WHEN middle_name IS NOT NULL AND middle_name != '' 
             THEN LEFT(middle_name, 1) || '.' 
             ELSE '' END,
        last_name) AS full_name,
    first_name,
    middle_name,
    last_name,
    email,
    role,
    program,
    school_id,
    avatar,
    created_at,
    updated_at
FROM public.users;

-- View for defense requests with user info
CREATE VIEW public.defense_requests_with_users AS
SELECT 
    dr.*,
    CONCAT_WS(' ', dr.first_name, 
        CASE WHEN dr.middle_name IS NOT NULL AND dr.middle_name != '' 
             THEN LEFT(dr.middle_name, 1) || '.' 
             ELSE '' END,
        dr.last_name) AS student_name,
    updated_by_user.first_name || ' ' || updated_by_user.last_name AS updated_by_name,
    status_updated_by_user.first_name || ' ' || status_updated_by_user.last_name AS status_updated_by_name
FROM public.defense_requests dr
LEFT JOIN public.users updated_by_user ON dr.updated_by = updated_by_user.id
LEFT JOIN public.users status_updated_by_user ON dr.last_status_updated_by = status_updated_by_user.id;

-- View for conversation summaries
CREATE VIEW public.conversation_summaries AS
SELECT 
    c.id,
    c.type,
    c.title,
    c.participants,
    c.last_message_at,
    m.content AS last_message_content,
    u.first_name || ' ' || u.last_name AS last_message_sender,
    c.created_at,
    c.updated_at
FROM public.conversations c
LEFT JOIN public.messages m ON m.conversation_id = c.id 
    AND m.created_at = c.last_message_at
LEFT JOIN public.users u ON m.user_id = u.id;

-- ============================================================================
-- SAMPLE DATA INSERTION (Optional - for testing)
-- ============================================================================

-- Insert sample users
-- Note: In production, users will be managed through Supabase Auth
-- Password for all sample users is 'password123' (hashed with bcrypt)
INSERT INTO public.users (laravel_id, first_name, middle_name, last_name, email, password, role, program, school_id, email_verified_at)
VALUES 
    (1, 'John', 'M', 'Coordinator', 'coordinator@example.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Coordinator', 'Administration', 'COORD001', NOW()),
    (2, 'Jane', 'S', 'Student', 'student@example.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Computer Science', 'STU001', NOW()),
    (3, 'Robert', 'D', 'Dean', 'dean@example.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dean', 'Administration', 'DEAN001', NOW()),
    (4, 'Alice', 'R', 'Assistant', 'assistant@example.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrative Assistant', 'Administration', 'ASST001', NOW()),
    (5, 'Michael', 'T', 'Johnson', 'michael.johnson@example.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Mathematics', 'STU002', NOW()),
    (6, 'Sarah', 'L', 'Williams', 'sarah.williams@example.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Physics', 'STU003', NOW()),
    (7, 'David', 'K', 'Brown', 'david.brown@example.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Chemistry', 'STU004', NOW()),
    (8, 'Emily', 'J', 'Davis', 'emily.davis@example.com', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Biology', 'STU005', NOW());

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

/*
IMPORTANT SECURITY CONSIDERATIONS:

1. ROW LEVEL SECURITY (RLS) is enabled on all main tables
2. Policies are configured to ensure users can only access their own data
3. Staff roles have broader access as needed
4. All foreign key relationships are properly constrained
5. Sensitive operations are logged in audit tables

SUPABASE SPECIFIC FEATURES USED:

1. Built-in auth.uid() function for current user identification
2. JSONB columns for flexible data storage (participants, metadata)
3. GIN indexes for JSONB column performance
4. Automatic timestamp functions and triggers
5. Views for common query patterns

MIGRATION STEPS:

1. Run this script in your Supabase SQL editor
2. Configure Supabase Auth policies if needed
3. Set up storage buckets for file uploads (proof_of_payment, etc.)
4. Configure real-time subscriptions for messaging
5. Update your Laravel application to use Supabase client

POST-MIGRATION TASKS:

1. Test all RLS policies with different user roles
2. Verify foreign key constraints
3. Test messaging system with real-time updates
4. Configure backup and maintenance schedules
5. Set up monitoring and alerting
*/
