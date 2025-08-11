-- Verification script to check your current Supabase database structure
-- Run this in Supabase SQL Editor to see what type your columns are

-- Check the structure of the users table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public' 
ORDER BY ordinal_position;

-- Check if users table exists and what data is in it
SELECT 'Users table data:' as info;
SELECT id, first_name, last_name, email, pg_typeof(id) as id_type 
FROM public.users 
LIMIT 5;

-- Check all tables in the database
SELECT 'All tables:' as info;
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name NOT LIKE 'pg_%'
ORDER BY table_name;
