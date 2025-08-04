-- Supabase Data Import Script
-- Run this after executing supabase_migration.sql
-- This script imports data from JSON files exported from Laravel

-- Helper function to insert users
CREATE OR REPLACE FUNCTION import_users_from_json(json_data jsonb)
RETURNS INTEGER AS $$
DECLARE
    user_record jsonb;
    inserted_count INTEGER := 0;
BEGIN
    FOR user_record IN SELECT * FROM jsonb_array_elements(json_data)
    LOOP
        INSERT INTO auth.users (
            id,
            email,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
        ) VALUES (
            gen_random_uuid(),
            (user_record->>'email')::text,
            CASE 
                WHEN user_record->>'email_verified_at' IS NOT NULL 
                THEN (user_record->>'email_verified_at')::timestamptz 
                ELSE NULL 
            END,
            (user_record->>'created_at')::timestamptz,
            (user_record->>'updated_at')::timestamptz,
            '{}',
            jsonb_build_object(
                'first_name', user_record->>'first_name',
                'middle_name', user_record->>'middle_name',
                'last_name', user_record->>'last_name',
                'role', user_record->>'role',
                'program', user_record->>'program',
                'school_id', user_record->>'school_id'
            ),
            false,
            'authenticated'
        ) ON CONFLICT (email) DO NOTHING;
        
        -- Insert into public.users table
        INSERT INTO public.users (
            id,
            first_name,
            middle_name,
            last_name,
            email,
            email_verified_at,
            password,
            role,
            program,
            school_id,
            avatar,
            remember_token,
            created_at,
            updated_at
        ) VALUES (
            (user_record->>'id')::bigint,
            user_record->>'first_name',
            user_record->>'middle_name',
            user_record->>'last_name',
            user_record->>'email',
            CASE 
                WHEN user_record->>'email_verified_at' IS NOT NULL 
                THEN (user_record->>'email_verified_at')::timestamptz 
                ELSE NULL 
            END,
            user_record->>'password',
            user_record->>'role',
            user_record->>'program',
            user_record->>'school_id',
            user_record->>'avatar',
            user_record->>'remember_token',
            (user_record->>'created_at')::timestamptz,
            (user_record->>'updated_at')::timestamptz
        ) ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            middle_name = EXCLUDED.middle_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            email_verified_at = EXCLUDED.email_verified_at,
            role = EXCLUDED.role,
            program = EXCLUDED.program,
            school_id = EXCLUDED.school_id,
            avatar = EXCLUDED.avatar,
            updated_at = EXCLUDED.updated_at;
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Helper function to insert defense requests
CREATE OR REPLACE FUNCTION import_defense_requests_from_json(json_data jsonb)
RETURNS INTEGER AS $$
DECLARE
    request_record jsonb;
    inserted_count INTEGER := 0;
BEGIN
    FOR request_record IN SELECT * FROM jsonb_array_elements(json_data)
    LOOP
        INSERT INTO defense_requests (
            id,
            first_name,
            middle_name,
            last_name,
            school_id,
            program,
            thesis_title,
            date_of_defense,
            mode_defense,
            defense_type,
            advisers_endorsement,
            rec_endorsement,
            proof_of_payment,
            reference_no,
            defense_adviser,
            defense_chairperson,
            defense_panelist1,
            defense_panelist2,
            defense_panelist3,
            defense_panelist4,
            status,
            priority,
            last_status_updated_at,
            last_status_updated_by,
            updated_by,
            created_at,
            updated_at
        ) VALUES (
            (request_record->>'id')::bigint,
            request_record->>'first_name',
            request_record->>'middle_name',
            request_record->>'last_name',
            request_record->>'school_id',
            request_record->>'program',
            request_record->>'thesis_title',
            CASE 
                WHEN request_record->>'date_of_defense' IS NOT NULL 
                THEN (request_record->>'date_of_defense')::date 
                ELSE NULL 
            END,
            request_record->>'mode_defense',
            request_record->>'defense_type',
            request_record->>'advisers_endorsement',
            request_record->>'rec_endorsement',
            request_record->>'proof_of_payment',
            request_record->>'reference_no',
            request_record->>'defense_adviser',
            request_record->>'defense_chairperson',
            request_record->>'defense_panelist1',
            request_record->>'defense_panelist2',
            request_record->>'defense_panelist3',
            request_record->>'defense_panelist4',
            COALESCE(request_record->>'status', 'Pending'),
            COALESCE(request_record->>'priority', 'Medium'),
            CASE 
                WHEN request_record->>'last_status_updated_at' IS NOT NULL 
                THEN (request_record->>'last_status_updated_at')::timestamptz 
                ELSE NULL 
            END,
            CASE 
                WHEN request_record->>'last_status_updated_by' IS NOT NULL 
                THEN (request_record->>'last_status_updated_by')::bigint 
                ELSE NULL 
            END,
            CASE 
                WHEN request_record->>'updated_by' IS NOT NULL 
                THEN (request_record->>'updated_by')::bigint 
                ELSE NULL 
            END,
            (request_record->>'created_at')::timestamptz,
            (request_record->>'updated_at')::timestamptz
        ) ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            middle_name = EXCLUDED.middle_name,
            last_name = EXCLUDED.last_name,
            school_id = EXCLUDED.school_id,
            program = EXCLUDED.program,
            thesis_title = EXCLUDED.thesis_title,
            date_of_defense = EXCLUDED.date_of_defense,
            mode_defense = EXCLUDED.mode_defense,
            defense_type = EXCLUDED.defense_type,
            status = EXCLUDED.status,
            priority = EXCLUDED.priority,
            updated_at = EXCLUDED.updated_at;
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Helper function to insert conversations
CREATE OR REPLACE FUNCTION import_conversations_from_json(json_data jsonb)
RETURNS INTEGER AS $$
DECLARE
    conversation_record jsonb;
    inserted_count INTEGER := 0;
BEGIN
    FOR conversation_record IN SELECT * FROM jsonb_array_elements(json_data)
    LOOP
        INSERT INTO conversations (
            id,
            type,
            title,
            participants,
            last_message_at,
            created_at,
            updated_at
        ) VALUES (
            (conversation_record->>'id')::bigint,
            conversation_record->>'type',
            conversation_record->>'title',
            CASE 
                WHEN conversation_record->'participants' IS NOT NULL 
                THEN conversation_record->'participants'
                ELSE '[]'::jsonb
            END,
            CASE 
                WHEN conversation_record->>'last_message_at' IS NOT NULL 
                THEN (conversation_record->>'last_message_at')::timestamptz 
                ELSE NULL 
            END,
            (conversation_record->>'created_at')::timestamptz,
            (conversation_record->>'updated_at')::timestamptz
        ) ON CONFLICT (id) DO UPDATE SET
            type = EXCLUDED.type,
            title = EXCLUDED.title,
            participants = EXCLUDED.participants,
            last_message_at = EXCLUDED.last_message_at,
            updated_at = EXCLUDED.updated_at;
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Helper function to insert messages
CREATE OR REPLACE FUNCTION import_messages_from_json(json_data jsonb)
RETURNS INTEGER AS $$
DECLARE
    message_record jsonb;
    inserted_count INTEGER := 0;
BEGIN
    FOR message_record IN SELECT * FROM jsonb_array_elements(json_data)
    LOOP
        INSERT INTO messages (
            id,
            conversation_id,
            user_id,
            content,
            type,
            metadata,
            read_at,
            created_at,
            updated_at
        ) VALUES (
            (message_record->>'id')::bigint,
            (message_record->>'conversation_id')::bigint,
            (message_record->>'user_id')::bigint,
            message_record->>'content',
            COALESCE(message_record->>'type', 'text'),
            CASE 
                WHEN message_record->'metadata' IS NOT NULL 
                THEN message_record->'metadata'
                ELSE '{}'::jsonb
            END,
            CASE 
                WHEN message_record->>'read_at' IS NOT NULL 
                THEN (message_record->>'read_at')::timestamptz 
                ELSE NULL 
            END,
            (message_record->>'created_at')::timestamptz,
            (message_record->>'updated_at')::timestamptz
        ) ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            type = EXCLUDED.type,
            metadata = EXCLUDED.metadata,
            read_at = EXCLUDED.read_at,
            updated_at = EXCLUDED.updated_at;
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to import all data from JSON
CREATE OR REPLACE FUNCTION import_all_data()
RETURNS TABLE(
    table_name text,
    records_imported integer,
    status text
) AS $$
DECLARE
    users_json jsonb;
    defense_requests_json jsonb;
    conversations_json jsonb;
    messages_json jsonb;
    user_count integer;
    request_count integer;
    conversation_count integer;
    message_count integer;
BEGIN
    -- Note: You'll need to manually paste the JSON data here or use a file upload method
    -- For now, this is a template. Replace with actual JSON data from your export
    
    -- Users import (replace with actual JSON data)
    users_json := '[]'::jsonb; -- Replace with users.json content
    IF jsonb_array_length(users_json) > 0 THEN
        user_count := import_users_from_json(users_json);
        table_name := 'users';
        records_imported := user_count;
        status := 'success';
        RETURN NEXT;
    END IF;
    
    -- Defense requests import (replace with actual JSON data)
    defense_requests_json := '[]'::jsonb; -- Replace with defense_requests.json content
    IF jsonb_array_length(defense_requests_json) > 0 THEN
        request_count := import_defense_requests_from_json(defense_requests_json);
        table_name := 'defense_requests';
        records_imported := request_count;
        status := 'success';
        RETURN NEXT;
    END IF;
    
    -- Conversations import (replace with actual JSON data)
    conversations_json := '[]'::jsonb; -- Replace with conversations.json content
    IF jsonb_array_length(conversations_json) > 0 THEN
        conversation_count := import_conversations_from_json(conversations_json);
        table_name := 'conversations';
        records_imported := conversation_count;
        status := 'success';
        RETURN NEXT;
    END IF;
    
    -- Messages import (replace with actual JSON data)
    messages_json := '[]'::jsonb; -- Replace with messages.json content
    IF jsonb_array_length(messages_json) > 0 THEN
        message_count := import_messages_from_json(messages_json);
        table_name := 'messages';
        records_imported := message_count;
        status := 'success';
        RETURN NEXT;
    END IF;
    
END;
$$ LANGUAGE plpgsql;

-- Manual import examples (run these individually with your JSON data):

/*
-- Example 1: Import users
SELECT import_users_from_json('[
    {
        "id": 1,
        "first_name": "John",
        "middle_name": "M",
        "last_name": "Doe",
        "email": "john@example.com",
        "email_verified_at": "2024-01-01T00:00:00Z",
        "password": "$2y$12$hashedpassword",
        "role": "student",
        "program": "Computer Science",
        "school_id": "2023001",
        "avatar": null,
        "remember_token": null,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
]'::jsonb);

-- Example 2: Import defense requests
SELECT import_defense_requests_from_json('[
    {
        "id": 1,
        "first_name": "John",
        "middle_name": "M",
        "last_name": "Doe",
        "school_id": "2023001",
        "program": "Computer Science",
        "thesis_title": "AI in Education",
        "date_of_defense": "2024-06-15",
        "mode_defense": "Face-to-face",
        "defense_type": "Final Defense",
        "status": "Pending",
        "priority": "Medium",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
]'::jsonb);
*/

-- Cleanup functions (remove after import is complete)
-- DROP FUNCTION IF EXISTS import_users_from_json(jsonb);
-- DROP FUNCTION IF EXISTS import_defense_requests_from_json(jsonb);
-- DROP FUNCTION IF EXISTS import_conversations_from_json(jsonb);
-- DROP FUNCTION IF EXISTS import_messages_from_json(jsonb);
-- DROP FUNCTION IF EXISTS import_all_data();
