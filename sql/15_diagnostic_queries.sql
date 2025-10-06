-- Diagnostic SQL Queries to Find User Profile Issues
-- Run these queries to identify the root cause of name display problems
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- 1. Check what's in auth.users table (user metadata from registration)
SELECT 
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    raw_user_meta_data->>'first_name' as meta_first_name,
    raw_user_meta_data->>'last_name' as meta_last_name,
    raw_user_meta_data->>'phone' as meta_phone,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check what's in public.users table (our profile data)
SELECT 
    id,
    email,
    first_name,
    last_name,
    phone_number,
    suite_number,
    role,
    status,
    email_verified,
    created_at,
    updated_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Join both tables to see the relationship and identify mismatches
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'first_name' as auth_first_name,
    au.raw_user_meta_data->>'last_name' as auth_last_name,
    pu.first_name as profile_first_name,
    pu.last_name as profile_last_name,
    pu.suite_number,
    pu.status,
    au.created_at as auth_created,
    pu.created_at as profile_created
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC 
LIMIT 5;

-- 4. Check for users with missing or incorrect profile data
SELECT 
    'Missing Profile' as issue_type,
    au.id,
    au.email,
    au.raw_user_meta_data->>'first_name' as should_be_first_name,
    au.raw_user_meta_data->>'last_name' as should_be_last_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL

UNION ALL

SELECT 
    'Empty Names' as issue_type,
    pu.id,
    pu.email,
    au.raw_user_meta_data->>'first_name' as should_be_first_name,
    au.raw_user_meta_data->>'last_name' as should_be_last_name
FROM public.users pu
JOIN auth.users au ON pu.id = au.id
WHERE (pu.first_name = '' OR pu.first_name IS NULL OR pu.first_name = 'User')
   OR (pu.last_name = '' OR pu.last_name IS NULL OR pu.last_name = 'Name')

UNION ALL

SELECT 
    'Metadata Missing' as issue_type,
    au.id,
    au.email,
    au.raw_user_meta_data->>'first_name' as should_be_first_name,
    au.raw_user_meta_data->>'last_name' as should_be_last_name
FROM auth.users au
WHERE (au.raw_user_meta_data->>'first_name' IS NULL OR au.raw_user_meta_data->>'first_name' = '')
   OR (au.raw_user_meta_data->>'last_name' IS NULL OR au.raw_user_meta_data->>'last_name' = '');

-- 5. Check if the handle_new_user trigger exists and is active
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 6. Check if generate_suite_number function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'generate_suite_number';

-- 7. Find your specific user (replace with your actual email)
-- REPLACE 'your-email@example.com' WITH YOUR ACTUAL EMAIL
SELECT 
    'Your User Data' as info,
    au.id,
    au.email,
    au.raw_user_meta_data,
    pu.first_name,
    pu.last_name,
    pu.phone_number,
    pu.suite_number,
    pu.status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'your-email@example.com';  -- CHANGE THIS TO YOUR EMAIL
