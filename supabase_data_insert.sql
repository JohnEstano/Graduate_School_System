-- Insert Users Data into Supabase
-- Run this in Supabase SQL Editor after running the migration

-- Insert your users with proper UUID generation
INSERT INTO public.users (laravel_id, first_name, middle_name, last_name, email, password, role, program, school_id, email_verified_at, remember_token, created_at, updated_at) VALUES 
(1, 'Academic', 'M.', 'Coordinator', 'aa@gmail.com', '$2y$12$JXo19asjRtJBFCrEuS3uNu.tdZJG9eYRuYqJlIQW3u20UO8zz3Nza', 'Administrative Assistant', 'Doctor of Philosophy in Education major in Information Technology Integration', '230000001047', NULL, NULL, '2025-08-10T05:15:44.000000Z', '2025-08-10T05:15:44.000000Z'),
(2, 'Student', 'M.', 'Account', 'student@test.com', '$2y$12$ZZYORc8uKUEsTErVztqk0ulOPqO2oJ.W9v8nXxue4vZB\/xFnqUMtC', 'Student', 'Master of Arts in Teaching College Physics', '230000001044', NULL, 'jmXrmmPUaiwHnxJgsxw74GCe5mINCPiW2UG2Sn4AtZaH8vlip5eqoagrCpcO', '2025-08-10T05:15:44.000000Z', '2025-08-10T05:15:44.000000Z')
ON CONFLICT (laravel_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    middle_name = EXCLUDED.middle_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    program = EXCLUDED.program,
    school_id = EXCLUDED.school_id,
    updated_at = EXCLUDED.updated_at;

-- Insert Defense Requests (sample - you'll need to add all 11 from your export)
-- This is just an example structure, you'll need to paste the actual data
INSERT INTO public.defense_requests (
    id, first_name, middle_name, last_name, school_id, program, thesis_title,
    date_of_defense, mode_defense, defense_type, advisers_endorsement,
    rec_endorsement, proof_of_payment, reference_no, defense_adviser,
    defense_chairperson, defense_panelist1, defense_panelist2, defense_panelist3,
    defense_panelist4, status, priority, created_at, updated_at
) VALUES 
-- You'll need to copy your defense_requests.json data here
-- Example format:
-- (1, 'John', 'M.', 'Doe', '123456', 'Computer Science', 'AI Research', '2025-12-01', 'Face-to-face', 'Final', 'endorsed.pdf', 'rec.pdf', 'payment.pdf', 'REF001', 'Dr. Smith', 'Dr. Johnson', 'Dr. Brown', NULL, NULL, NULL, 'Pending', 'Medium', NOW(), NOW())

-- Add more INSERT statements here based on your exported JSON files
-- Replace this comment with actual data from your JSON exports

-- Verify the data was inserted (run these separately after the inserts)
-- SELECT 'Users inserted:' as info, COUNT(*) as count FROM public.users
-- UNION ALL
-- SELECT 'Defense requests inserted:' as info, COUNT(*) as count FROM public.defense_requests;
