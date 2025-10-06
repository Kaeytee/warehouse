-- Fix INSERT Permission for Authenticated Users
-- The 403 error shows authenticated users can't POST/INSERT to users table
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- ============================================
-- 1. TEMPORARILY DISABLE RLS TO FIX POLICIES
-- ============================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP ALL EXISTING POLICIES
-- ============================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.users';
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- ============================================
-- 3. CREATE PERMISSIVE POLICIES FOR AUTHENTICATED USERS
-- ============================================

-- Allow authenticated users to SELECT their own profile
CREATE POLICY "authenticated_select_own" ON public.users
    FOR SELECT 
    TO authenticated
    USING (id = auth.uid());

-- Allow authenticated users to INSERT their own profile (CRITICAL FOR 403 FIX)
CREATE POLICY "authenticated_insert_own" ON public.users
    FOR INSERT 
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Allow authenticated users to UPDATE their own profile
CREATE POLICY "authenticated_update_own" ON public.users
    FOR UPDATE 
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Allow service_role full access (for backend operations)
CREATE POLICY "service_role_full" ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow anon users to INSERT (for signup trigger)
CREATE POLICY "anon_insert_signup" ON public.users
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- ============================================
-- 4. RE-ENABLE RLS
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. TEST THE POLICIES
-- ============================================
SELECT 
    'POLICY_VERIFICATION' as check_type,
    policyname as policy_name,
    roles,
    cmd as command_type,
    permissive,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;

-- ============================================
-- 6. VERIFY USER EXISTS AND CAN BE ACCESSED
-- ============================================
SELECT 
    'USER_ACCESS_TEST' as check_type,
    id,
    email,
    first_name,
    last_name,
    suite_number,
    role,
    status
FROM public.users 
WHERE id = '93a81a79-d6aa-4c2d-8fe3-833f2f5c5b7f';

-- ============================================
-- 7. SHOW AUTH USER INFO
-- ============================================
SELECT 
    'AUTH_USER_INFO' as check_type,
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE id = '93a81a79-d6aa-4c2d-8fe3-833f2f5c5b7f';
