-- =====================================================
-- VERIFY REGISTRATION FLOW AND DATA COMPLETENESS
-- =====================================================
-- Check what's happening with new user registrations
-- 
-- @author Senior Software Engineer
-- @version 1.0.0
-- @created 2025-09-26
-- =====================================================

-- Step 1: Check the most recent auth.users entries and their metadata
SELECT 
    'Recent Auth Users with Metadata' as section,
    au.id,
    au.email,
    au.raw_user_meta_data,
    au.created_at,
    CASE 
        WHEN pu.id IS NOT NULL THEN 'Profile Exists'
        ELSE 'Profile Missing'
    END as profile_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 5;

-- Step 2: Check what data is actually being sent in registration
SELECT 
    'Metadata Analysis' as section,
    email,
    raw_user_meta_data->>'first_name' as meta_first_name,
    raw_user_meta_data->>'last_name' as meta_last_name,
    raw_user_meta_data->>'phone_number' as meta_phone,
    raw_user_meta_data->>'street_address' as meta_address,
    raw_user_meta_data->>'city' as meta_city,
    raw_user_meta_data->>'country' as meta_country,
    raw_user_meta_data->>'postal_code' as meta_postal,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Step 3: Compare with what ended up in public.users
SELECT 
    'Public Users Data Completeness' as section,
    email,
    first_name,
    last_name,
    phone_number,
    street_address,
    city,
    country,
    postal_code,
    CASE 
        WHEN street_address IS NULL THEN 'NULL'
        WHEN street_address = '' THEN 'EMPTY_STRING'
        ELSE 'HAS_DATA'
    END as address_status,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: Identify the pattern
SELECT 
    'Data Pattern Analysis' as section,
    COUNT(*) as total_users,
    COUNT(CASE WHEN street_address IS NULL THEN 1 END) as null_addresses,
    COUNT(CASE WHEN street_address = '' THEN 1 END) as empty_addresses,
    COUNT(CASE WHEN street_address IS NOT NULL AND street_address != '' THEN 1 END) as valid_addresses
FROM public.users;

-- =====================================================
-- EXPECTED RESULTS ANALYSIS:
-- =====================================================
-- If registration form is not sending address data:
-- - raw_user_meta_data will only have first_name, last_name, phone_number
-- - street_address, city, country, postal_code will be NULL in metadata
-- - Trigger will insert NULL values for address fields
--
-- If registration form IS sending address data but it's empty:
-- - raw_user_meta_data will have empty strings for address fields
-- - Trigger will insert empty strings for address fields
-- =====================================================
