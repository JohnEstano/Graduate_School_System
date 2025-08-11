-- ============================================================================
-- Graduate School Management System - Supabase Migration (CORRECTED)
-- Generated on: August 10, 2025
-- Description: Complete database schema migration from Laravel to Supabase with INTEGER IDs
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USERS TABLE (Main user management) - Using INTEGER ID
-- ============================================================================
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
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
    user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
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
    last_status_updated_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
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

-- ============================================================================
-- 7. DEFENSE REQUEST STATUS LOGS (Audit trail)
-- ============================================================================
CREATE TABLE public.defense_request_status_logs (
    id BIGSERIAL PRIMARY KEY,
    defense_request_id BIGINT NOT NULL REFERENCES public.defense_requests(id) ON DELETE CASCADE,
    status VARCHAR(255) NOT NULL,
    priority VARCHAR(255),
    updated_by BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    remarks TEXT
);

-- Indexes for status logs
CREATE INDEX idx_status_logs_defense_request ON public.defense_request_status_logs(defense_request_id);
CREATE INDEX idx_status_logs_updated_by ON public.defense_request_status_logs(updated_by);
CREATE INDEX idx_status_logs_updated_at ON public.defense_request_status_logs(updated_at);

-- ============================================================================
-- 8. CONVERSATIONS TABLE (Messaging system)
-- ============================================================================
CREATE TABLE public.conversations (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(255) NOT NULL DEFAULT 'private',
    title VARCHAR(255),
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at);
CREATE INDEX idx_conversations_type ON public.conversations(type);

-- ============================================================================
-- 9. MESSAGES TABLE (Individual messages)
-- ============================================================================
CREATE TABLE public.messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(255) NOT NULL DEFAULT 'text',
    attachments JSON,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at);
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_type ON public.messages(type);
CREATE INDEX idx_messages_is_read ON public.messages(is_read);

-- ============================================================================
-- 10. MESSAGE PARTICIPANTS TABLE (Conversation membership)
-- ============================================================================
CREATE TABLE public.message_participants (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
