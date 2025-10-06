-- COMPREHENSIVE TRIGGER EXECUTION DIAGNOSTIC
-- This query checks if the trigger is working and extracting metadata properly

-- 1. Check if trigger exists and is active
SELECT 
    'TRIGGER STATUS' as check_type,
    tgname as trigger_name,
    tgenabled as enabled,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- 2. Check if handle_new_user function exists
SELECT 
    'FUNCTION STATUS' as check_type,
    proname as function_name,
    prosrc as function_source_snippet
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Check recent auth.users entries with their metadata
SELECT 
    'AUTH USERS METADATA' as check_type,
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data,
    -- Extract specific fields from metadata
    raw_user_meta_data->>'first_name' as meta_first_name,
    raw_user_meta_data->>'last_name' as meta_last_name,
    raw_user_meta_data->>'phone_number' as meta_phone,
    raw_user_meta_data->>'street_address' as meta_street,
    raw_user_meta_data->>'city' as meta_city,
    raw_user_meta_data->>'country' as meta_country,
    raw_user_meta_data->>'postal_code' as meta_postal
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check corresponding public.users entries
SELECT 
    'PUBLIC USERS PROFILE' as check_type,
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.phone_number,
    u.street_address,
    u.city,
    u.country,
    u.postal_code,
    u.suite_number,
    u.status,
    u.created_at,
    au.created_at as auth_created_at,
    CASE 
        WHEN u.id IS NULL THEN 'MISSING PROFILE'
        WHEN u.first_name = 'User' AND u.last_name = 'Name' THEN 'DEFAULT VALUES'
        WHEN u.street_address IS NULL THEN 'MISSING ADDRESS'
        ELSE 'COMPLETE PROFILE'
    END as profile_status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC 
LIMIT 5;

-- 5. Check for orphaned auth users (no corresponding profile)
SELECT 
    'ORPHANED AUTH USERS' as check_type,
    COUNT(*) as orphaned_count,
    STRING_AGG(au.email, ', ') as orphaned_emails
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- 6. Check user_preferences creation
SELECT 
    'USER PREFERENCES' as check_type,
    COUNT(*) as total_preferences,
    COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END) as with_profiles,
    COUNT(CASE WHEN u.id IS NULL THEN 1 END) as orphaned_preferences
FROM user_preferences up
LEFT JOIN public.users u ON up.user_id = u.id;

-- 7. Test metadata extraction manually
SELECT 
    'METADATA EXTRACTION TEST' as check_type,
    au.id,
    au.email,
    -- Test the exact extraction logic from the trigger
    COALESCE(au.raw_user_meta_data->>'first_name', 'User') as extracted_first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', 'Name') as extracted_last_name,
    COALESCE(au.raw_user_meta_data->>'phone_number', NULL) as extracted_phone,
    COALESCE(au.raw_user_meta_data->>'street_address', NULL) as extracted_street,
    COALESCE(au.raw_user_meta_data->>'city', NULL) as extracted_city,
    COALESCE(au.raw_user_meta_data->>'country', NULL) as extracted_country,
    COALESCE(au.raw_user_meta_data->>'postal_code', NULL) as extracted_postal,
    -- Compare with actual profile data
    u.first_name as profile_first_name,
    u.last_name as profile_last_name,
    u.phone_number as profile_phone,
    u.street_address as profile_street,
    u.city as profile_city,
    u.country as profile_country,
    u.postal_code as profile_postal
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC 
LIMIT 3;

-- 8. Check PostgreSQL logs for trigger errors (if accessible)
-- Note: This might not work depending on log configuration
SELECT 
    'TRIGGER ERROR CHECK' as check_type,
    'Check PostgreSQL logs for handle_new_user errors' as instruction,
    'Look for: ERROR or LOG messages containing "handle_new_user"' as details;

-- 9. Summary diagnosis
SELECT 
    'DIAGNOSIS SUMMARY' as check_type,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
        THEN 'TRIGGER MISSING'
        WHEN EXISTS (SELECT 1 FROM auth.users au LEFT JOIN public.users u ON au.id = u.id WHERE u.id IS NULL)
        THEN 'TRIGGER NOT EXECUTING'
        WHEN EXISTS (SELECT 1 FROM public.users WHERE first_name = 'User' AND last_name = 'Name')
        THEN 'METADATA NOT EXTRACTED'
        ELSE 'TRIGGER WORKING'
    END as diagnosis,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.users) as total_profile_users,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.users u ON au.id = u.id WHERE u.id IS NULL) as missing_profiles;

-- Instructions for running this diagnostic:
-- 1. Copy this entire query
-- 2. Run it in your Supabase SQL Editor
-- 3. Review each section to identify where the issue occurs
-- 4. Pay special attention to:
--    - Trigger status (should be enabled)
--    - Orphaned auth users (should be 0)
--    - Metadata extraction test (should match profile data)
--    - Diagnosis summary (should show root cause)
