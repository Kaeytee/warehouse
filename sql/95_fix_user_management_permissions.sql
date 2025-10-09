-- ============================================================================
-- Fix User Management Permissions
-- ============================================================================
-- Description: Add RLS policies to allow admins to update user accounts
-- Issue: User Management page can't deactivate/update users due to RLS blocking
-- Error: PGRST116 - Cannot coerce the result to a single JSON object (0 rows)
-- ============================================================================

-- ============================================================================
-- Add policy to allow admins to UPDATE users
-- ============================================================================

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "admins_can_update_users" ON public.users;

-- Use the is_admin() helper function to avoid infinite recursion
-- (This function was created in 93_fix_delivery_page_user_join.sql)
CREATE POLICY "admins_can_update_users"
ON public.users
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- Ensure admins can also INSERT users (for user creation)
-- ============================================================================

DROP POLICY IF EXISTS "admins_can_insert_users" ON public.users;

-- Use the is_admin() helper function to avoid infinite recursion
CREATE POLICY "admins_can_insert_users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all current policies on users table
SELECT 
    '📋 Current policies on users table:' AS info;

SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ User Management permissions fixed!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 What was fixed:';
    RAISE NOTICE '  • Added admins_can_update_users policy';
    RAISE NOTICE '  • Added admins_can_insert_users policy';
    RAISE NOTICE '  • Admins can now update user status and details';
    RAISE NOTICE '';
    RAISE NOTICE '📦 User Management should now work correctly!';
    RAISE NOTICE '   Test by activating/deactivating users';
END;
$$;
