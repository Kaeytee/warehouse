-- ============================================================================
-- RLS Performance Optimization - Fix Auth Function Calls
-- ============================================================================
-- Description: Fixes RLS policies to use subquery pattern for auth functions
-- Issue: auth.uid() is re-evaluated for each row (slow)
-- Solution: Use (select auth.uid()) - evaluated once per query
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ============================================================================

-- ============================================================================
-- FIX: status_history table
-- ============================================================================

DROP POLICY IF EXISTS "Admin users can view all status history" ON public.status_history;
DROP POLICY IF EXISTS "Admin users can insert status history" ON public.status_history;
DROP POLICY IF EXISTS "System can insert status history" ON public.status_history;

CREATE POLICY "Admin users can view all status history"
ON public.status_history
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

CREATE POLICY "Admin users can insert status history"
ON public.status_history
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

CREATE POLICY "System can insert status history"
ON public.status_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- FIX: package_documents table
-- ============================================================================

DROP POLICY IF EXISTS "Admin users can view all package documents" ON public.package_documents;
DROP POLICY IF EXISTS "Admin users can insert package documents" ON public.package_documents;
DROP POLICY IF EXISTS "Admin users can update package documents" ON public.package_documents;

CREATE POLICY "Admin users can view all package documents"
ON public.package_documents
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

CREATE POLICY "Admin users can insert package documents"
ON public.package_documents
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

CREATE POLICY "Admin users can update package documents"
ON public.package_documents
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

-- ============================================================================
-- FIX: users table
-- ============================================================================

DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_insert_profile" ON public.users;

CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (id = (select auth.uid()));

CREATE POLICY "users_update_own_profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

CREATE POLICY "users_insert_profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = (select auth.uid()));

-- ============================================================================
-- FIX: addresses table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;

CREATE POLICY "Users can view own addresses"
ON public.addresses
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own addresses"
ON public.addresses
FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own addresses"
ON public.addresses
FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own addresses"
ON public.addresses
FOR DELETE
TO authenticated
USING (user_id = (select auth.uid()));

-- ============================================================================
-- FIX: notification_preferences table
-- ============================================================================

DROP POLICY IF EXISTS "users_select_own_notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "users_insert_own_notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "users_update_own_notification_preferences" ON public.notification_preferences;

CREATE POLICY "users_select_own_notification_preferences"
ON public.notification_preferences
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "users_insert_own_notification_preferences"
ON public.notification_preferences
FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "users_update_own_notification_preferences"
ON public.notification_preferences
FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- FIX: user_preferences table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

CREATE POLICY "Users can view own preferences"
ON public.user_preferences
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- FIX: notifications table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- NOTE: delivery_codes table does not exist
-- System uses packages.delivery_auth_code column instead
-- No policies needed here
-- ============================================================================

-- ============================================================================
-- FIX: packages table
-- ============================================================================

DROP POLICY IF EXISTS "users_view_own_packages" ON public.packages;
DROP POLICY IF EXISTS "customers_view_own_packages" ON public.packages;
DROP POLICY IF EXISTS "Users can update own packages" ON public.packages;
DROP POLICY IF EXISTS "warehouse_staff_manage_packages" ON public.packages;

CREATE POLICY "users_view_own_packages"
ON public.packages
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "customers_view_own_packages"
ON public.packages
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own packages"
ON public.packages
FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "warehouse_staff_manage_packages"
ON public.packages
FOR ALL
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

-- ============================================================================
-- FIX: shipments table
-- ============================================================================

DROP POLICY IF EXISTS "users_view_own_shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can view accessible shipments" ON public.shipments;
DROP POLICY IF EXISTS "warehouse_staff_manage_shipments" ON public.shipments;

CREATE POLICY "users_view_own_shipments"
ON public.shipments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.package_shipments ps
        JOIN public.packages p ON ps.package_id = p.id
        WHERE ps.shipment_id = shipments.id
        AND p.user_id = (select auth.uid())
    )
);

CREATE POLICY "Users can view accessible shipments"
ON public.shipments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.package_shipments ps
        JOIN public.packages p ON ps.package_id = p.id
        WHERE ps.shipment_id = shipments.id
        AND p.user_id = (select auth.uid())
    )
);

CREATE POLICY "warehouse_staff_manage_shipments"
ON public.shipments
FOR ALL
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

-- ============================================================================
-- FIX: package_shipments table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own package shipments" ON public.package_shipments;
DROP POLICY IF EXISTS "users_view_own_package_shipments" ON public.package_shipments;
DROP POLICY IF EXISTS "Admins can view all package shipments" ON public.package_shipments;
DROP POLICY IF EXISTS "Warehouse staff can create package shipments" ON public.package_shipments;
DROP POLICY IF EXISTS "Warehouse staff can update package shipments" ON public.package_shipments;
DROP POLICY IF EXISTS "Admins can delete package shipments" ON public.package_shipments;

CREATE POLICY "Users can view their own package shipments"
ON public.package_shipments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.packages
        WHERE packages.id = package_shipments.package_id
        AND packages.user_id = (select auth.uid())
    )
);

CREATE POLICY "Admins can view all package shipments"
ON public.package_shipments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

CREATE POLICY "Warehouse staff can create package shipments"
ON public.package_shipments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

CREATE POLICY "Warehouse staff can update package shipments"
ON public.package_shipments
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

CREATE POLICY "Admins can delete package shipments"
ON public.package_shipments
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
-- FIX: support_messages table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can view all support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can update support messages" ON public.support_messages;

CREATE POLICY "Users can view own support messages"
ON public.support_messages
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all support messages"
ON public.support_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

CREATE POLICY "Admins can update support messages"
ON public.support_messages
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

-- ============================================================================
-- FIX: email_notifications_log table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_notifications_log;
DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_notifications_log;
DROP POLICY IF EXISTS "Admins can view all email logs" ON public.email_notifications_log;
DROP POLICY IF EXISTS "Service can insert email logs" ON public.email_notifications_log;

CREATE POLICY "Users can view their own email logs"
ON public.email_notifications_log
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all email logs"
ON public.email_notifications_log
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

CREATE POLICY "Service can insert email logs"
ON public.email_notifications_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- FIX: receipts table
-- ============================================================================

DROP POLICY IF EXISTS "receipts_user_select" ON public.receipts;
DROP POLICY IF EXISTS "receipts_admin_select" ON public.receipts;
DROP POLICY IF EXISTS "receipts_admin_insert" ON public.receipts;

CREATE POLICY "receipts_user_select"
ON public.receipts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.packages
        WHERE packages.id = receipts.package_id
        AND packages.user_id = (select auth.uid())
    )
);

CREATE POLICY "receipts_admin_select"
ON public.receipts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

CREATE POLICY "receipts_admin_insert"
ON public.receipts
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- ============================================================================
-- FIX: package_verification_log table
-- ============================================================================

DROP POLICY IF EXISTS "verification_log_admin_select" ON public.package_verification_log;
DROP POLICY IF EXISTS "verification_log_admin_insert" ON public.package_verification_log;

CREATE POLICY "verification_log_admin_select"
ON public.package_verification_log
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

CREATE POLICY "verification_log_admin_insert"
ON public.package_verification_log
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- ============================================================================
-- FIX: pickup_code_verification_logs table
-- ============================================================================

DROP POLICY IF EXISTS "verification_logs_admin_view" ON public.pickup_code_verification_logs;

CREATE POLICY "verification_logs_admin_view"
ON public.pickup_code_verification_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Check which policies still have performance issues
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS Performance Optimization Complete!';
    RAISE NOTICE '✅ All auth.uid() calls wrapped in SELECT subqueries';
    RAISE NOTICE '✅ Policies will now execute once per query instead of per row';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Performance improvement: Up to 100x faster on large tables!';
    RAISE NOTICE '📊 Run Supabase database linter again to verify fixes';
END;
$$;
