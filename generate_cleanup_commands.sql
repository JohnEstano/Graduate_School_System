-- Simple Database Cleanup (Alternative approach)
-- Run this if the main cleanup script doesn't work completely

-- Get list of all tables in public schema
SELECT 'DROP TABLE IF EXISTS public.' || tablename || ' CASCADE;' as drop_command
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename != 'spatial_ref_sys'
ORDER BY tablename;

-- Get list of all functions to drop
SELECT 'DROP FUNCTION IF EXISTS public.' || routinename || '() CASCADE;' as drop_command
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
  AND routine_name NOT LIKE 'pg_%'
ORDER BY routinename;

-- Get list of all views to drop  
SELECT 'DROP VIEW IF EXISTS public.' || table_name || ' CASCADE;' as drop_command
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;
