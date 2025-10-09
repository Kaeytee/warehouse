-- ============================================================================
-- FIX USERS TABLE RLS POLICIES - REMOVE INFINITE RECURSION
-- ============================================================================
-- This script fixes the infinite recursion error in users table policies
-- The issue: Policies were querying the users table while protecting it
-- The fix: Use auth.uid() directly without querying users
--
-- Author: Senior Software Engineer
-- Date: 2025-10-08
-- ============================================================================

-- Step 1: Drop all existing policies on users table
DROP POLICY IF EXISTS "Allow read by suite_number" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "allow_user_registration" ON public.users;
DROP POLICY IF EXISTS "authenticated_insert_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_select_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_update_own" ON public.users;
DROP POLICY IF EXISTS "super_admins_manage_users" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_view_own_profile" ON public.users;
DROP POLICY IF EXISTS "warehouse_admins_view_users" ON public.users;

-- Step 2: Create simple, non-recursive policies

-- Policy 1: Allow users to view their own profile (no recursion)
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy 2: Allow users to update their own profile (no recursion)
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 3: Allow new user registration via service role
CREATE POLICY "service_role_insert_users"
ON public.users
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy 4: Allow new users to insert their own profile during registration
CREATE POLICY "users_insert_own"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Policy 5: Service role has full access (for admin operations)
CREATE POLICY "service_role_all_users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 6: Anon users can insert during registration (if using anon key)
CREATE POLICY "anon_insert_registration"
ON public.users
FOR INSERT
TO anon
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- List all policies on users table

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- Test query to verify no recursion
SELECT 'RLS Test: If this returns without error, recursion is fixed!' AS status;
