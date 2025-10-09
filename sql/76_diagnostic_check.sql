-- ============================================================================
-- DIAGNOSTIC CHECK - Find Root Cause of Network Errors
-- ============================================================================
-- Run this to see what's causing the dashboard to fail
--
-- Author: Senior Software Engineer
-- Date: 2025-10-08
-- ============================================================================

-- Check 1: Do tables exist?
SELECT 
  'Table Check' AS test,
  expected.tablename,
  CASE WHEN pg_tables.tablename IS NOT NULL THEN '✅ Exists' ELSE '❌ Missing' END AS status
FROM (
  SELECT 'users'::text AS tablename
  UNION SELECT 'packages'
  UNION SELECT 'shipments'
  UNION SELECT 'consolidated_shipments'
) AS expected
LEFT JOIN pg_tables ON pg_tables.tablename = expected.tablename AND pg_tables.schemaname = 'public'
ORDER BY expected.tablename;

-- Check 2: Is RLS enabled?
SELECT 
  'RLS Status' AS test,
  tablename,
  CASE WHEN rowsecurity THEN '🔒 Enabled' ELSE '🔓 Disabled' END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'packages', 'shipments', 'consolidated_shipments')
ORDER BY tablename;

-- Check 3: Count policies (should not be recursive)
SELECT 
  'Policy Count' AS test,
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'packages', 'shipments', 'consolidated_shipments')
GROUP BY tablename
ORDER BY tablename;

-- Check 4: Test query on users table (this will show recursion error if policies are bad)
DO $$
BEGIN
  PERFORM COUNT(*) FROM public.users;
  RAISE NOTICE '✅ Users table query successful - No recursion!';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '❌ Users table query failed: %', SQLERRM;
END $$;

-- Check 5: Test query on packages table
DO $$
BEGIN
  PERFORM COUNT(*) FROM public.packages;
  RAISE NOTICE '✅ Packages table query successful!';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '❌ Packages table query failed: %', SQLERRM;
END $$;

-- Check 6: Show current policies on users table
SELECT 
  '🔍 Current Policies on Users Table' AS info,
  policyname,
  cmd AS operation,
  LEFT(qual::text, 50) AS using_clause,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- Final Diagnosis
SELECT 
  '📊 DIAGNOSIS COMPLETE' AS status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'users'
      AND qual::text LIKE '%FROM%users%'
    ) 
    THEN '❌ RECURSIVE POLICIES DETECTED - Run sql/75_fix_all_rls_policies.sql'
    ELSE '✅ Policies look OK'
  END AS result;
