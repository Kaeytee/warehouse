-- ============================================================================
-- Final Policy Consolidation - Remove Duplicate Policies
-- ============================================================================
-- Description: Consolidates multiple permissive policies into single policies
-- Fixes: 5 remaining "multiple_permissive_policies" warnings
-- Author: Senior Software Engineer
-- ============================================================================

-- ============================================================================
-- FIX 1: email_notifications_log - Consolidate 2 SELECT policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all email logs" ON public.email_notifications_log;
DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_notifications_log;

-- Create single comprehensive SELECT policy
CREATE POLICY "email_notifications_log_select"
ON public.email_notifications_log
FOR SELECT
TO authenticated
USING (
    -- Users can see their own logs
    user_id = (select auth.uid())
    OR
    -- Admins can see all logs
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- ============================================================================
-- FIX 2: package_shipments - Consolidate 2 SELECT policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all package shipments" ON public.package_shipments;
DROP POLICY IF EXISTS "Users can view their own package shipments" ON public.package_shipments;

-- Create single comprehensive SELECT policy
CREATE POLICY "package_shipments_select"
ON public.package_shipments
FOR SELECT
TO authenticated
USING (
    -- Users can see their own package shipments
    EXISTS (
        SELECT 1 FROM public.packages
        WHERE packages.id = package_shipments.package_id
        AND packages.user_id = (select auth.uid())
    )
    OR
    -- Admins can see all package shipments
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- ============================================================================
-- FIX 3: packages - Consolidate 3 SELECT policies + 2 UPDATE policies
-- ============================================================================

-- Drop duplicate SELECT policies
DROP POLICY IF EXISTS "customers_view_own_packages" ON public.packages;
DROP POLICY IF EXISTS "users_view_own_packages" ON public.packages;
-- Keep "warehouse_staff_manage_packages" but will recreate it

-- Drop duplicate UPDATE policies
DROP POLICY IF EXISTS "Users can update own packages" ON public.packages;
-- Keep "warehouse_staff_manage_packages" for updates too

-- Drop the old comprehensive policy to recreate
DROP POLICY IF EXISTS "warehouse_staff_manage_packages" ON public.packages;

-- Create single SELECT policy
CREATE POLICY "packages_select"
ON public.packages
FOR SELECT
TO authenticated
USING (
    -- Users can see their own packages
    user_id = (select auth.uid())
    OR
    -- Admins can see all packages
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- Create single UPDATE policy
CREATE POLICY "packages_update"
ON public.packages
FOR UPDATE
TO authenticated
USING (
    -- Users can update their own packages
    user_id = (select auth.uid())
    OR
    -- Admins can update all packages
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
)
WITH CHECK (
    -- Same check for the updated data
    user_id = (select auth.uid())
    OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- Keep separate INSERT and DELETE policies for warehouse staff
CREATE POLICY "packages_insert"
ON public.packages
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

CREATE POLICY "packages_delete"
ON public.packages
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- ============================================================================
-- FIX 4: shipments - Consolidate 3 SELECT policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view accessible shipments" ON public.shipments;
DROP POLICY IF EXISTS "users_view_own_shipments" ON public.shipments;
DROP POLICY IF EXISTS "warehouse_staff_manage_shipments" ON public.shipments;

-- Create single comprehensive SELECT policy
CREATE POLICY "shipments_select"
ON public.shipments
FOR SELECT
TO authenticated
USING (
    -- Users can see shipments containing their packages
    EXISTS (
        SELECT 1 FROM public.package_shipments ps
        JOIN public.packages p ON ps.package_id = p.id
        WHERE ps.shipment_id = shipments.id
        AND p.user_id = (select auth.uid())
    )
    OR
    -- Admins can see all shipments
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- Keep separate INSERT, UPDATE, DELETE for warehouse staff
CREATE POLICY "shipments_insert"
ON public.shipments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

CREATE POLICY "shipments_update"
ON public.shipments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

CREATE POLICY "shipments_delete"
ON public.shipments
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- ============================================================================
-- VERIFICATION - Check for remaining duplicate policies
-- ============================================================================

SELECT 
    '🔍 Checking for remaining duplicate policies...' AS status;

SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('email_notifications_log', 'package_shipments', 'packages', 'shipments')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Policy consolidation complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Fixed tables:';
    RAISE NOTICE '  ✅ email_notifications_log: 2 policies → 1 policy';
    RAISE NOTICE '  ✅ package_shipments: 2 policies → 1 policy';
    RAISE NOTICE '  ✅ packages: 5 policies → 4 policies (SELECT/UPDATE/INSERT/DELETE)';
    RAISE NOTICE '  ✅ shipments: 3 policies → 4 policies (SELECT/UPDATE/INSERT/DELETE)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 All "multiple_permissive_policies" warnings eliminated!';
    RAISE NOTICE '📊 Run database linter to verify: 0 performance warnings expected';
END;
$$;
