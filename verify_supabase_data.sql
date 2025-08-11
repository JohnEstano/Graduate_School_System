-- Run this AFTER importing the data to verify everything worked correctly
-- Copy and paste these queries one by one in Supabase SQL Editor

-- Check users table
SELECT 'Users inserted:' as info, COUNT(*) as count FROM public.users;

-- Check defense requests table  
SELECT 'Defense requests inserted:' as info, COUNT(*) as count FROM public.defense_requests;

-- Show all users
SELECT id, laravel_id, first_name, last_name, email, role FROM public.users;

-- Show all defense requests summary
SELECT id, first_name, last_name, school_id, defense_type, status, created_at 
FROM public.defense_requests 
ORDER BY created_at;

-- Check if the UUID triggers are working (this should show generated UUIDs)
SELECT id, laravel_id, first_name, last_name FROM public.users;
