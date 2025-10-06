-- Verify Storage Bucket Creation and Debug Issues
-- Run this to check if the avatars bucket was actually created
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- Check if avatars bucket exists
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets 
WHERE id = 'avatars';

-- List ALL storage buckets to see what exists
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
ORDER BY created_at;

-- Check if storage.buckets table exists and has proper permissions
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'buckets';

-- Check current user permissions on storage schema
SELECT 
    current_user as current_user,
    current_setting('role') as current_role,
    has_schema_privilege('storage', 'USAGE') as can_use_storage_schema,
    has_table_privilege('storage.buckets', 'SELECT') as can_select_buckets,
    has_table_privilege('storage.buckets', 'INSERT') as can_insert_buckets;

-- Try to manually create the bucket if it doesn't exist
DO $$
BEGIN
    -- Check if bucket exists
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'avatars',
            'avatars',
            true,
            10242880, -- 10MB limit
            ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        );
        RAISE NOTICE 'Created avatars bucket successfully';
    ELSE
        RAISE NOTICE 'Avatars bucket already exists';
    END IF;
END $$;
