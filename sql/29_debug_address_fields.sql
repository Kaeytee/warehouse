-- Debug Address Fields Issue
-- Check if columns exist and data is accessible
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- ============================================
-- 1. CHECK IF ADDRESS COLUMNS EXIST
-- ============================================
SELECT 
    'COLUMN_EXISTS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('phone_number', 'street_address', 'city', 'country', 'postal_code')
ORDER BY column_name;

-- ============================================
-- 2. CHECK CURRENT USER DATA
-- ============================================
SELECT 
    'USER_DATA' as check_type,
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
    role,
    status
FROM public.users 
WHERE id = '93a81a79-d6aa-4c2d-8fe3-833f2f5c5b7f';

-- ============================================
-- 3. CHECK ALL USERS DATA (SAMPLE)
-- ============================================
SELECT 
    'ALL_USERS_SAMPLE' as check_type,
    id,
    email,
    first_name,
    last_name,
    phone_number,
    street_address,
    city,
    country,
    postal_code
FROM public.users 
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 4. TEST RLS POLICIES WITH SPECIFIC USER
-- ============================================
-- This will show if RLS is blocking access
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "93a81a79-d6aa-4c2d-8fe3-833f2f5c5b7f", "role": "authenticated"}';

SELECT 
    'RLS_TEST' as check_type,
    id,
    email,
    first_name,
    last_name,
    phone_number,
    street_address,
    city,
    country,
    postal_code
FROM public.users 
WHERE id = '93a81a79-d6aa-4c2d-8fe3-833f2f5c5b7f';

-- Reset role
RESET ROLE;

-- ============================================
-- 5. CHECK RLS POLICIES ON USERS TABLE
-- ============================================
SELECT 
    'RLS_POLICIES' as check_type,
    policyname as policy_name,
    cmd as command_type,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;
