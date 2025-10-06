-- Emergency Permission Fix - Grant Access to Authenticated Users
-- Fixes "permission denied for table users" error
-- 
-- @author Senior Software Engineer
-- @version 1.0.0

-- ============================================
-- 1. TEMPORARILY DISABLE RLS TO FIX PERMISSIONS
-- ============================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CREATE MISSING PROFILE FOR CURRENT USER
-- ============================================
-- Check if user exists in auth.users but not in public.users
DO $$
DECLARE
    auth_user_email TEXT;
    auth_user_meta JSONB;
    new_suite_number TEXT;
BEGIN
    -- Get user info from auth.users
    SELECT email, raw_user_meta_data 
    INTO auth_user_email, auth_user_meta
    FROM auth.users 
    WHERE id = '93a81a79-d6aa-4c2d-8fe3-833f2f5c5b7f';
    
    IF auth_user_email IS NOT NULL THEN
        -- Generate suite number
        new_suite_number := generate_suite_number();
        
        -- Create profile
        INSERT INTO public.users (
            id,
            email,
            first_name,
            last_name,
            suite_number,
            role,
            status,
            email_verified,
            created_at,
            updated_at
        ) VALUES (
            '93a81a79-d6aa-4c2d-8fe3-833f2f5c5b7f',
            auth_user_email,
            COALESCE(auth_user_meta->>'first_name', ''),
            COALESCE(auth_user_meta->>'last_name', ''),
            new_suite_number,
            'client',
            'active',
            true,
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created profile for user % with suite %', auth_user_email, new_suite_number;
    ELSE
        RAISE NOTICE 'User 93a81a79-d6aa-4c2d-8fe3-833f2f5c5b7f not found in auth.users';
    END IF;
END $$;

-- ============================================
-- 3. DROP ALL EXISTING POLICIES
-- ============================================
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "service_role_all" ON public.users;
DROP POLICY IF EXISTS "admin_access" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- ============================================
-- 4. CREATE SIMPLE, WORKING POLICIES
-- ============================================

-- Allow authenticated users to read their own profile
CREATE POLICY "authenticated_users_select_own" ON public.users
    FOR SELECT 
    TO authenticated
    USING (id = auth.uid());

-- Allow authenticated users to update their own profile
CREATE POLICY "authenticated_users_update_own" ON public.users
    FOR UPDATE 
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Allow authenticated users to insert their own profile
CREATE POLICY "authenticated_users_insert_own" ON public.users
    FOR INSERT 
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Allow service role full access
CREATE POLICY "service_role_full_access" ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow anon role to insert (for signup process)
CREATE POLICY "anon_insert_signup" ON public.users
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- ============================================
-- 5. RE-ENABLE RLS WITH WORKING POLICIES
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. VERIFY SETUP
-- ============================================
SELECT 
    'USER_PROFILE_CHECK' as check_type,
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.suite_number,
    u.role,
    u.status
FROM public.users u
WHERE u.id = '93a81a79-d6aa-4c2d-8fe3-833f2f5c5b7f';

SELECT 
    'POLICY_CHECK' as check_type,
    policyname as policy_name,
    roles,
    cmd as command_type
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;
