-- ============================================================================
-- Fix Delivery Page - Enable User JOIN for Admins
-- ============================================================================
-- Description: Fixes RLS policies to allow admin users to JOIN packages with users
-- Issue: Delivery page getting "pkg.users is null" error
-- Root Cause: RLS policies blocking the packages->users JOIN
-- ============================================================================

-- ============================================================================
-- FIX: Add policy to allow admins to read ALL users when joining
-- ============================================================================

-- This policy is needed specifically for JOINs in admin queries
-- Admins need to see user details (suite_number, name, email) when fetching packages
DROP POLICY IF EXISTS "admins_can_view_all_users" ON public.users;

-- Use a helper function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "admins_can_view_all_users"
ON public.users
FOR SELECT
TO authenticated
USING (is_admin());

-- ============================================================================
-- VERIFICATION - Test the query pattern used by Delivery page
-- ============================================================================

-- Test query to verify JOINs work (similar to what Delivery.tsx does)
SELECT 
    '🔍 Testing packages->users JOIN for delivery page...' AS test;

SELECT 
    p.id,
    p.package_id,
    p.tracking_number,
    p.user_id,
    u.suite_number,
    u.first_name,
    u.last_name,
    u.email,
    u.phone_number
FROM packages p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.status = 'arrived'
LIMIT 5;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed delivery page user JOIN issue!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 What was fixed:';
    RAISE NOTICE '  • Added admins_can_view_all_users policy';
    RAISE NOTICE '  • Admins can now JOIN packages with users';
    RAISE NOTICE '  • Delivery page will now show user details';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Delivery page should now work correctly!';
    RAISE NOTICE '   Test by refreshing the Delivery page';
END;
$$;
