-- =====================================================
-- DEBUG USER PROFILE CREATION QUERY
-- =====================================================
-- Run this in Supabase SQL Editor to debug profile creation issues
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-09-26
-- =====================================================

-- Step 1: Check if the trigger function exists and is properly defined
SELECT 
    p.proname as function_name,
    p.prosrc as function_source,
    p.provolatile as volatility,
    p.prosecdef as security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'handle_new_user';

-- Step 2: Check if the trigger exists on auth.users table
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    p.proname as function_name,
    c.relname as table_name,
    n.nspname as schema_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'users' 
AND n.nspname = 'auth';

-- Step 3: Check current users table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 4: Check existing users and their data completeness
SELECT 
    id,
    email,
    first_name,
    last_name,
    phone_number,
    street_address,
    city,
    country,
    postal_code,
    suite_number,
    status,
    email_verified,
    created_at,
    CASE 
        WHEN first_name IS NULL OR first_name = '' THEN 'MISSING'
        ELSE 'OK'
    END as first_name_status,
    CASE 
        WHEN last_name IS NULL OR last_name = '' THEN 'MISSING'
        ELSE 'OK'
    END as last_name_status,
    CASE 
        WHEN phone_number IS NULL OR phone_number = '' THEN 'MISSING'
        ELSE 'OK'
    END as phone_status
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: Check auth.users table to see raw metadata
SELECT 
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    user_metadata,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Step 6: Test the suite number generation function
SELECT generate_suite_number() as test_suite_number;

-- Step 7: Check user_preferences table
SELECT 
    up.user_id,
    u.email,
    up.language,
    up.email_notifications,
    up.created_at as preferences_created
FROM user_preferences up
LEFT JOIN users u ON up.user_id = u.id
ORDER BY up.created_at DESC
LIMIT 10;

-- Step 8: Check for any errors in PostgreSQL logs (if accessible)
-- This query might not work depending on your Supabase permissions
SELECT 
    'Check PostgreSQL logs for trigger errors' as note,
    'Look for messages containing: handle_new_user' as search_term;

-- Step 9: Test trigger manually (CAREFUL - this creates a test user)
-- Uncomment and modify the email to test:
/*
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Simulate what happens when Supabase Auth creates a user
    INSERT INTO auth.users (
        id,
        email,
        raw_user_meta_data,
        email_confirmed_at,
        created_at,
        updated_at
    ) VALUES (
        test_user_id,
        'test-debug@example.com',
        '{"first_name": "Test", "last_name": "User", "phone_number": "+1234567890", "street_address": "123 Test St", "city": "Test City", "country": "USA", "postal_code": "12345"}'::jsonb,
        NOW(),
        NOW(),
        NOW()
    );
    
    -- Check if the trigger created the profile
    RAISE NOTICE 'Test user created with ID: %', test_user_id;
END $$;
*/

-- Step 10: Summary query to identify the issue
SELECT 
    'DIAGNOSIS SUMMARY' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_new_user')
        THEN '✅ Trigger function exists'
        ELSE '❌ Trigger function missing'
    END as trigger_function_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE c.relname = 'users' AND n.nspname = 'auth')
        THEN '✅ Trigger exists on auth.users'
        ELSE '❌ Trigger missing on auth.users'
    END as trigger_status,
    (SELECT COUNT(*) FROM public.users WHERE first_name IS NULL OR first_name = '') as users_with_empty_names,
    (SELECT COUNT(*) FROM public.users) as total_users;

-- =====================================================
-- INSTRUCTIONS:
-- =====================================================
-- 1. Copy and paste this entire query into Supabase SQL Editor
-- 2. Run it and share the results
-- 3. Pay special attention to:
--    - Step 2: Trigger existence
--    - Step 4: User data completeness  
--    - Step 5: Raw metadata from auth.users
--    - Step 10: Diagnosis summary
-- =====================================================
