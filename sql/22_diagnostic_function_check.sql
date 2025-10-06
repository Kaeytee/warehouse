-- Comprehensive Diagnostic Query - Check All Function Behavior
-- Analyzes triggers, functions, and data creation patterns
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- ============================================
-- 1. CHECK ALL EXISTING USERS AND SUITE NUMBERS
-- ============================================
SELECT 
    'EXISTING_USERS' as check_type,
    id,
    email,
    first_name,
    last_name,
    suite_number,
    role,
    status,
    email_verified,
    created_at
FROM public.users 
ORDER BY created_at DESC;

-- ============================================
-- 2. CHECK ALL DATABASE FUNCTIONS
-- ============================================
SELECT 
    'DATABASE_FUNCTIONS' as check_type,
    routine_name as function_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%' 
OR routine_name LIKE '%suite%'
OR routine_name LIKE '%profile%'
ORDER BY routine_name;

-- ============================================
-- 3. CHECK ALL TRIGGERS ON USERS TABLE
-- ============================================
SELECT 
    'TRIGGERS' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- ============================================
-- 4. CHECK RLS POLICIES ON USERS TABLE
-- ============================================
SELECT 
    'RLS_POLICIES' as check_type,
    policyname as policy_name,
    permissive,
    roles,
    cmd as command_type,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;

-- ============================================
-- 5. CHECK AUTH.USERS TABLE (SUPABASE AUTH)
-- ============================================
SELECT 
    'AUTH_USERS' as check_type,
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 6. CHECK SUITE NUMBER SEQUENCE/GENERATION
-- ============================================
-- Check if sequence exists
SELECT 
    'SEQUENCES' as check_type,
    sequence_name,
    last_value,
    increment_by,
    max_value,
    min_value
FROM information_schema.sequences 
WHERE sequence_schema = 'public'
AND sequence_name LIKE '%suite%' 
OR sequence_name LIKE '%vc%';

-- ============================================
-- 7. CHECK CURRENT MAX SUITE NUMBER
-- ============================================
SELECT 
    'MAX_SUITE_NUMBER' as check_type,
    MAX(suite_number) as highest_suite_number,
    COUNT(*) as total_users_with_suites
FROM public.users 
WHERE suite_number IS NOT NULL;

-- ============================================
-- 8. TEST SUITE NUMBER GENERATION FUNCTION
-- ============================================
-- Test if generate_suite_number function exists and works
DO $$
DECLARE
    test_suite_number TEXT;
BEGIN
    -- Try to call the function if it exists
    BEGIN
        SELECT generate_suite_number() INTO test_suite_number;
        RAISE NOTICE 'SUITE_FUNCTION_TEST: Generated suite number: %', test_suite_number;
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE 'SUITE_FUNCTION_TEST: generate_suite_number function does not exist';
        WHEN OTHERS THEN
            RAISE NOTICE 'SUITE_FUNCTION_TEST: Error calling function: %', SQLERRM;
    END;
END $$;

-- ============================================
-- 9. CHECK FOR DUPLICATE SUITE NUMBERS
-- ============================================
SELECT 
    'DUPLICATE_SUITES' as check_type,
    suite_number,
    COUNT(*) as duplicate_count,
    array_agg(id) as user_ids,
    array_agg(email) as emails
FROM public.users 
WHERE suite_number IS NOT NULL
GROUP BY suite_number
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ============================================
-- 10. CHECK TABLE CONSTRAINTS
-- ============================================
SELECT 
    'TABLE_CONSTRAINTS' as check_type,
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users'
AND tc.table_schema = 'public'
ORDER BY constraint_type, constraint_name;
