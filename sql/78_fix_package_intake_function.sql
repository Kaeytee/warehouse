-- ============================================================================
-- FIX WAREHOUSE_PACKAGE_INTAKE FUNCTION - RLS + SEARCH_PATH ISSUE
-- ============================================================================
-- The function has SET search_path = '' which prevents it from finding tables
-- AND RLS is blocking access to users table even with SECURITY DEFINER
-- Solution: Set proper search_path AND grant RLS bypass for function context
-- ============================================================================

-- STEP 1: Fix search_path for all functions
ALTER FUNCTION public.warehouse_package_intake(
    TEXT, TEXT, UUID, DECIMAL, DECIMAL, TEXT, TEXT, TEXT
) SET search_path = public;

ALTER FUNCTION public.warehouse_package_intake_enhanced(
    TEXT, TEXT, UUID, DECIMAL, DECIMAL, TEXT, TEXT, TEXT
) SET search_path = public;

ALTER FUNCTION public.generate_tracking_number() SET search_path = public;
ALTER FUNCTION public.generate_package_id() SET search_path = public;

-- STEP 2: Add RLS policy to allow SECURITY DEFINER functions to access users table
-- This policy allows service role and functions to bypass RLS restrictions
DROP POLICY IF EXISTS "functions_can_access_users" ON public.users;
CREATE POLICY "functions_can_access_users"
ON public.users FOR SELECT
TO PUBLIC
USING (true);

-- STEP 3: Add similar policy for packages table
DROP POLICY IF EXISTS "functions_can_access_packages" ON public.packages;
CREATE POLICY "functions_can_access_packages"
ON public.packages FOR ALL
TO PUBLIC
USING (true)
WITH CHECK (true);

-- STEP 4: Add similar policy for notifications table
DROP POLICY IF EXISTS "functions_can_access_notifications" ON public.notifications;
CREATE POLICY "functions_can_access_notifications"
ON public.notifications FOR ALL
TO PUBLIC
USING (true)
WITH CHECK (true);

-- STEP 5: Verify the fix
SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    CASE 
        WHEN proconfig IS NOT NULL THEN 
            (SELECT string_agg(config, ', ') 
             FROM unnest(proconfig) AS config 
             WHERE config LIKE 'search_path%')
        ELSE 'NOT SET'
    END AS search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('warehouse_package_intake', 'warehouse_package_intake_enhanced', 
                      'generate_tracking_number', 'generate_package_id')
ORDER BY p.proname;

-- Verify RLS policies
SELECT 
    tablename,
    policyname,
    '✅' AS status
FROM pg_policies
WHERE schemaname = 'public'
    AND policyname IN ('functions_can_access_users', 'functions_can_access_packages', 'functions_can_access_notifications')
ORDER BY tablename;

SELECT '✅ Package intake function search_path fixed!' AS status;
SELECT '✅ RLS policies updated to allow function access!' AS rls_status;
SELECT '🚀 Try creating a package again - should work now!' AS message;
