-- ============================================================================
-- FIX CUSTOMER ACCESS TO DELIVERY CODES
-- ============================================================================
-- Customers can't see their delivery codes due to RLS policies
-- This adds policies to allow customers to view their own package codes
-- ============================================================================

-- STEP 1: Add RLS policy for customers to view their own packages
DROP POLICY IF EXISTS "customers_view_own_packages" ON public.packages;

CREATE POLICY "customers_view_own_packages"
ON public.packages FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR
    -- Also allow if user is admin/warehouse staff
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'warehouse_admin', 'superadmin')
    )
);

-- STEP 2: Ensure get_customer_delivery_codes function has proper search_path
ALTER FUNCTION public.get_customer_delivery_codes(UUID) SET search_path = public, extensions;

-- STEP 3: Grant execute permission to authenticated users (customers)
GRANT EXECUTE ON FUNCTION public.get_customer_delivery_codes(UUID) TO authenticated;

-- STEP 4: Verify the policies
SELECT 
    '✅ Customer Access Policies' AS section,
    '' AS spacer;

SELECT 
    tablename,
    policyname,
    '✅' AS status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'packages'
    AND policyname = 'customers_view_own_packages';

-- STEP 5: Test query (replace with actual user_id)
SELECT 
    '📊 Example: How to query delivery codes' AS section,
    '' AS spacer;

-- Method 1: Use the function (RECOMMENDED)
SELECT 'Method 1: Use get_customer_delivery_codes() function' AS method;
SELECT '-- Example:' AS example;
SELECT '-- SELECT * FROM get_customer_delivery_codes(''<user_id>'')' AS query;

-- Method 2: Direct table query (now allowed with new policy)
SELECT 'Method 2: Direct table query' AS method;
SELECT '-- Example:' AS example;
SELECT '-- SELECT package_id, delivery_auth_code FROM packages' AS query_line1;
SELECT '-- WHERE user_id = auth.uid() AND status = ''arrived''' AS query_line2;
SELECT '-- AND delivery_auth_code IS NOT NULL' AS query_line3;

SELECT '✅ Customers can now see their own delivery codes!' AS final_status;
SELECT '🚀 Client app should now show codes' AS message;
