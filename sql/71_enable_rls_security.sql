-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON TABLES
-- ============================================================================
-- This script enables RLS on tables that have policies but RLS is disabled
-- Fixes security linter errors
--
-- Author: Senior Software Engineer
-- Date: 2025-10-08
-- ============================================================================

-- Enable RLS on users table
-- This table already has policies defined, we just need to enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email_notification_queue table
-- This ensures only authorized users can access email queue data
ALTER TABLE public.email_notification_queue ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email_notification_log table
-- This ensures only authorized users can access email logs
ALTER TABLE public.email_notification_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES FOR EMAIL NOTIFICATION TABLES
-- ============================================================================

-- Policy: Allow service role to manage email notification queue
CREATE POLICY "service_role_manage_email_queue"
ON public.email_notification_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated admins to view email queue
CREATE POLICY "admins_view_email_queue"
ON public.email_notification_queue
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('superadmin', 'admin', 'warehouse_admin')
  )
);

-- Policy: Allow service role to manage email notification log
CREATE POLICY "service_role_manage_email_log"
ON public.email_notification_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated admins to view email logs
CREATE POLICY "admins_view_email_log"
ON public.email_notification_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('superadmin', 'admin', 'warehouse_admin')
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'email_notification_queue', 'email_notification_log')
ORDER BY tablename;

-- List all policies on these tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'email_notification_queue', 'email_notification_log')
ORDER BY tablename, policyname;
