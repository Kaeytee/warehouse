-- ============================================================================
-- TEMPORARY: DISABLE RLS TO TEST IF IT'S CAUSING NETWORK ERRORS
-- ============================================================================
-- Run this to temporarily disable RLS and verify it's the cause
-- If dashboard works after this, then we know RLS policies are the problem
-- ============================================================================

-- Disable RLS on all main tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments DISABLE ROW LEVEL SECURITY;

SELECT '⚠️ RLS DISABLED - Dashboard should work now' AS status;
SELECT 'If dashboard works, RLS was the problem. Run sql/75_fix_all_rls_policies.sql to fix it properly.' AS next_step;
